/**
 * Dịch vụ Cơ sở Dữ liệu Đám mây VibeBili (Firebase Firestore Cloud Sync)
 * Giúp đồng bộ sản phẩm, đơn hàng theo thời gian thực trên mọi máy tính và điện thoại.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
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

  return null;
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
