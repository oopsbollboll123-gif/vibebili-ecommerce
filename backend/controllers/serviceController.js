const mockData = require('../data/mockData');

// ==========================================
// 1. DỊCH VỤ SPA & PHỤC HỒI TÓC GIẢ (HẬU MÃI)
// ==========================================

// Khách hàng gửi yêu cầu Spa tóc
const createSpaRequest = async (req, res) => {
  const {
    wig_type,
    condition_description,
    service_type,
    service_price,
    image_url,
    customer_name,
    customer_phone,
    customer_address
  } = req.body;

  if (!wig_type || !condition_description || !customer_phone) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền đầy đủ loại tóc, mô tả tình trạng và số điện thoại liên hệ!'
    });
  }

  const newRequest = {
    id: `SPA-${Math.floor(1000 + Math.random() * 9000)}`,
    customer_id: req.user?.id || 4,
    customer_name: customer_name || req.user?.name || 'Khách hàng',
    customer_phone: customer_phone || req.user?.phone || '0909000000',
    customer_address: customer_address || req.user?.address || 'Hồ Chí Minh',
    wig_type,
    condition_description,
    service_type: service_type || 'Combo Spa Phục Hồi Chuyên Sâu',
    service_price: Number(service_price || 250000),
    image_url: image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
    status: 'Chờ tiếp nhận',
    created_at: new Date().toISOString().split('T')[0]
  };

  mockData.spaRequests.unshift(newRequest);

  return res.status(201).json({
    success: true,
    message: 'Gửi yêu cầu Spa tóc giả thành công! Chuyên viên chăm sóc sẽ liên hệ để xác nhận.',
    data: newRequest
  });
};

// Khách hàng xem lịch sử yêu cầu Spa tóc của mình
const getCustomerSpaRequests = async (req, res) => {
  const userId = req.user?.id || 4;
  const list = mockData.spaRequests.filter(r => r.customer_id === userId);
  return res.status(200).json({ success: true, data: list });
};

// Seller / Ban Vận Hành xem danh sách tiếp nhận yêu cầu Spa tóc
const getSellerSpaRequests = async (req, res) => {
  return res.status(200).json({ success: true, data: mockData.spaRequests });
};

// Seller / Kỹ thuật viên cập nhật tiến độ Spa tóc
const updateSpaStatus = async (req, res) => {
  const { id } = req.params;
  const { status, pickup_date, note } = req.body;

  const item = mockData.spaRequests.find(r => r.id === id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu Spa!' });
  }

  if (status) item.status = status;
  if (pickup_date) item.pickup_date = pickup_date;
  if (note) item.technician_note = note;

  return res.status(200).json({
    success: true,
    message: `Đã cập nhật trạng thái yêu cầu Spa [${id}] thành: "${status}"!`,
    data: item
  });
};

// ==========================================
// 2. CÔNG CỤ MARKETING & KHUYẾN MÃI (SELLER)
// ==========================================

// Lấy danh sách Voucher của shop
const getVouchers = async (req, res) => {
  return res.status(200).json({ success: true, data: mockData.vouchers });
};

// Seller tạo Voucher khuyến mãi mới
const createVoucher = async (req, res) => {
  const {
    code,
    discount_type = 'percent',
    discount_value,
    min_order_value = 0,
    max_discount,
    usage_limit = 100,
    start_date,
    end_date
  } = req.body;

  if (!code || !discount_value) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập Mã Voucher và Giá trị giảm giá!' });
  }

  const existing = mockData.vouchers.find(v => v.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'Mã Voucher này đã tồn tại!' });
  }

  const newVoucher = {
    id: mockData.vouchers.length + 1,
    seller_id: req.user?.id || 2,
    code: code.toUpperCase().trim(),
    discount_type,
    discount_value: Number(discount_value),
    min_order_value: Number(min_order_value),
    max_discount: Number(max_discount || discount_value),
    usage_limit: Number(usage_limit),
    used_count: 0,
    start_date: start_date || new Date().toISOString().split('T')[0],
    end_date: end_date || '2026-12-31',
    status: 'active'
  };

  mockData.vouchers.unshift(newVoucher);

  return res.status(201).json({
    success: true,
    message: `Tạo mã khuyến mãi [${newVoucher.code}] thành công!`,
    data: newVoucher
  });
};

// Xóa Voucher
const deleteVoucher = async (req, res) => {
  const { id } = req.params;
  const idx = mockData.vouchers.findIndex(v => v.id === parseInt(id));
  if (idx !== -1) {
    mockData.vouchers.splice(idx, 1);
  }
  return res.status(200).json({ success: true, message: 'Xóa mã khuyến mãi thành công!' });
};

// ==========================================
// 3. BÁO CÁO TÀI CHÍNH & VÍ SHOP (SELLER FINANCE)
// ==========================================

const getSellerFinance = async (req, res) => {
  const sellerId = req.user?.id || 2;
  const finance = mockData.sellerFinances[sellerId] || {
    available_balance: 12500000,
    escrow_balance: 3200000,
    total_withdrawn: 35000000,
    bank_account: {
      bank_name: 'MB Bank',
      account_number: '98230188999',
      account_holder: 'TRAN THI MAI',
      branch: 'Chi nhánh Sài Gòn'
    },
    badges: ['mall', 'favorite_plus', 'virgin_hair_certified'],
    withdrawal_history: []
  };

  return res.status(200).json({ success: true, data: finance });
};

// Cập nhật thông tin tài khoản ngân hàng thụ hưởng
const updateBankAccount = async (req, res) => {
  const sellerId = req.user?.id || 2;
  const { bank_name, account_number, account_holder, branch } = req.body;

  if (!bank_name || !account_number || !account_holder) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đủ Tên ngân hàng, Số tài khoản và Tên chủ tài khoản!' });
  }

  if (!mockData.sellerFinances[sellerId]) {
    mockData.sellerFinances[sellerId] = {
      available_balance: 0,
      escrow_balance: 0,
      total_withdrawn: 0,
      withdrawal_history: [],
      badges: ['mall', 'favorite_plus', 'virgin_hair_certified']
    };
  }

  mockData.sellerFinances[sellerId].bank_account = {
    bank_name,
    account_number,
    account_holder: account_holder.toUpperCase(),
    branch: branch || 'Toàn quốc'
  };

  return res.status(200).json({
    success: true,
    message: 'Cập nhật tài khoản ngân hàng nhận tiền thành công!',
    data: mockData.sellerFinances[sellerId].bank_account
  });
};

// Yêu cầu rút tiền về tài khoản ngân hàng
const requestWithdrawal = async (req, res) => {
  const sellerId = req.user?.id || 2;
  const { amount } = req.body;
  const numAmount = Number(amount);

  const finance = mockData.sellerFinances[sellerId];
  if (!finance || finance.available_balance < numAmount) {
    return res.status(400).json({
      success: false,
      message: 'Số dư khả dụng không đủ để thực hiện yêu cầu rút tiền!'
    });
  }

  finance.available_balance -= numAmount;
  finance.total_withdrawn += numAmount;

  const withdrawalRecord = {
    id: `WD-${Math.floor(1000 + Math.random() * 9000)}`,
    amount: numAmount,
    status: 'Thành công',
    created_at: new Date().toISOString().split('T')[0],
    bank: `${finance.bank_account?.bank_name || 'MB Bank'} ***${String(finance.bank_account?.account_number || '888').slice(-3)}`
  };

  finance.withdrawal_history.unshift(withdrawalRecord);

  return res.status(200).json({
    success: true,
    message: `Yêu cầu rút tiền ${numAmount.toLocaleString()}đ thành công! Tiền sẽ về tài khoản trong 24 giờ.`,
    data: withdrawalRecord,
    newBalance: finance.available_balance
  });
};

module.exports = {
  createSpaRequest,
  getCustomerSpaRequests,
  getSellerSpaRequests,
  updateSpaStatus,
  getVouchers,
  createVoucher,
  deleteVoucher,
  getSellerFinance,
  updateBankAccount,
  requestWithdrawal
};
