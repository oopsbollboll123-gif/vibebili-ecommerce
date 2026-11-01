const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Hàm chung gửi request HTTP tới Backend
const request = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('vibebili_token') || localStorage.getItem('wigvogue_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Lỗi xử lý từ máy chủ API');
    }
    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
};

// 1. Phân hệ Xác thực & Người dùng (Auth & Users)
export const authAPI = {
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  registerSeller: (sellerData) => request('/auth/register-seller', {
    method: 'POST',
    body: JSON.stringify(sellerData)
  }),
  upgradeToSeller: (sellerData) => request('/auth/upgrade-seller', {
    method: 'POST',
    body: JSON.stringify(sellerData)
  }),
  getMe: () => request('/auth/me'),
  getAllUsers: () => request('/auth/users'),
  updateUserRole: (userId, data) => request(`/auth/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getPendingSellers: () => request('/auth/admin/pending-sellers')
};

// 2. Phân hệ Sản phẩm & Danh mục (Products & Categories)
export const productAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.combo) query.append('combo', 'true');
    const queryString = query.toString();
    return request(`/products${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => request(`/products/${id}`),
  create: (productData) => request('/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),
  bulkCreate: (items) => request('/products/bulk', {
    method: 'POST',
    body: JSON.stringify({ items })
  }),
  delete: (id) => request(`/products/${id}`, {
    method: 'DELETE'
  }),
  getCategories: () => request('/products/categories'),
  getReviews: (id) => request(`/products/${id}/reviews`),
  createReview: (id, reviewData) => request(`/products/${id}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData)
  })
};

// 3. Phân hệ Đơn hàng (Orders & Checkout)
export const orderAPI = {
  createOrder: (orderData) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),
  getAllOrders: () => request('/orders'),
  getMyOrders: () => request('/orders/my-orders'),
  updateStatus: (orderId, status) => request(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  schedulePickup: (orderId, pickupData) => request(`/orders/${orderId}/pickup`, {
    method: 'PUT',
    body: JSON.stringify(pickupData)
  }),
  updateAddress: (orderId, addressData) => request(`/orders/${orderId}/address`, {
    method: 'PUT',
    body: JSON.stringify(addressData)
  })
};

// 4. Phân hệ AI 2-in-1 Virtual Try-On (Thử đồng thời Quần áo & Tóc giả)
export const tryOnAPI = {
  getPresets: () => request('/try-on/presets'),
  generateTryOn: (payload) => request('/try-on/generate', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
};

// 5. Phân hệ Dịch vụ Spa Tóc, Marketing & Tài chính Shop
export const serviceAPI = {
  // Spa tóc
  createSpaRequest: (data) => request('/services/spa', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMySpaRequests: () => request('/services/spa/my'),
  getSellerSpaRequests: () => request('/services/spa/seller'),
  updateSpaStatus: (id, data) => request(`/services/spa/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Marketing & Vouchers
  getVouchers: () => request('/services/marketing/vouchers'),
  createVoucher: (data) => request('/services/marketing/vouchers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteVoucher: (id) => request(`/services/marketing/vouchers/${id}`, {
    method: 'DELETE'
  }),

  // Tài chính & Ví Shop
  getFinance: () => request('/services/finance'),
  updateBankAccount: (data) => request('/services/finance/bank-account', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  requestWithdrawal: (amount) => request('/services/finance/withdraw', {
    method: 'POST',
    body: JSON.stringify({ amount })
  })
};
