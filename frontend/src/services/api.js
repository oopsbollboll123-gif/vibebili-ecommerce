import {
  fetchCloudProducts,
  syncProductToCloud,
  bulkSyncProductsToCloud,
  deleteProductFromCloud,
  syncOrderToCloud,
  fetchCloudOrders
} from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Hàm chung gửi request HTTP tới Backend có timeout an toàn chống treo UI
const request = async (endpoint, options = {}) => {
  const isTryOn = endpoint.includes('try-on') || endpoint.includes('tryon');
  const timeoutMs = options.timeout || (isTryOn ? 180000 : 8000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const token = localStorage.getItem('vibebili_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ? `${data.message}: ${data.error}` : (data.message || 'Lỗi xử lý từ máy chủ API'));
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[API Info] ${endpoint}: ${error.message}`);
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
  getPendingSellers: () => request('/auth/admin/pending-sellers'),

  // Quên mật khẩu: Gửi mã OTP đến Gmail của user
  forgotPassword: (email) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),

  // Xác thực mã OTP
  verifyOTP: (email, otp) => request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp })
  }),

  // Đặt lại mật khẩu sau khi xác thực OTP
  resetPassword: (data) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Thông báo đến admin về tài khoản mới đăng ký
  notifyNewUser: (userData) => request('/auth/admin/notify-new-user', {
    method: 'POST',
    body: JSON.stringify(userData)
  })
};

// 2. Phân hệ Sản phẩm & Danh mục (Products & Categories - Hỗ trợ Cloud Database Firestore)
export const productAPI = {
  getAll: async (params = {}) => {
    // 1. Ưu tiên đọc từ Cloud Firestore nếu đã kết nối
    try {
      const cloudProds = await fetchCloudProducts();
      if (cloudProds && cloudProds.length > 0) {
        let filtered = cloudProds;
        if (params.category && params.category !== 'all') {
          const cat = params.category.toLowerCase();
          filtered = filtered.filter(p => {
            const cName = (p.category_name || p.category || '').toLowerCase();
            return cName.includes(cat);
          });
        }
        if (params.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(q));
        }
        return { success: true, data: filtered, source: 'cloud' };
      }
    } catch (e) {
      console.warn('[Cloud Firestore]: Chưa sẵn sàng, thử Backend API');
    }

    // 2. Thử gọi Backend API
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.combo) query.append('combo', 'true');
    const queryString = query.toString();
    return request(`/products${queryString ? `?${queryString}` : ''}`);
  },
  getById: async (id) => {
    // 1. ƯU TIÊN SỐ 1: Tìm trong Cloud Firestore (Đồng bộ 100% với getAll trang chủ)
    try {
      const cloudProds = await fetchCloudProducts();
      if (cloudProds && cloudProds.length > 0) {
        const found = cloudProds.find(p => String(p.id) === String(id));
        if (found) return { success: true, data: found, source: 'cloud' };
      }
    } catch (e) {
      console.warn('[Cloud Firestore] getById failed:', e.message);
    }

    // 2. ƯU TIÊN SỐ 2: Tìm trong LocalStorage (sản phẩm người bán vừa tạo)
    try {
      const saved = localStorage.getItem('vibebili_custom_products');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const found = list.find(p => String(p.id) === String(id));
          if (found) return { success: true, data: found, source: 'local' };
        }
      }
    } catch (e) {}

    // 3. ƯU TIÊN SỐ 3: Thử Backend API (MySQL) nếu không có trên Cloud hay Local
    try {
      const res = await request(`/products/${id}`);
      if (res && res.success && res.data) return res;
    } catch (e) {
      console.warn(`[API] /products/${id} không tìm thấy trên Backend API`);
    }

    // 4. Trả về không tìm thấy
    return { success: false, data: null };
  },
  create: async (productData) => {
    // Lưu đồng bộ trực tiếp lên Cloud Firestore
    await syncProductToCloud(productData).catch(() => {});
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },
  bulkCreate: async (items) => {
    // Lưu hàng loạt lên Cloud Firestore
    await bulkSyncProductsToCloud(items).catch(() => {});
    return request('/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  },
  delete: async (id) => {
    // Xóa trên Cloud Firestore
    await deleteProductFromCloud(id).catch(() => {});
    return request(`/products/${id}`, {
      method: 'DELETE'
    });
  },
  getCategories: () => request('/products/categories'),
  updateCategory: (id, data) => request(`/products/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getReviews: (id) => request(`/products/${id}/reviews`),
  createReview: (id, reviewData) => request(`/products/${id}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData)
  })
};

// 3. Phân hệ Đơn hàng (Orders & Checkout - Hỗ trợ Cloud Firestore)
export const orderAPI = {
  createOrder: async (orderData) => {
    await syncOrderToCloud(orderData).catch(() => {});
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },
  getAllOrders: async () => {
    try {
      const cloudOrders = await fetchCloudOrders();
      if (cloudOrders && cloudOrders.length > 0) {
        return { success: true, data: cloudOrders, source: 'cloud' };
      }
    } catch {}
    return request('/orders');
  },
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

// 4. Phân hệ AI Virtual Try-On 2D (IDM-VTON + Gemini Size Advisor)
export const tryOnAPI = {
  virtualTryOn: (payload) => request('/try-on/virtual-try-on', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getProxyUrl: (url) => {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
    return `${API_BASE_URL}/try-on/proxy-image?url=${encodeURIComponent(url)}`;
  }
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
  updateVoucher: (id, data) => request(`/services/marketing/vouchers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteVoucher: (id) => request(`/services/marketing/vouchers/${id}`, {
    method: 'DELETE'
  }),

  // Kiểm duyệt sản phẩm (Admin Moderator)
  getPendingProducts: () => request('/services/moderation/products'),
  moderateProduct: (id, data) => request(`/services/moderation/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Khiếu nại & CSKH (Admin Support)
  getComplaints: () => request('/services/support/complaints'),
  updateComplaint: (id, data) => request(`/services/support/complaints/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
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
