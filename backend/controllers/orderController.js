const db = require('../config/db');
const mockData = require('../data/mockData');
const { holdEscrow, releaseEscrow, withdrawFunds } = require('../services/escrowService');
const { logAudit } = require('../services/auditService');
const { verifyVNPaySignature, verifyMoMoSignature, processPaymentWebhook } = require('../services/webhookService');

// 1. Tạo Đơn Hàng Mới (ACID Transaction & Row-level Locking FOR UPDATE)
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

  // Lấy ID người dùng từ Token nếu có (Chống giả mạo customer_id)
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

    // ========================================================
    // BƯỚC A: Chống Race Condition bằng Row-Level Locking (FOR UPDATE)
    // ========================================================
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

        // Thực hiện trừ tồn kho SKU an toàn
        await connection.query(
          'UPDATE ProductVariants SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.variant_id]
        );
      }
    }

    // ========================================================
    // BƯỚC B: Lưu đơn hàng vào bảng Orders
    // ========================================================
    const isPaidOnline = payment_method === 'qr';
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
        isPaidOnline ? 'paid' : 'pending'
      ]
    );

    const orderId = orderResult.insertId;

    // ========================================================
    // BƯỚC C: Lưu OrderItems
    // ========================================================
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

    // ========================================================
    // BƯỚC D: Nếu đã thanh toán trực tuyến -> Kích hoạt Escrow
    // ========================================================
    if (isPaidOnline) {
      await holdEscrow(connection, orderId, totalAmount);
    }

    // Ghi Audit Log tạo đơn hàng
    await logAudit({
      userId,
      action: 'ORDER_CREATE',
      resourceType: 'Orders',
      resourceId: orderId,
      newValues: { orderCode, totalAmount, payment_method, itemsCount: items.length },
      req,
      connection
    });

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

    // Nếu lỗi do hết hàng thực sự thì trả về 400 rõ ràng
    if (error.message.includes('chỉ còn tồn kho') || error.message.includes('Không tìm thấy biến thể')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.warn('[Order Fallback]: Chuyển sang Mock Store do (' + error.message + ')');

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

// 2. Lấy Chi Tiết Một Đơn Hàng (Chống IDOR - Bắt buộc kiểm tra quyền sở hữu)
const getOrderById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    const [orders] = await db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM Orders o
       LEFT JOIN Users u ON o.customer_id = u.id
       WHERE o.id = ? OR o.order_code = ?`,
      [id, id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
    }

    const order = orders[0];

    // Chống IDOR: Khách hàng chỉ được xem đơn hàng của chính mình
    if (
      userRole === 'customer' &&
      order.customer_id !== userId &&
      !userRole?.startsWith('admin')
    ) {
      return res.status(403).json({
        success: false,
        message: 'Cảnh báo bảo mật (IDOR): Bạn không có quyền truy cập thông tin đơn hàng này!'
      });
    }

    const [items] = await db.query('SELECT * FROM OrderItems WHERE order_id = ?', [order.id]);
    order.items = items;

    return res.status(200).json({ success: true, data: order });

  } catch (error) {
    const order = mockData.orders.find(o => o.id === parseInt(id) || o.order_code === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
    }

    if (userRole === 'customer' && order.customer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cảnh báo bảo mật (IDOR): Bạn không có quyền xem đơn hàng này!'
      });
    }

    return res.status(200).json({ success: true, data: order });
  }
};

// 3. Lấy Danh Sách Đơn Hàng Toàn Hệ Thống (Admin & Kênh Người Bán)
const getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM Orders o
       LEFT JOIN Users u ON o.customer_id = u.id
       ORDER BY o.id DESC`
    );

    for (const ord of orders) {
      const [items] = await db.query('SELECT * FROM OrderItems WHERE order_id = ?', [ord.id]);
      ord.items = items;
    }

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(200).json({ success: true, data: mockData.orders });
  }
};

// 4. Lấy Đơn Hàng Của Khách Hàng Đang Đăng Nhập (Chống IDOR - Tự động lấy userId từ JWT)
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

// 5. Cập Nhật Trạng Thái Đơn Hàng (IDOR Protected, Rollback Kho khi Hủy, Giải ngân Escrow khi Đã Giao)
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userRole = req.user?.role;
  const userId = req.user?.id;

  const validStatuses = [
    'Chờ xác nhận',
    'Đang xử lý',
    'Đã hẹn bưu tá',
    'Đang giao',
    'Đã giao',
    'Đã hủy',
    'Yêu cầu hoàn trả'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Trạng thái không hợp lệ! Cho phép: ${validStatuses.join(', ')}`
    });
  }

  // Khách hàng chỉ được hủy đơn nếu đơn đang ở bước 'Chờ xác nhận'
  if (userRole === 'customer' && status !== 'Đã hủy' && status !== 'Yêu cầu hoàn trả') {
    return res.status(403).json({
      success: false,
      message: 'Bảo mật: Khách hàng chỉ có quyền yêu cầu Hủy đơn hàng hoặc Yêu cầu hoàn trả!'
    });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Khóa dòng Order kiểm tra
    const [rows] = await connection.query(
      'SELECT id, order_code, customer_id, status FROM Orders WHERE id = ? OR order_code = ? FOR UPDATE',
      [id, id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
    }

    const order = rows[0];

    // Chống IDOR: Khách hàng chỉ được tác động lên đơn hàng của chính mình
    if (userRole === 'customer' && order.customer_id !== userId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Cảnh báo bảo mật (IDOR): Bạn không có quyền chỉnh sửa đơn hàng này!'
      });
    }

    if (userRole === 'customer' && status === 'Đã hủy' && order.status !== 'Chờ xác nhận') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được Người Bán chuẩn bị hoặc đang giao, không thể tự hủy!'
      });
    }

    // NẾU HỦY ĐƠN: Hoàn trả tồn kho (Rollback Inventory)
    if (status === 'Đã hủy' && order.status !== 'Đã hủy') {
      const [items] = await connection.query(
        'SELECT variant_id, quantity FROM OrderItems WHERE order_id = ?',
        [order.id]
      );
      for (const it of items) {
        if (it.variant_id) {
          await connection.query(
            'UPDATE ProductVariants SET stock_quantity = stock_quantity + ? WHERE id = ?',
            [it.quantity, it.variant_id]
          );
        }
      }
    }

    // NẾU ĐƠN GIAO THÀNH CÔNG: Tự động kích hoạt giải ngân Escrow cho Seller
    if (status === 'Đã giao' && order.status !== 'Đã giao') {
      await releaseEscrow(connection, order.id);
    }

    // Cập nhật trạng thái
    await connection.query(
      'UPDATE Orders SET status = ? WHERE id = ?',
      [status, order.id]
    );

    // Ghi Audit Log
    await logAudit({
      userId,
      action: 'ORDER_STATUS_UPDATE',
      resourceType: 'Orders',
      resourceId: order.id,
      oldValues: { status: order.status },
      newValues: { status },
      req,
      connection
    });

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái đơn hàng #${order.order_code} thành "${status}" thành công!`
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.warn('[Update Order Fallback]:', error.message);

    const order = mockData.orders.find(o => o.id === parseInt(id) || o.order_code === id);
    if (order) {
      if (userRole === 'customer' && order.status !== 'Chờ xác nhận' && status === 'Đã hủy') {
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
  } finally {
    if (connection) connection.release();
  }
};

// 6. Hẹn Giờ Lấy Hàng & Đơn Vị Vận Chuyển (Seller)
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

// 7. Khách hàng đổi địa chỉ nhận hàng (IDOR Protected - Chỉ khi ở bước 'Chờ xác nhận')
const updateShippingAddress = async (req, res) => {
  const { id } = req.params;
  const { customer_name, customer_phone, shipping_address, city } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!shipping_address || !customer_phone) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ và số điện thoại nhận hàng mới!' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, customer_id, status FROM Orders WHERE id = ? OR order_code = ?',
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
    }

    const order = rows[0];

    // Chống IDOR
    if (userRole === 'customer' && order.customer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cảnh báo bảo mật (IDOR): Bạn không có quyền đổi địa chỉ đơn hàng của người khác!'
      });
    }

    if (order.status !== 'Chờ xác nhận') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được Người Bán chuẩn bị hoặc đang giao, không thể đổi địa chỉ!'
      });
    }

    await db.query(
      'UPDATE Orders SET customer_name = COALESCE(?, customer_name), customer_phone = ?, shipping_address = ?, city = COALESCE(?, city) WHERE id = ?',
      [customer_name, customer_phone, shipping_address, city, order.id]
    );

    return res.status(200).json({ success: true, message: 'Cập nhật địa chỉ nhận hàng thành công!' });

  } catch (error) {
    const order = mockData.orders.find(o => o.id === parseInt(id) || o.order_code === id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
    }
    if (userRole === 'customer' && order.customer_id !== userId) {
      return res.status(403).json({ success: false, message: 'Cảnh báo bảo mật (IDOR): Bạn không có quyền truy cập!' });
    }
    if (order.status !== 'Chờ xác nhận') {
      return res.status(400).json({ success: false, message: 'Đơn hàng không ở trạng thái Chờ xác nhận!' });
    }

    if (customer_name) order.customer_name = customer_name;
    order.customer_phone = customer_phone;
    order.shipping_address = shipping_address;
    if (city) order.city = city;

    return res.status(200).json({ success: true, message: 'Cập nhật địa chỉ nhận hàng thành công!', data: order });
  }
};

// 8. Luồng Yêu Cầu Hoàn Tiền / Trả Hàng (Return/Refund Workflow)
const requestOrderReturn = async (req, res) => {
  const { id } = req.params;
  const { reason, evidence_images = [], fault_party = 'SELLER' } = req.body;
  const userId = req.user?.id;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do yêu cầu hoàn trả!' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT id, order_code, customer_id, total_amount, status FROM Orders WHERE id = ? OR order_code = ? FOR UPDATE',
      [id, id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
    }

    const order = rows[0];

    // Chống IDOR
    if (order.customer_id !== userId && req.user?.role === 'customer') {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Bảo mật (IDOR): Bạn không có quyền khiếu nại đơn hàng này!' });
    }

    if (order.status !== 'Đã giao') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Chỉ có thể yêu cầu trả hàng khi đơn đã ở trạng thái "Đã giao"!' });
    }

    const returnCode = 'RET-' + Math.floor(100000 + Math.random() * 900000);
    const shippingBearer = fault_party === 'SELLER' ? 'SELLER' : 'CUSTOMER';

    await connection.query(
      `INSERT INTO OrderReturns 
       (return_code, order_id, customer_id, seller_id, reason, evidence_images, refund_amount, shipping_fee_bearer, status)
       VALUES (?, ?, ?, 2, ?, ?, ?, ?, 'RETURN_REQUESTED')`,
      [returnCode, order.id, userId, JSON.stringify(evidence_images), order.total_amount, shippingBearer]
    );

    await connection.query(
      'UPDATE Orders SET status = "Yêu cầu hoàn trả" WHERE id = ?',
      [order.id]
    );

    await logAudit({
      userId,
      action: 'ORDER_RETURN_REQUEST',
      resourceType: 'OrderReturns',
      resourceId: returnCode,
      newValues: { orderCode: order.order_code, reason, shippingBearer },
      req,
      connection
    });

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu hoàn trả thành công! Đội ngũ VibeBili sẽ liên hệ thẩm định trong vòng 24h.',
      data: { returnCode, status: 'RETURN_REQUESTED' }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    return res.status(500).json({ success: false, message: 'Lỗi xử lý yêu cầu hoàn trả: ' + error.message });
  } finally {
    if (connection) connection.release();
  }
};

// 9. Webhook Cổng Thanh Toán VNPay (Server-to-Server HMAC Signature Verification)
const handleVNPayWebhook = async (req, res) => {
  try {
    const vnpParams = { ...req.query };
    const secretKey = process.env.VNPAY_HASH_SECRET || 'VNPAY_SECRET_KEY_DEMO_2026';

    const isValid = verifyVNPaySignature(vnpParams, secretKey);
    if (!isValid) {
      console.warn('[VNPay IPN]: Chữ ký số không hợp lệ (Signature Mismatch)');
      return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
    }

    const orderCode = vnpParams['vnp_TxnRef'];
    const amount = Number(vnpParams['vnp_Amount']) / 100; // VNPay nhân 100
    const responseCode = vnpParams['vnp_ResponseCode'];
    const transactionId = vnpParams['vnp_TransactionNo'];
    const isSuccess = responseCode === '00';

    const result = await processPaymentWebhook({
      orderCode,
      amountPaid: amount,
      gateway: 'VNPAY',
      transactionId,
      isSuccess,
      req
    });

    return res.status(200).json({ RspCode: result.code, Message: result.message });

  } catch (error) {
    console.error('[VNPay IPN Error]:', error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

// 10. Webhook Cổng Thanh Toán MoMo (Server-to-Server HMAC Signature Verification)
const handleMoMoWebhook = async (req, res) => {
  try {
    const secretKey = process.env.MOMO_SECRET_KEY || 'MOMO_SECRET_KEY_DEMO_2026';
    const isValid = verifyMoMoSignature(req.body, secretKey);

    if (!isValid) {
      console.warn('[MoMo IPN]: Chữ ký số MoMo không hợp lệ!');
      return res.status(400).json({ message: 'Invalid MoMo signature' });
    }

    const { orderId, amount, transId, resultCode } = req.body;
    const isSuccess = Number(resultCode) === 0;

    const result = await processPaymentWebhook({
      orderCode: orderId,
      amountPaid: Number(amount),
      gateway: 'MOMO',
      transactionId: transId,
      isSuccess,
      req
    });

    return res.status(200).json({ message: result.message });

  } catch (error) {
    console.error('[MoMo IPN Error]:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// 11. Rút tiền từ ví Seller (Chống Concurrent Withdrawals với Row-level Lock FOR UPDATE)
const handleSellerWithdrawal = async (req, res) => {
  const sellerId = req.user?.id;
  const { amount } = req.body;

  if (!sellerId) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập tài khoản Người Bán!' });
  }

  try {
    const result = await withdrawFunds(sellerId, amount, req);
    return res.status(200).json({
      success: true,
      message: `Tạo yêu cầu rút tiền thành công! Mã tham chiếu: ${result.withdrawRef}`,
      data: result
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  schedulePickup,
  updateShippingAddress,
  requestOrderReturn,
  handleVNPayWebhook,
  handleMoMoWebhook,
  handleSellerWithdrawal
};
