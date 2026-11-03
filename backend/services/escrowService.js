const db = require('../config/db');
const { logAudit } = require('./auditService');

const PLATFORM_FEE_PERCENT = 0.05; // Phí sàn 5%

// 1. Tạm giữ tiền vào Escrow khi đơn hàng thanh toán thành công
const holdEscrow = async (connection, orderId, totalAmount) => {
  // Lấy seller_id của đơn hàng qua bảng Products
  const [items] = await connection.query(
    `SELECT p.seller_id 
     FROM OrderItems oi 
     JOIN Products p ON oi.product_id = p.id 
     WHERE oi.order_id = ? 
     LIMIT 1`,
    [orderId]
  );

  const sellerId = items.length > 0 ? items[0].seller_id : 2; // Default seller nếu mock
  const platformFee = Math.round(Number(totalAmount) * PLATFORM_FEE_PERCENT);
  const netAmount = Number(totalAmount) - platformFee;

  // Đảm bảo Seller đã có Ví
  await connection.query(
    `INSERT INTO SellerWallets (seller_id, balance, escrow_balance)
     VALUES (?, 0.00, 0.00)
     ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
    [sellerId]
  );

  // Tạo bản ghi Escrow
  await connection.query(
    `INSERT INTO EscrowHoldings 
     (order_id, seller_id, amount, platform_fee, net_amount, status)
     VALUES (?, ?, ?, ?, ?, 'HOLDING')`,
    [orderId, sellerId, totalAmount, platformFee, netAmount]
  );

  // Tăng số dư tạm giữ trong ví của Seller
  await connection.query(
    `UPDATE SellerWallets 
     SET escrow_balance = escrow_balance + ? 
     WHERE seller_id = ?`,
    [netAmount, sellerId]
  );
};

// 2. Giải ngân tiền từ Escrow vào ví khả dụng của Seller
const releaseEscrow = async (connection, orderId) => {
  // Khóa dòng Escrow với FOR UPDATE
  const [escrowRows] = await connection.query(
    'SELECT * FROM EscrowHoldings WHERE order_id = ? AND status = "HOLDING" FOR UPDATE',
    [orderId]
  );

  if (escrowRows.length === 0) {
    return { success: false, message: 'Không có khoản tiền Escrow nào đang tạm giữ cho đơn này' };
  }

  const escrow = escrowRows[0];
  const { seller_id, net_amount } = escrow;

  // Khóa dòng ví Seller để cập nhật số dư an toàn
  const [walletRows] = await connection.query(
    'SELECT id, balance, escrow_balance FROM SellerWallets WHERE seller_id = ? FOR UPDATE',
    [seller_id]
  );

  if (walletRows.length === 0) {
    throw new Error(`Không tìm thấy ví cho Seller ID #${seller_id}`);
  }

  const wallet = walletRows[0];
  const balanceBefore = Number(wallet.balance);
  const balanceAfter = balanceBefore + Number(net_amount);

  // Cập nhật số dư ví: trừ escrow_balance, cộng balance khả dụng
  await connection.query(
    `UPDATE SellerWallets 
     SET balance = balance + ?, 
         escrow_balance = GREATEST(0, escrow_balance - ?) 
     WHERE seller_id = ?`,
    [net_amount, net_amount, seller_id]
  );

  // Ghi lịch sử biến động số dư ví
  await connection.query(
    `INSERT INTO WalletTransactions 
     (wallet_id, seller_id, transaction_type, amount, balance_before, balance_after, reference_id, status, note)
     VALUES (?, ?, 'ESCROW_RELEASE', ?, ?, ?, ?, 'COMPLETED', 'Giải ngân tiền đơn hàng hoàn tất')`,
    [wallet.id, seller_id, net_amount, balanceBefore, balanceAfter, String(orderId)]
  );

  // Đổi trạng thái Escrow sang RELEASED
  await connection.query(
    'UPDATE EscrowHoldings SET status = "RELEASED", released_at = CURRENT_TIMESTAMP WHERE id = ?',
    [escrow.id]
  );

  return { success: true, netAmount: net_amount, sellerId: seller_id };
};

// 3. Rút tiền từ ví Seller (Chống Concurrent Withdrawals với Row-level Lock FOR UPDATE)
const withdrawFunds = async (sellerId, amount, req = null) => {
  const withdrawAmount = Number(amount);
  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    throw new Error('Số tiền rút không hợp lệ!');
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Khóa dòng ví bằng FOR UPDATE (Bắt buộc) để ngăn chặn 2 request đồng thời rút vượt số dư
    const [wallets] = await connection.query(
      'SELECT id, balance, total_withdrawn FROM SellerWallets WHERE seller_id = ? FOR UPDATE',
      [sellerId]
    );

    if (wallets.length === 0) {
      throw new Error('Không tìm thấy thông tin ví của người bán!');
    }

    const wallet = wallets[0];
    const currentBalance = Number(wallet.balance);

    if (currentBalance < withdrawAmount) {
      throw new Error(`Số dư ví (${currentBalance.toLocaleString()}đ) không đủ để rút ${withdrawAmount.toLocaleString()}đ!`);
    }

    const newBalance = currentBalance - withdrawAmount;

    // Trừ số dư khả dụng và ghi nhận số tiền đã rút
    await connection.query(
      `UPDATE SellerWallets 
       SET balance = balance - ?, 
           total_withdrawn = total_withdrawn + ? 
       WHERE seller_id = ?`,
      [withdrawAmount, withdrawAmount, sellerId]
    );

    // Ghi nhận lịch sử giao dịch rút tiền
    const withdrawRef = 'WD-' + Date.now();
    await connection.query(
      `INSERT INTO WalletTransactions 
       (wallet_id, seller_id, transaction_type, amount, balance_before, balance_after, reference_id, status, note)
       VALUES (?, ?, 'WITHDRAW', ?, ?, ?, ?, 'COMPLETED', 'Yêu cầu rút tiền về tài khoản ngân hàng')`,
      [wallet.id, sellerId, withdrawAmount, currentBalance, newBalance, withdrawRef]
    );

    // Ghi Audit Log hành động rút tiền
    await logAudit({
      userId: sellerId,
      action: 'SELLER_WITHDRAW_FUNDS',
      resourceType: 'SellerWallets',
      resourceId: wallet.id,
      oldValues: { balance: currentBalance },
      newValues: { balance: newBalance, amountWithdrawn: withdrawAmount, reference: withdrawRef },
      req,
      connection
    });

    await connection.commit();

    return {
      success: true,
      withdrawRef,
      amountWithdrawn: withdrawAmount,
      remainingBalance: newBalance
    };

  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  holdEscrow,
  releaseEscrow,
  withdrawFunds
};
