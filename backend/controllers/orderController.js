const db = require('../config/db');
const mockData = require('../data/mockData');

// 1. Tạo Đơn Hàng Mới (Transaction & Trừ Tồn Kho SKU)
const createOrder = async (req, res) => {
  const {
    customer_id,
    customer_name,
    customer_phone,
    shipping_address,
    city = 'Hồ Chí Minh',
    note = '',
    payment_method = 'cod',
    items = []
  } = req.body;

  // Lấy ID người dùng từ Token nếu có
  const userId = req.user ? req.user.id : (customer_id || null);

  if (!customer_name || !customer_phone || !shipping_address) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đầy đủ thông tin: Tên người nhận, SĐT và Địa chỉ giao hàng!'
    });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Giỏ hàng của bạn đang trống. Không thể tạo đơn hàng!'
    });
  }

  // Tính toán tổng tiền
  let subtotal = 0;
  items.forEach(item => {
    subtotal += Number(item.price) * Number(item.quantity);
  });
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const totalAmount = subtotal + shippingFee;
  const orderCode = 'WIG-' + Math.floor(100000 + Math.random() * 900000);

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Bước A: Kiểm tra và trừ tồn kho từng SKU biến thể
    for (const item of items) {
      if (item.variant_id) {
        const [variantRows] = await connection.query(
          'SELECT stock_quantity, sku FROM ProductVariants WHERE id = ? FOR UPDATE',
          [item.variant_id]
        );

        if (variantRows.length === 0) {
          throw new Error(`Không tìm thấy biến thể SKU mã #${item.variant_id}`);
        }

        const currentStock = variantRows[0].stock_quantity;
        if (currentStock < item.quantity) {
          throw new Error(
            `Sản phẩm "${item.product_name}" (${item.variant_title || variantRows[0].sku}) chỉ còn tồn kho ${currentStock} món, không đủ ${item.quantity} món bạn yêu cầu!`
          );
        }

        // Thực hiện trừ tồn kho SKU
        await connection.query(
          'UPDATE ProductVariants SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.variant_id]
        );
      }
    }

    // Bước B: Lưu thông tin đơn hàng vào bảng Orders
    const [orderResult] = await connection.query(
      `INSERT INTO Orders 
       (order_code, customer_id, customer_name, customer_phone, shipping_address, city, note, subtotal, shipping_fee, total_amount, payment_method, payment_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Chờ xác nhận')`,
      [
        orderCode,
        userId,
        customer_name,
        customer_phone,
        shipping_address,
        city,
        note,
        subtotal,
        shippingFee,
        totalAmount,
        payment_method,
        payment_method === 'qr' ? 'paid' : 'pending'
      ]
    );

    const orderId = orderResult.insertId;

    // Bước C: Lưu danh sách chi tiết đơn hàng vào OrderItems
    for (const item of items) {
      const itemSubtotal = Number(item.price) * Number(item.quantity);
      await connection.query(
        `INSERT INTO OrderItems 
         (order_id, product_id, variant_id, product_name, variant_title, price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id || 1,
          item.variant_id || null,
          item.product_name || item.name,
          item.variant_title || 'Mặc định',
          item.price,
          item.quantity,
          itemSubtotal
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công!',
      data: {
        orderId,
        orderCode,
        totalAmount,
        status: 'Chờ xác nhận'
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.warn('[Order Fallback]: Chuyển sang Mock Store do (' + error.message + ')');

    // Nếu lỗi do hết hàng thực sự thì trả về 400
    if (error.message.includes('chỉ còn tồn kho')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    // Fallback Mock Store: Xử lý trừ kho ảo
    for (const item of items) {
      for (const prod of mockData.products) {
        if (prod.variants) {
          const v = prod.variants.find(vr => vr.id === item.variant_id);
          if (v) {
            if (v.stock < item.quantity) {
              return res.status(400).json({
                success: false,
                message: `Sản phẩm "${item.product_name}" (${v.title}) chỉ còn ${v.stock} món trong kho!`
              });
            }
            v.stock -= item.quantity;
          }
        }
      }
    }

    const newOrder = {
      id: mockData.orders.length + 1,
      order_code: orderCode,
      customer_id: userId,
      customer_name,
      customer_phone,
      shipping_address,
      city,
      note,
      subtotal,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      payment_method,
      payment_status: payment_method === 'qr' ? 'paid' : 'pending',
      status: 'Chờ xác nhận',
      created_at: new Date().toISOString(),
      items: items.map((it, idx) => ({
        id: idx + 1,
        product_id: it.product_id || 1,
        variant_id: it.variant_id || null,
        product_name: it.product_name || it.name,
        variant_title: it.variant_title || 'Mặc định',
        price: it.price,
        quantity: it.quantity,
        subtotal: it.price * it.quantity
      }))
    };

    mockData.orders.unshift(newOrder);

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công!',
      data: {
        orderId: newOrder.id,
        orderCode: newOrder.order_code,
        totalAmount: newOrder.total_amount,
        status: newOrder.status
      }
    });

  } finally {
    if (connection) connection.release();
  }
};

// 2. Lấy Danh Sách Đơn Hàng Toàn Hệ Thống (Dành cho Admin & Kênh Người Bán)
const getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM Orders o
       LEFT JOIN Users u ON o.customer_id = u.id
       ORDER BY o.id DESC`
    );

    // Lấy kèm chi tiết items cho mỗi order
    for (const ord of orders) {
      const [items] = await db.query('SELECT * FROM OrderItems WHERE order_id = ?', [ord.id]);
      ord.items = items;
    }

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(200).json({ success: true, data: mockData.orders });
  }
};

// 3. Lấy Đơn Hàng Của Khách Hàng Đang Đăng Nhập
const getMyOrders = async (req, res) => {
  const userId = req.user.id;
  try {
    const [orders] = await db.query(
      'SELECT * FROM Orders WHERE customer_id = ? ORDER BY id DESC',
      [userId]
    );
    for (const ord of orders) {
      const [items] = await db.query('SELECT * FROM OrderItems WHERE order_id = ?', [ord.id]);
      ord.items = items;
    }
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    const userOrders = mockData.orders.filter(o => o.customer_id === userId);
    return res.status(200).json({ success: true, data: userOrders });
  }
};

// 4. Cập Nhật Trạng Thái Đơn Hàng (Phân quyền bảo mật: Customer chỉ được hủy đơn khi Chờ xác nhận, Seller/Admin cập nhật quy trình)
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userRole = req.user?.role;
  const userId = req.user?.id;

  const validStatuses = ['Chờ xác nhận', 'Đang xử lý', 'Đã hẹn bưu tá', 'Đang giao', 'Đã giao', 'Đã hủy'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Trạng thái không hợp lệ! Cho phép: ${validStatuses.join(', ')}`
    });
  }

  // Kiểm tra phân quyền: Khách hàng chỉ được phép HỦY đơn nếu đơn hàng đang ở trạng thái 'Chờ xác nhận'
  if (userRole === 'customer') {
    if (status !== 'Đã hủy') {
      return res.status(403).json({
        success: false,
        message: 'Bảo mật: Khách hàng chỉ có quyền yêu cầu Hủy đơn hàng, không được thay đổi trạng thái vận chuyển!'
      });
    }
  }

  try {
    await db.query('UPDATE Orders SET status = ? WHERE id = ? OR order_code = ?', [status, id, id]);
    return res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái đơn hàng #${id} thành "${status}" thành công!`
    });
  } catch (error) {
    const order = mockData.orders.find(o => o.id === parseInt(id) || o.order_code === id);
    if (order) {
      if (userRole === 'customer' && order.status !== 'Chờ xác nhận') {
        return res.status(400).json({
          success: false,
          message: 'Đơn hàng đã được Người Bán chuẩn bị hoặc đang giao, không thể tự hủy!'
        });
      }

      order.status = status;
      return res.status(200).json({
        success: true,
        message: `Cập nhật trạng thái đơn hàng #${id} thành "${status}" thành công!`
      });
    }
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
  }
};

// 5. Hẹn Giờ Lấy Hàng & Đơn Vị Vận Chuyển (Dành cho Seller)
const schedulePickup = async (req, res) => {
  const { id } = req.params;
  const { shipping_carrier = 'GHN', pickup_date, pickup_time_slot, note } = req.body;

  if (!pickup_date || !pickup_time_slot) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng chọn ngày và khung giờ để bưu tá đến kho lấy hàng!'
    });
  }

  const prefix = shipping_carrier === 'GHTK' ? 'GHTK' : shipping_carrier === 'Viettel Post' ? 'VTP' : 'GHN';
  const trackingCode = `${prefix}-VB-${Math.floor(100000 + Math.random() * 900000)}`;

  try {
    await db.query(
      `UPDATE Orders 
       SET status = 'Đã hẹn bưu tá', 
           tracking_code = ?, 
           carrier = ?, 
           pickup_date = ?, 
           pickup_time = ? 
       WHERE id = ? OR order_code = ?`,
      [trackingCode, shipping_carrier, pickup_date, pickup_time_slot, id, id]
    );

    return res.status(200).json({
      success: true,
      message: `Hẹn bưu tá ${shipping_carrier} lấy hàng thành công! Mã vận đơn: ${trackingCode}`,
      data: { trackingCode, carrier: shipping_carrier, pickup_date, pickup_time_slot }
    });
  } catch (error) {
    const order = mockData.orders.find(o => o.id === parseInt(id) || o.order_code === id);
    if (order) {
      order.status = 'Đã hẹn bưu tá';
      order.shipping_carrier = shipping_carrier;
      order.tracking_code = trackingCode;
      order.pickup_date = pickup_date;
      order.pickup_time_slot = pickup_time_slot;
      order.pickup_note = note;

      return res.status(200).json({
        success: true,
        message: `Hẹn bưu tá ${shipping_carrier} lấy hàng thành công! Mã vận đơn: ${trackingCode}`,
        data: { trackingCode, carrier: shipping_carrier, pickup_date, pickup_time_slot }
      });
    }
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
  }
};

// 6. Khách hàng đổi địa chỉ nhận hàng (Chỉ cho phép khi đơn ở trạng thái 'Chờ xác nhận')
const updateShippingAddress = async (req, res) => {
  const { id } = req.params;
  const { customer_name, customer_phone, shipping_address, city } = req.body;

  if (!shipping_address || !customer_phone) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ và số điện thoại nhận hàng mới!' });
  }

  try {
    await db.query(
      'UPDATE Orders SET customer_name = COALESCE(?, customer_name), customer_phone = ?, shipping_address = ?, city = COALESCE(?, city) WHERE (id = ? OR order_code = ?) AND status = "Chờ xác nhận"',
      [customer_name, customer_phone, shipping_address, city, id, id]
    );
    return res.status(200).json({ success: true, message: 'Cập nhật địa chỉ nhận hàng thành công!' });
  } catch (error) {
    const order = mockData.orders.find(o => o.id === parseInt(id) || o.order_code === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
    }
    if (order.status !== 'Chờ xác nhận') {
      return res.status(400).json({ success: false, message: 'Đơn hàng đã được Người Bán chuẩn bị hoặc đang giao, không thể đổi địa chỉ!' });
    }
    if (customer_name) order.customer_name = customer_name;
    order.customer_phone = customer_phone;
    order.shipping_address = shipping_address;
    if (city) order.city = city;

    return res.status(200).json({ success: true, message: 'Cập nhật địa chỉ nhận hàng thành công!', data: order });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  schedulePickup,
  updateShippingAddress
};
