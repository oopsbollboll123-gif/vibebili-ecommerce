import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StoreIcon, ShieldCheckIcon, CheckIcon, CloseIcon } from './Icons';

// ============================================================
// SELLER REGISTRATION FORM
// Hiển thị từ trang hồ sơ cá nhân (ProfilePage / AuthPage)
// Yêu cầu: Đã đăng nhập + Chưa là Seller
// ============================================================

const SELLER_POLICY = `
ĐIỀU KHOẢN & HỢP ĐỒNG HỢP TÁC NGƯỜI BÁN VIBEBILI.VN

Phiên bản 2.0 — Có hiệu lực từ ngày 01/01/2026

─────────────────────────────────────────────
1. QUY ĐỊNH CHUNG
─────────────────────────────────────────────
1.1. VibeBili.vn (sau đây gọi là "Sàn") là nền tảng thương mại điện tử chuyên về Tóc Giả Cao Cấp và Thời Trang, hoạt động tại Việt Nam theo Giấy phép ĐKKD số XXXXXXXX.

1.2. Người Bán (Seller) là cá nhân hoặc tổ chức đã đăng ký và được Sàn phê duyệt mở gian hàng để kinh doanh sản phẩm hợp pháp.

1.3. Bằng việc đăng ký trở thành Người Bán, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ điều khoản này.

─────────────────────────────────────────────
2. ĐIỀU KIỆN TRỞ THÀNH NGƯỜI BÁN
─────────────────────────────────────────────
2.1. Có CCCD/CMND hợp lệ (cá nhân) hoặc Giấy phép ĐKKD (doanh nghiệp).
2.2. Cung cấp đầy đủ thông tin gian hàng trung thực, chính xác.
2.3. Cam kết không bán hàng giả, hàng nhái, hàng vi phạm pháp luật.
2.4. Đồng ý để VibeBili xác thực danh tính (KYC) trước khi kích hoạt.

─────────────────────────────────────────────
3. PHÍ HOA HỒNG & CHÍNH SÁCH THANH TOÁN
─────────────────────────────────────────────
3.1. Hoa hồng sàn: 5% / mỗi đơn hàng thành công (đã tính VAT).
3.2. Thanh toán về tài khoản ngân hàng Người Bán: Chu kỳ 7 ngày/lần.
3.3. VibeBili có quyền khấu trừ phí xử lý hoàn hàng (nếu có).
3.4. Khoản tiền bị giữ tối đa 15 ngày nếu có tranh chấp đơn hàng.

─────────────────────────────────────────────
4. TRÁCH NHIỆM VỀ SẢN PHẨM
─────────────────────────────────────────────
4.1. Người Bán chịu hoàn toàn trách nhiệm pháp lý về chất lượng sản phẩm đăng bán.
4.2. Nghiêm cấm đăng bán: hàng giả, hàng nhập lậu, mỹ phẩm không rõ nguồn gốc, tóc giả độc hại.
4.3. Hình ảnh sản phẩm phải trung thực, không chỉnh sửa quá mức gây hiểu lầm.
4.4. Mô tả sản phẩm phải chính xác về chất liệu, kích thước, xuất xứ.

─────────────────────────────────────────────
5. CHÍNH SÁCH ĐỔI TRẢ & HOÀN TIỀN
─────────────────────────────────────────────
5.1. Người Bán phải hỗ trợ đổi trả trong vòng 7 ngày kể từ ngày khách nhận hàng (nếu lỗi từ Người Bán).
5.2. Hoàn tiền cho khách phải hoàn thành trong vòng 3 ngày làm việc.
5.3. Người Bán không được từ chối đổi trả khi sản phẩm bị lỗi sản xuất.

─────────────────────────────────────────────
6. VI PHẠM & CHẾ TÀI
─────────────────────────────────────────────
6.1. Vi phạm lần đầu: Cảnh cáo, ẩn sản phẩm vi phạm.
6.2. Vi phạm lần hai: Khóa gian hàng 30 ngày, giữ tiền trong tài khoản.
6.3. Vi phạm nghiêm trọng: Đóng cửa vĩnh viễn, chuyển hồ sơ cho cơ quan pháp luật.
6.4. Lừa đảo khách hàng: Phong tỏa tài khoản ngay lập tức, không hoàn trả số dư.

─────────────────────────────────────────────
7. BẢO MẬT THÔNG TIN
─────────────────────────────────────────────
7.1. VibeBili cam kết bảo mật thông tin cá nhân và kinh doanh của Người Bán theo Luật An Toàn Thông Tin Mạng 2015.
7.2. Dữ liệu Người Bán không được chia sẻ cho bên thứ ba khi chưa có sự đồng ý.
7.3. Người Bán có quyền yêu cầu xóa tài khoản và dữ liệu theo quy định GDPR/PDPA.

─────────────────────────────────────────────
8. ĐIỀU KHOẢN KHÁC
─────────────────────────────────────────────
8.1. VibeBili có quyền sửa đổi điều khoản với thông báo trước 15 ngày qua email.
8.2. Tranh chấp được giải quyết theo pháp luật Việt Nam, tại Tòa án Nhân dân TP. HCM.
8.3. Bằng việc tích vào ô đồng ý, bạn xác nhận đã đọc và chấp thuận tất cả điều khoản trên.

© 2026 VibeBili.vn — Mọi quyền bảo lưu.
`;

function SellerRegistrationForm({ onSuccess, onCancel }) {
  const { user, upgradeToSeller } = useAuth();
  const [step, setStep] = useState(1); // 1: form, 2: policy, 3: success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [policyRead, setPolicyRead] = useState(false);

  const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
  const cccdRegex = /^[0-9]{9}$|^[0-9]{12}$/;

  const [form, setForm] = useState({
    shop_name: '',
    owner_name: user?.name || '',
    phone: user?.phone || '',
    warehouse_address: '',
    business_type: 'Tóc Giả Cao Cấp & Thời Trang Nữ',
    identity_card: '',
    description: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    const cleanShop = form.shop_name.trim();
    const cleanOwner = form.owner_name.trim();
    const cleanPhone = form.phone.trim().replace(/[\s.-]/g, '');
    const cleanWarehouse = form.warehouse_address.trim();
    const cleanCccd = form.identity_card.trim();

    if (cleanShop.length < 3) {
      setError('Tên Gian Hàng phải có ít nhất 3 ký tự!');
      return;
    }
    if (cleanOwner.length < 2 || !/[a-zA-ZÀ-ỹ]/.test(cleanOwner)) {
      setError('Họ tên chủ sở hữu không hợp lệ (tối thiểu 2 ký tự)!');
      return;
    }
    if (!phoneRegex.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số (vd: 0912345678).');
      return;
    }
    if (cleanWarehouse.length < 10) {
      setError('Vui lòng nhập địa chỉ kho hàng đầy đủ (tối thiểu 10 ký tự, ghi rõ số nhà, đường, phường/xã, quận/huyện, tỉnh/thành)!');
      return;
    }
    if (cleanCccd && !cccdRegex.test(cleanCccd)) {
      setError('Số CCCD/CMND không hợp lệ! Phải là 9 hoặc 12 chữ số.');
      return;
    }
    if (!cleanCccd) {
      setError('Vui lòng nhập số CCCD/CMND hoặc Mã số kinh doanh để xác thực danh tính!');
      return;
    }

    setError('');
    setStep(2);
  };

  const handlePolicyScroll = (e) => {
    const el = e.target;
    // Coi là đã đọc khi cuộn >= 70% nội dung
    if (el.scrollTop + el.clientHeight >= el.scrollHeight * 0.7) {
      setPolicyRead(true);
    }
  };

  const handleFinalSubmit = async () => {
    if (!policyAgreed) {
      setError('Bạn phải đọc và tích vào ô xác nhận đồng ý điều khoản để tiếp tục!');
      return;
    }
    setLoading(true);
    setError('');

    const cleanPhone = form.phone.trim().replace(/[\s.-]/g, '');
    const res = await upgradeToSeller({
      shop_name: form.shop_name.trim(),
      owner_name: form.owner_name.trim(),
      phone: cleanPhone,
      warehouse_address: form.warehouse_address.trim(),
      business_type: form.business_type,
      identity_card: form.identity_card.trim(),
      description: form.description.trim(),
      policy_agreed: true,
      policy_agreed_at: new Date().toISOString()
    });

    setLoading(false);
    if (res.success) {
      setStep(3);
      setTimeout(() => { onSuccess?.(res.user); }, 2500);
    } else {
      setError(res.message || 'Đã có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  // ── STEP 3: THÀNH CÔNG ──────────────────────────────────────
  if (step === 3) {
    return (
      <div className="text-center py-10 px-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckIcon className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-vibe-ink">🎉 Đăng Ký Người Bán Thành Công!</h2>
        <p className="text-sm text-vibe-muted max-w-sm mx-auto">
          Gian hàng <strong className="text-vibe-accent">{form.shop_name}</strong> đã được tạo.
          Admin sẽ xem xét và phê duyệt trong vòng 24–48 giờ làm việc.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-left space-y-1 max-w-sm mx-auto">
          <p className="font-semibold text-orange-800">📋 Các bước tiếp theo:</p>
          <p className="text-orange-700">① Admin xác thực CCCD/CMND của bạn</p>
          <p className="text-orange-700">② Nhận email phê duyệt từ oopsbollboll123@gmail.com</p>
          <p className="text-orange-700">③ Đăng sản phẩm đầu tiên vào gian hàng</p>
        </div>
        <p className="text-xs text-vibe-muted">Đang chuyển hướng vào Kênh Người Bán...</p>
      </div>
    );
  }

  // ── STEP 2: POLICY ──────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => { setStep(1); setError(''); }}
            className="text-vibe-muted hover:text-vibe-ink transition-colors p-1">
            ← Quay lại
          </button>
          <h2 className="text-base font-bold text-vibe-ink flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
            Điều Khoản Hợp Đồng Người Bán
          </h2>
        </div>

        {/* Policy text box */}
        <div
          onScroll={handlePolicyScroll}
          className="h-72 overflow-y-auto border border-vibe-border rounded-xl p-4 bg-vibe-50 text-xs text-vibe-700 leading-relaxed whitespace-pre-line font-mono"
          style={{ scrollBehavior: 'smooth' }}
        >
          {SELLER_POLICY}
        </div>
        {!policyRead && (
          <p className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
            ⚠️ Vui lòng cuộn đọc hết nội dung hợp đồng để kích hoạt nút đồng ý.
          </p>
        )}

        {/* Agree checkbox */}
        <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-all ${policyAgreed ? 'bg-green-50 border-green-300' : 'bg-vibe-50 border-vibe-border hover:border-vibe-ink'} ${!policyRead ? 'opacity-50 pointer-events-none' : ''}`}>
          <input
            type="checkbox"
            checked={policyAgreed}
            onChange={e => { setPolicyAgreed(e.target.checked); setError(''); }}
            className="mt-0.5 w-4 h-4 accent-green-600 flex-shrink-0"
          />
          <span className="text-xs text-vibe-700 leading-relaxed">
            Tôi đã <strong>đọc toàn bộ</strong> và <strong>đồng ý</strong> với Điều Khoản Hợp Đồng Người Bán VibeBili.vn phiên bản 2.0,
            bao gồm: quy định hoa hồng 5%, chính sách đổi trả, trách nhiệm sản phẩm và các chế tài xử lý vi phạm.
          </span>
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <button
          onClick={handleFinalSubmit}
          disabled={loading || !policyAgreed}
          className={`w-full font-bold py-3 rounded-full text-sm transition-all shadow-btn-md flex items-center justify-center gap-2
            bg-vibe-accent hover:bg-vibe-accent-hover text-white
            ${(loading || !policyAgreed) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
          ) : (
            '🏪 Xác Nhận Mở Gian Hàng VibeBili Seller'
          )}
        </button>
        <p className="text-center text-2xs text-vibe-muted">
          Sau khi đăng ký, Admin sẽ xem xét và phê duyệt trong 24–48 giờ làm việc.
        </p>
      </div>
    );
  }

  // ── STEP 1: FORM THÔNG TIN ───────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-base font-bold text-vibe-ink flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-vibe-accent" />
            Đăng Ký Trở Thành Người Bán
          </h2>
          <p className="text-xs text-vibe-muted mt-0.5">
            Điền đầy đủ thông tin để mở gian hàng trên VibeBili.vn
          </p>
        </div>
        {onCancel && (
          <button onClick={onCancel}
            className="text-vibe-muted hover:text-vibe-ink p-1 flex-shrink-0 transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Lưu ý quan trọng */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
        <p className="font-semibold">📋 Lưu ý trước khi đăng ký:</p>
        <p>• Thông tin gian hàng sẽ được Admin xác thực trước khi kích hoạt</p>
        <p>• Cần có CCCD/CMND hoặc Giấy phép kinh doanh hợp lệ</p>
        <p>• Hoa hồng sàn: <strong>5%/đơn hàng</strong> thành công</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
          <span className="flex-shrink-0">⚠️</span><span>{error}</span>
        </div>
      )}

      <form onSubmit={handleStep1Submit} className="space-y-3">
        {/* Shop name */}
        <div>
          <label className="block text-xs font-semibold text-vibe-700 mb-1">
            Tên Gian Hàng / Shop <span className="text-red-500">*</span>
          </label>
          <input type="text" name="shop_name" required
            placeholder="VD: Wig Luxury Sài Gòn, Y2K Boutique..."
            value={form.shop_name} onChange={handleChange}
            className="input" />
        </div>

        {/* Owner name */}
        <div>
          <label className="block text-xs font-semibold text-vibe-700 mb-1">
            Họ tên chủ sở hữu <span className="text-red-500">*</span>
          </label>
          <input type="text" name="owner_name" required
            placeholder="Nguyễn Văn A"
            value={form.owner_name} onChange={handleChange}
            className="input" />
        </div>

        {/* Phone + CCCD row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-vibe-700 mb-1">
              Số điện thoại Hotline <span className="text-red-500">*</span>
            </label>
            <input type="tel" name="phone" required
              placeholder="0912345678"
              value={form.phone} onChange={handleChange}
              className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-vibe-700 mb-1">
              Số CCCD / Mã ĐKKD <span className="text-red-500">*</span>
            </label>
            <input type="text" name="identity_card" required
              placeholder="079xxxxxxxxx (12 số)"
              value={form.identity_card} onChange={handleChange}
              className="input" />
          </div>
        </div>

        {/* Business type */}
        <div>
          <label className="block text-xs font-semibold text-vibe-700 mb-1">Loại hình kinh doanh</label>
          <select name="business_type" value={form.business_type} onChange={handleChange} className="input">
            <option>Tóc Giả Cao Cấp & Thời Trang Nữ</option>
            <option>Chuyên Tóc Giả Cao Cấp</option>
            <option>Thời Trang Nữ (Outfit)</option>
            <option>Thời Trang Nam</option>
            <option>Combo Tóc Giả + Thời Trang</option>
            <option>Phụ Kiện Làm Tóc & Mỹ Phẩm</option>
          </select>
        </div>

        {/* Warehouse address */}
        <div>
          <label className="block text-xs font-semibold text-vibe-700 mb-1">
            Địa chỉ kho lấy hàng / trụ sở <span className="text-red-500">*</span>
          </label>
          <input type="text" name="warehouse_address" required
            placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành"
            value={form.warehouse_address} onChange={handleChange}
            className="input" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-vibe-700 mb-1">
            Mô tả gian hàng <span className="text-vibe-muted font-normal">(tùy chọn)</span>
          </label>
          <textarea name="description" rows={2}
            placeholder="Giới thiệu ngắn về gian hàng, dòng sản phẩm chủ lực..."
            value={form.description} onChange={handleChange}
            className="input resize-none" />
        </div>

        <button type="submit"
          className="w-full font-bold py-3 rounded-full text-sm bg-vibe-accent hover:bg-vibe-accent-hover text-white transition-all shadow-btn-md flex items-center justify-center gap-2 mt-1">
          Tiếp Theo: Xem Điều Khoản Hợp Đồng →
        </button>
      </form>
    </div>
  );
}

export default SellerRegistrationForm;
