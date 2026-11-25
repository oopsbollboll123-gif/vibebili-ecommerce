/**
 * Dịch vụ Cơ sở Dữ liệu Đám mây VibeBili (Firebase Firestore Cloud Sync)
 * Giúp đồng bộ sản phẩm, đơn hàng theo thời gian thực trên mọi máy tính và điện thoại.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';

// Cấu hình Firebase mặc định (ưu tiên biến môi trường VITE_ hoặc cấu hình đã lưu)
const getFirebaseConfig = () => {
  // 1. Kiểm tra cấu hình người dùng nhập trong Cài đặt Admin/Seller
  try {
    const customConfig = localStorage.getItem('vibebili_firebase_config');
    if (customConfig) {
      const parsed = JSON.parse(customConfig);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {}

  // 2. Kiểm tra biến môi trường Vite (.env)
  if (import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    };
  }

  // 3. Cấu hình Firebase Cloud mặc định chính thức của VibeBili (vibebili-shop)
  return {
    apiKey: typeof atob !== 'undefined' ? atob('QUl6YVN5RGVMaW10a2I2cGZKMUE4YURmaFd2ZE84WlQycmJsaUxZ') : '',
    authDomain: "vibebili-shop.firebaseapp.com",
    projectId: "vibebili-shop",
    storageBucket: "vibebili-shop.firebasestorage.app",
    messagingSenderId: "502261686333",
    appId: "1:502261686333:web:cade6118c45ac786158a54"
  };
};

let dbInstance = null;

// Khởi tạo Firebase Firestore an toàn
export const getCloudDb = () => {
  if (dbInstance) return dbInstance;

  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (err) {
    console.warn('[Firebase Cloud DB] Không thể khởi tạo:', err.message);
    return null;
  }
};

// Kiểm tra xem Cloud DB đã sẵn sàng chưa
export const isCloudDbConfigured = () => {
  return getFirebaseConfig() !== null;
};

// Lưu cấu hình Firebase vào trình duyệt
export const saveFirebaseConfig = (configObj) => {
  if (!configObj || !configObj.projectId) return false;
  try {
    localStorage.setItem('vibebili_firebase_config', JSON.stringify(configObj));
    dbInstance = null; // Reset để khởi tạo lại
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Lấy toàn bộ sản phẩm từ Cloud Firestore
 */
export const fetchCloudProducts = async () => {
  const db = getCloudDb();
  if (!db) return null;

  try {
    const colRef = collection(db, 'vibebili_products');
    const snapshot = await getDocs(colRef);
    const list = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        ...data,
        id: data.id || docSnap.id
      });
    });
    return list;
  } catch (err) {
    console.warn('[Firebase] Lỗi đọc sản phẩm đám mây:', err.message);
    return null;
  }
};

/**
 * Lưu 1 sản phẩm lên Cloud Firestore
 */
export const syncProductToCloud = async (product) => {
  const db = getCloudDb();
  if (!db || !product) return false;

  try {
    const prodId = String(product.id || `custom-${Date.now()}`);
    const docRef = doc(db, 'vibebili_products', prodId);
    await setDoc(docRef, {
      ...product,
      id: prodId,
      updated_at: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi lưu sản phẩm lên mây:', err.message);
    return false;
  }
};

/**
 * Đồng bộ hàng loạt sản phẩm lên Cloud Firestore (Bulk Sync)
 */
export const bulkSyncProductsToCloud = async (products = []) => {
  const db = getCloudDb();
  if (!db || !Array.isArray(products) || products.length === 0) return false;

  try {
    // Dùng batch write trong Firestore (tối đa 500 records/batch)
    const chunks = [];
    for (let i = 0; i < products.length; i += 400) {
      chunks.push(products.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((p, idx) => {
        const pId = String(p.id || `prod-${Date.now()}-${idx}`);
        const ref = doc(db, 'vibebili_products', pId);
        batch.set(ref, {
          ...p,
          id: pId,
          updated_at: new Date().toISOString()
        }, { merge: true });
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi bulk sync sản phẩm:', err.message);
    return false;
  }
};

/**
 * Xóa 1 sản phẩm khỏi Cloud Firestore
 */
export const deleteProductFromCloud = async (productId) => {
  const db = getCloudDb();
  if (!db || !productId) return false;

  try {
    const docRef = doc(db, 'vibebili_products', String(productId));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi xóa sản phẩm trên mây:', err.message);
    return false;
  }
};

/**
 * Lưu đơn hàng lên Cloud Firestore
 */
export const syncOrderToCloud = async (order) => {
  const db = getCloudDb();
  if (!db || !order) return false;

  try {
    const ordId = String(order.id || order.order_code || `WIG-${Date.now()}`);
    const docRef = doc(db, 'vibebili_orders', ordId);
    await setDoc(docRef, {
      ...order,
      id: ordId,
      created_at: order.created_at || new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi lưu đơn hàng:', err.message);
    return false;
  }
};

/**
 * Lấy toàn bộ đơn hàng từ Cloud Firestore
 */
export const fetchCloudOrders = async () => {
  const db = getCloudDb();
  if (!db) return null;

  try {
    const colRef = collection(db, 'vibebili_orders');
    const snapshot = await getDocs(colRef);
    const list = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data());
    });
    return list;
  } catch (err) {
    console.warn('[Firebase] Lỗi đọc đơn hàng:', err.message);
    return null;
  }
};

// ============================================================
// ĐỒNG BỘ TÀI KHOẢN & QUÊN MẬT KHẨU ĐÁM MÂY (CROSS-DEVICE AUTH)
// ============================================================

const normalizeEmailKey = (email) => (email || '').trim().toLowerCase();

/**
 * Tìm tài khoản người dùng trên Cloud Firestore theo email
 */
export const fetchCloudUserByEmail = async (email) => {
  const db = getCloudDb();
  const cleanEmail = normalizeEmailKey(email);
  if (!db || !cleanEmail) return null;

  try {
    const docRef = doc(db, 'vibebili_users', cleanEmail);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn('[Firebase] Lỗi đọc tài khoản đám mây:', err.message);
    return null;
  }
};

/**
 * Lưu / đồng bộ tài khoản người dùng lên Cloud Firestore (dùng chung mọi máy)
 */
export const syncUserToCloud = async (userObj) => {
  const db = getCloudDb();
  const cleanEmail = normalizeEmailKey(userObj?.email);
  if (!db || !cleanEmail) return false;

  try {
    const docRef = doc(db, 'vibebili_users', cleanEmail);
    const payload = {
      ...userObj,
      email: cleanEmail,
      id: userObj.id || Date.now(),
      updated_at: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi lưu tài khoản lên đám mây:', err.message);
    return false;
  }
};

/**
 * Lấy danh sách toàn bộ tài khoản từ Cloud Firestore
 */
export const fetchAllCloudUsers = async () => {
  const db = getCloudDb();
  if (!db) return [];

  try {
    const colRef = collection(db, 'vibebili_users');
    const snapshot = await getDocs(colRef);
    const list = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data());
    });
    return list;
  } catch (err) {
    console.warn('[Firebase] Lỗi đọc danh sách tài khoản:', err.message);
    return [];
  }
};

/**
 * Lưu mã OTP đặt lại mật khẩu lên Cloud Firestore (Hạn 10 phút)
 */
export const saveCloudOtp = async (email, otp, ttlMs = 10 * 60 * 1000) => {
  const db = getCloudDb();
  const cleanEmail = normalizeEmailKey(email);
  if (!db || !cleanEmail) return false;

  try {
    const docRef = doc(db, 'vibebili_otps', cleanEmail);
    await setDoc(docRef, {
      email: cleanEmail,
      otp: String(otp),
      expiresAt: Date.now() + ttlMs,
      attempts: 0,
      created_at: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi lưu OTP đám mây:', err.message);
    return false;
  }
};

/**
 * Xác thực mã OTP trên Cloud Firestore
 */
export const verifyCloudOtp = async (email, otp) => {
  const db = getCloudDb();
  const cleanEmail = normalizeEmailKey(email);
  if (!db || !cleanEmail) return { valid: false, message: 'Không thể kết nối Cloud OTP.' };

  try {
    const docRef = doc(db, 'vibebili_otps', cleanEmail);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { valid: false, message: 'Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng gửi lại mã mới!' };
    }
    const data = snap.data();
    if (Date.now() > Number(data.expiresAt || 0)) {
      await deleteDoc(docRef).catch(() => {});
      return { valid: false, message: 'Mã OTP đã hết hạn (quá 10 phút). Vui lòng yêu cầu mã mới!' };
    }
    if ((data.attempts || 0) >= 5) {
      return { valid: false, message: 'Bạn đã nhập sai OTP quá 5 lần. Vui lòng gửi lại mã mới!' };
    }
    if (String(data.otp) !== String(otp).trim()) {
      await updateDoc(docRef, { attempts: (data.attempts || 0) + 1 }).catch(() => {});
      return { valid: false, message: 'Mã OTP không chính xác!' };
    }
    return { valid: true };
  } catch (err) {
    console.warn('[Firebase] Lỗi xác thực OTP đám mây:', err.message);
    return { valid: false, message: 'Lỗi xác thực OTP. Vui lòng thử lại.' };
  }
};

/**
 * Cập nhật mật khẩu mới lên Cloud Firestore và xóa OTP đã dùng
 */
export const updateCloudUserPassword = async (email, newPasswordHash) => {
  const db = getCloudDb();
  const cleanEmail = normalizeEmailKey(email);
  if (!db || !cleanEmail) return false;

  try {
    const userRef = doc(db, 'vibebili_users', cleanEmail);
    await setDoc(userRef, {
      passwordHash: newPasswordHash,
      updated_at: new Date().toISOString()
    }, { merge: true });

    const otpRef = doc(db, 'vibebili_otps', cleanEmail);
    await deleteDoc(otpRef).catch(() => {});
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi cập nhật mật khẩu đám mây:', err.message);
    return false;
  }
};
