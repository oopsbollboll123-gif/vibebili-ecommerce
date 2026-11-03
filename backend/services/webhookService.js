const crypto = require('crypto');
const db = require('../config/db');
const { logAudit } = require('./auditService');
const { holdEscrow } = require('./escrowService');

// 1. Xác thực chữ ký số VNPay IPN (HMAC-SHA512)
const verifyVNPaySignature = (query, secretKey) => {
  const vnp_SecureHash = query['vnp_SecureHash'];
  if (!vnp_SecureHash) return false;

  const secureHashType = query['vnp_SecureHashType'];
  delete query['vnp_SecureHash'];
  delete query['vnp_SecureHashType'];

  // Sắp xếp các tham số theo thứ tự alphabet a-z
  const sortedParams = {};
  const keys = Object.keys(query).sort();
  for (const key of keys) {
    if (query[key] !== '' && query[key] !== null && query[key] !== undefined) {
      sortedParams[key] = query[key];
    }
  }

  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return vnp_SecureHash.toLowerCase() === signed.toLowerCase();
};

// 2. Xác thực chữ ký số MoMo IPN (HMAC-SHA256)
const verifyMoMoSignature = (payload, secretKey) => {
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature
  } = payload;

  if (!signature) return false;

  const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY || ''}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const hmac = crypto.createHmac('sha256', secretKey);
  const calculatedSignature = hmac.update(rawSignature).digest('hex');

  return signature.toLowerCase() === calculatedSignature.toLowerCase();
};

// 3. Xử lý IPN thanh toán an toàn với Transaction & Row-level Locking (Idempotency)
const processPaymentWebhook = async ({
  orderCode,
  amountPaid,
  gateway,
  transactionId,
  isSuccess,
  req
}) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Khóa dòng Order để chống race condition IPN gửi trùng lặp (Idempotency)
    const [orderRows] = await connection.query(
      'SELECT id, customer_id, total_amount, payment_status, status FROM Orders WHERE order_code = ? FOR UPDATE',
      [orderCode]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      return { success: false, code: '01', message: 'Order not found' };
    }

    const order = orderRows[0];

    // Kiểm tra Idempotency: Nếu đơn hàng đã được ghi nhận thanh toán rồi thì không xử lý lại
    if (order.payment_status === 'paid') {
      await connection.commit();
      return { success: true, code: '02', message: 'Order already confirmed as paid' };
    }

    // Kiểm tra tính toàn vẹn số tiền
    if (Number(order.total_amount) !== Number(amountPaid)) {
      await connection.rollback();
      return { success: false, code: '04', message: 'Invalid amount mismatch' };
    }

    if (isSuccess) {
      // Cập nhật trạng thái Đơn hàng sang đã thanh toán
      await connection.query(
        `UPDATE Orders 
         SET payment_status = 'paid', status = 'Đang xử lý'
         WHERE id = ?`,
        [order.id]
      );

      // Chuyển tiền vào tài khoản tạm giữ trung gian (Escrow)
      await holdEscrow(connection, order.id, Number(order.total_amount));

      // Ghi Audit Log thanh toán
      await logAudit({
        userId: order.customer_id,
        action: 'PAYMENT_WEBHOOK_SUCCESS',
        resourceType: 'Orders',
        resourceId: order.id,
        newValues: { gateway, transactionId, amountPaid, payment_status: 'paid' },
        req,
        connection
      });

      await connection.commit();
      return { success: true, code: '00', message: 'Payment confirmed successfully and escrow held' };
    } else {
      await connection.query(
        'UPDATE Orders SET payment_status = "failed" WHERE id = ?',
        [order.id]
      );

      await logAudit({
        userId: order.customer_id,
        action: 'PAYMENT_WEBHOOK_FAILED',
        resourceType: 'Orders',
        resourceId: order.id,
        newValues: { gateway, transactionId, isSuccess: false },
        req,
        connection
      });

      await connection.commit();
      return { success: true, code: '00', message: 'Payment failure recorded' };
    }

  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  verifyVNPaySignature,
  verifyMoMoSignature,
  processPaymentWebhook
};
