const cron = require('node-cron');
const db = require('../config/db');
const { releaseEscrow } = require('./escrowService');
const { logAudit } = require('./auditService');

// Khởi tạo các tác vụ Cron định kỳ (SLA Automation)
const initSlaCron = () => {
  console.log('⏰ Khởi động SLA Automation Cronjobs (VibeBili.vn)...');

  // Chạy mỗi 30 phút một lần
  cron.schedule('*/30 * * * *', async () => {
    console.log(`[${new Date().toLocaleTimeString()}] Đang quét các đơn hàng vi phạm SLA và đến hạn giải ngân Escrow...`);

    // ========================================================
    // TÁC VỤ 1: Tự động hủy đơn hàng nếu Người Bán không xác nhận sau 48h
    // ========================================================
    let connection;
    try {
      connection = await db.getConnection();

      // Tìm các đơn hàng trạng thái 'Chờ xác nhận' quá 48 giờ
      const [overdueOrders] = await connection.query(
        `SELECT id, order_code, customer_id, total_amount 
         FROM Orders 
         WHERE status = 'Chờ xác nhận' 
           AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)`
      );

      for (const order of overdueOrders) {
        await connection.beginTransaction();

        // 1. Trả lại số lượng tồn kho (Rollback Inventory)
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

        // 2. Chuyển trạng thái đơn sang 'Đã hủy'
        await connection.query(
          `UPDATE Orders 
           SET status = 'Đã hủy', note = CONCAT(COALESCE(note, ''), ' [Hệ thống tự động hủy do Người Bán không xác nhận quá 48h]') 
           WHERE id = ?`,
          [order.id]
        );

        // 3. Ghi Audit Log
        await logAudit({
          action: 'SLA_AUTO_CANCEL_ORDER',
          resourceType: 'Orders',
          resourceId: order.id,
          newValues: { reason: 'Seller SLA 48h exceeded', auto_cancelled: true },
          connection
        });

        await connection.commit();
        console.log(`[SLA Cron] Đã tự động hủy đơn #${order.order_code} do quá hạn 48h`);
      }

    } catch (err) {
      if (connection) await connection.rollback();
      console.warn('[SLA Cron Error - Cancel Orders]:', err.message);
    } finally {
      if (connection) connection.release();
    }

    // ========================================================
    // TÁC VỤ 2: Tự động giải ngân Escrow sau 7 ngày kể từ khi 'Đã giao' nếu không có khiếu nại
    // ========================================================
    let escrowConn;
    try {
      escrowConn = await db.getConnection();

      // Tìm các đơn hàng đã giao quá 7 ngày mà tiền Escrow vẫn đang HOLDING
      const [matureEscrows] = await escrowConn.query(
        `SELECT eh.id, eh.order_id, eh.seller_id, eh.net_amount, o.order_code
         FROM EscrowHoldings eh
         JOIN Orders o ON eh.order_id = o.id
         LEFT JOIN OrderReturns r ON o.id = r.order_id AND r.status IN ('RETURN_REQUESTED', 'RETURN_REVIEWING')
         WHERE eh.status = 'HOLDING'
           AND o.status = 'Đã giao'
           AND (o.updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY) OR eh.auto_release_at <= NOW())
           AND r.id IS NULL`
      );

      for (const escrow of matureEscrows) {
        await escrowConn.beginTransaction();

        await releaseEscrow(escrowConn, escrow.order_id);

        await logAudit({
          action: 'SLA_AUTO_RELEASE_ESCROW',
          resourceType: 'EscrowHoldings',
          resourceId: escrow.id,
          newValues: { orderCode: escrow.order_code, netAmount: escrow.net_amount },
          connection: escrowConn
        });

        await escrowConn.commit();
        console.log(`[SLA Cron] Đã tự động giải ngân Escrow cho đơn #${escrow.order_code} (${escrow.net_amount.toLocaleString()}đ)`);
      }

    } catch (err) {
      if (escrowConn) await escrowConn.rollback();
      console.warn('[SLA Cron Error - Escrow Release]:', err.message);
    } finally {
      if (escrowConn) escrowConn.release();
    }

  });
};

module.exports = {
  initSlaCron
};
