import React, { useEffect } from 'react';
import { ArrowLeftIcon, ShieldCheckIcon, SparklesIcon, TruckIcon } from './Icons';

function PolicyPage({ initialTab = 'return-policy', onBackToHome }) {
  const [activeTab, setActiveTab] = React.useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialTab]);

  const tabs = [
    { id: 'return-policy', label: 'Chính sách Đổi trả 15 ngày', icon: '🔄', badge: '15 Ngày' },
    { id: 'size-guide', label: 'Hướng dẫn chọn Size vòng đầu', icon: '📏', badge: 'Chuẩn 3 Bước' },
    { id: 'terms', label: 'Quy chế hoạt động Sàn TMĐT', icon: '📜', badge: 'Pháp lý' },
    { id: 'fiber-standards', label: 'Cam kết tiêu chuẩn sợi tơ', icon: '💎', badge: '180°C' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 text-vibe-ink">
      {/* Breadcrumb & Nút quay lại */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-vibe-border">
        <div className="flex items-center gap-2 text-xs text-vibe-muted">
          <button 
            onClick={onBackToHome}
            className="hover:text-vibe-ink font-semibold flex items-center gap-1 transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>
          <span>/</span>
          <span className="text-vibe-subtle">Trung tâm Thông tin & Pháp chế</span>
          <span>/</span>
          <span className="font-bold text-vibe-ink">
            {tabs.find(t => t.id === activeTab)?.label}
          </span>
        </div>

        <button
          onClick={onBackToHome}
          className="text-xs font-semibold text-vibe-accent hover:underline flex items-center gap-1"
        >
          ← Quay lại mua sắm
        </button>
      </div>

      {/* Main Layout 2 Cột: Sidebar Navigation + Nội dung Chi tiết */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CỘT TRÁI: Menu Điều hướng Chính sách */}
        <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-vibe-border shadow-card">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-vibe-subtle px-3 py-2">
              Danh mục tài liệu
            </h3>
            <div className="space-y-1 mt-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-vibe-ink text-white shadow-btn'
                        : 'text-vibe-700 hover:bg-vibe-50 hover:text-vibe-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-sm">{tab.icon}</span>
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className={`text-2xs font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-vibe-100 text-vibe-600'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hộp hỗ trợ nhanh Hotline */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200/70 rounded-3xl p-5 shadow-card">
            <div className="w-10 h-10 rounded-2xl bg-vibe-accent text-white flex items-center justify-center font-bold text-lg mb-3 shadow-btn">
              🎧
            </div>
            <h4 className="text-xs font-bold text-vibe-ink uppercase tracking-wide">
              Cần giải đáp thắc mắc?
            </h4>
            <p className="text-2xs text-vibe-muted mt-1 leading-relaxed">
              Bộ phận Chăm sóc khách hàng & Trọng tài khiếu nại VibeBili luôn sẵn sàng hỗ trợ bạn 24/7.
            </p>
            <div className="mt-3 pt-3 border-t border-orange-200/60 text-xs font-bold text-vibe-accent">
              Hotline: 1900 6868
            </div>
          </div>
        </aside>

        {/* CỘT PHẢI: Nội dung chi tiết */}
        <main className="lg:col-span-9 bg-white rounded-3xl p-6 sm:p-10 border border-vibe-border shadow-card leading-relaxed">

          {/* ======================================================== */}
          {/* TAB 1: CHÍNH SÁCH ĐỔI TRẢ VÀ HOÀN TIỀN 15 NGÀY */}
          {/* ======================================================== */}
          {activeTab === 'return-policy' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header */}
              <div className="border-b border-vibe-border pb-6">
                <span className="badge-hot mb-2 inline-flex">Cam kết bảo vệ người tiêu dùng</span>
                <h1 className="text-2xl sm:text-3xl font-black text-vibe-ink tracking-tight mt-1">
                  Chính Sách Đổi Trả & Hoàn Tiền Toàn Diện (15 Ngày)
                </h1>
                <p className="text-xs sm:text-sm text-vibe-muted mt-2">
                  Áp dụng cho toàn bộ các giao dịch mua bán thành công trên nền tảng thương mại điện tử <strong>VibeBili.vn</strong>.
                </p>
              </div>

              {/* Tóm tắt nhanh */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xl mb-1">⏱️ 15 Ngày</div>
                  <div className="text-xs font-bold text-emerald-900">Thời hạn khiếu nại</div>
                  <p className="text-2xs text-emerald-700 mt-0.5">Tính từ ngày giao thành công</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="text-xl mb-1">📦 Miễn Phí 100%</div>
                  <div className="text-xs font-bold text-amber-900">Phí thu hồi lỗi Shop</div>
                  <p className="text-2xs text-amber-700 mt-0.5">Shop chịu phí 2 chiều</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="text-xl mb-1">🛡️ Video Unbox</div>
                  <div className="text-xs font-bold text-blue-900">Bằng chứng bắt buộc</div>
                  <p className="text-2xs text-blue-700 mt-0.5">Quay rõ 6 mặt kiện hàng</p>
                </div>
              </div>

              {/* Phần I */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-vibe-ink flex items-center gap-2 border-l-4 border-vibe-accent pl-3">
                  PHẦN I: QUY ĐỊNH CHUNG & THỜI GIAN ÁP DỤNG
                </h2>
                <div className="text-xs space-y-2 text-vibe-700 bg-vibe-50 p-4 rounded-2xl border border-vibe-border">
                  <p>
                    <strong>• Thời hạn tiếp nhận khiếu nại:</strong> Toàn bộ các yêu cầu đổi trả hoặc hoàn tiền phải được khởi tạo trực tiếp trên hệ thống ứng dụng/website VibeBili trong vòng <strong>15 ngày</strong> kể từ thời điểm hệ thống cập nhật trạng thái đơn hàng "Giao hàng thành công".
                  </p>
                  <p>
                    <strong>• Khóa tính năng tự động:</strong> Quá thời hạn 15 ngày trên, hệ thống sẽ tự động khóa tính năng yêu cầu đổi trả, mọi khiếu nại phát sinh sau đó sẽ nằm ngoài phạm vi hỗ trợ tự động của VibeBili.
                  </p>
                  <p>
                    <strong>• Nguyên tắc cơ bản:</strong> Sản phẩm đổi trả phải tuân thủ đúng điều kiện kỹ thuật và hình thức quy định tại Mục III. Khách hàng bắt buộc phải cung cấp đầy đủ chứng cứ hợp lệ (hình ảnh, video unbox) theo yêu cầu của hệ thống.
                  </p>
                </div>
              </section>

              {/* Phần II */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-vibe-ink flex items-center gap-2 border-l-4 border-vibe-accent pl-3">
                  PHẦN II: CÁC TRƯỜNG HỢP ĐƯỢC CHẤP NHẬN ĐỔI TRẢ & HOÀN TIỀN
                </h2>
                <div className="space-y-3 text-xs text-vibe-700">
                  <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-200 space-y-1.5">
                    <h3 className="font-bold text-red-900 text-xs">1. Lỗi chủ quan từ Nhà bán hàng / Đơn vị vận chuyển:</h3>
                    <ul className="list-disc list-inside space-y-1 text-red-800 text-2xs sm:text-xs">
                      <li>Sản phẩm bị lỗi kỹ thuật, lỗi vận hành, không hoạt động hoặc hư hỏng nặng (bể vỡ, móp méo, biến dạng, rách bao bì gốc).</li>
                      <li>Giao sai sản phẩm so với đơn đặt hàng (sai mẫu mã, sai phiên bản, sai dung tích/trọng lượng, sai màu sắc).</li>
                      <li>Giao thiếu sản phẩm, thiếu phụ kiện, thiếu linh kiện hoặc thiếu quà tặng kèm theo đúng cam kết trong đơn hàng.</li>
                      <li>Sản phẩm giao đến là hàng giả, hàng nhái, hàng kém chất lượng, hết hạn sử dụng.</li>
                    </ul>
                  </div>

                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1.5">
                    <h3 className="font-bold text-amber-900 text-xs">2. Nhu cầu từ phía Người mua (Áp dụng "Trả hàng đổi ý"):</h3>
                    <p className="text-2xs sm:text-xs text-amber-800">
                      Sản phẩm không còn nhu cầu sử dụng, mua nhầm kích thước (size), hoặc không vừa vặn (đối với thời trang, giày dép, vòng đầu tóc giả).
                    </p>
                    <p className="text-2xs font-semibold text-amber-900 italic">
                      * Lưu ý: Chỉ áp dụng cho các Nhà bán hàng/Sản phẩm có bật nhãn "Cho phép trả hàng đổi ý".
                    </p>
                  </div>
                </div>
              </section>

              {/* Phần III */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-vibe-ink flex items-center gap-2 border-l-4 border-vibe-accent pl-3">
                  PHẦN III: ĐIỀU KIỆN ĐỐI VỚI SẢN PHẨM HOÀN TRẢ
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 bg-vibe-50 rounded-2xl border border-vibe-border space-y-1">
                    <h4 className="font-bold text-vibe-ink">Tình trạng sản phẩm</h4>
                    <p className="text-2xs text-vibe-muted">
                      Nguyên vẹn, không dơ bẩn, trầy xước, ẩm mốc, chưa qua giặt ủi, cắt ren hoặc chải xơ rối đối với tóc giả. Đổi ý bắt buộc sản phẩm mới 100%.
                    </p>
                  </div>
                  <div className="p-4 bg-vibe-50 rounded-2xl border border-vibe-border space-y-1">
                    <h4 className="font-bold text-vibe-ink">Tem mác & Phụ kiện</h4>
                    <p className="text-2xs text-vibe-muted">
                      Còn nguyên hộp, bao bì gốc, tem niêm phong (seal), tem thương hiệu VibeBili, lưới trùm (wig cap) và quà tặng kèm đầy đủ.
                    </p>
                  </div>
                  <div className="p-4 bg-vibe-50 rounded-2xl border border-vibe-border space-y-1">
                    <h4 className="font-bold text-vibe-ink">Video Unbox bắt buộc</h4>
                    <p className="text-2xs text-vibe-muted">
                      Quay liền mạch không cắt ghép từ lúc hộp nguyên vẹn 6 mặt, rõ mã vận đơn đến khi mở xem tình trạng bên trong.
                    </p>
                  </div>
                </div>
              </section>

              {/* Phần IV */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-vibe-ink flex items-center gap-2 border-l-4 border-vibe-accent pl-3">
                  PHẦN IV: DANH MỤC HẠN CHẾ HOẶC KHÔNG ÁP DỤNG ĐỔI TRẢ
                </h2>
                <p className="text-xs text-vibe-muted">
                  Trừ trường hợp lỗi kỹ thuật từ nhà sản xuất hoặc giao sai hàng, các nhóm sản phẩm sau <strong>không hỗ trợ đổi ý</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex items-center gap-2">
                    <span>🧴</span>
                    <span>Mỹ phẩm dưỡng tóc, xịt khử mùi tóc đã mở niêm phong seal.</span>
                  </div>
                  <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex items-center gap-2">
                    <span>🩲</span>
                    <span>Đồ lót, đồ bơi, vớ/tất, phụ kiện tiếp xúc trực tiếp da nhạy cảm.</span>
                  </div>
                  <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex items-center gap-2">
                    <span>🎟️</span>
                    <span>E-Voucher, mã thẻ quà tặng số, tài khoản phần mềm.</span>
                  </div>
                  <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex items-center gap-2">
                    <span>🏷️</span>
                    <span>Hàng xả kho đặc biệt có ghi rõ "Không áp dụng đổi trả".</span>
                  </div>
                </div>
              </section>

              {/* Phần V */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-vibe-ink flex items-center gap-2 border-l-4 border-vibe-accent pl-3">
                  PHẦN V: QUY ĐỊNH VỀ PHÍ VẬN CHUYỂN HOÀN TRẢ
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <h4 className="font-bold text-emerald-950 mb-1">Lỗi do Nhà bán / Vận chuyển / Hàng giả:</h4>
                    <p className="text-2xs text-emerald-800">
                      <strong>Miễn phí 100%.</strong> VibeBili hoặc Nhà bán hàng chịu toàn bộ chi phí bưu tá lấy hàng tận nơi và chi phí gửi lại sản phẩm thay thế.
                    </p>
                  </div>
                  <div className="p-4 bg-vibe-50 rounded-2xl border border-vibe-border">
                    <h4 className="font-bold text-vibe-900 mb-1">Trường hợp Đổi ý từ người mua (Đổi size, màu):</h4>
                    <p className="text-2xs text-vibe-700">
                      Người mua chịu chi phí vận chuyển 2 chiều theo biểu phí của đơn vị vận chuyển đối tác, trừ khi có thỏa thuận tài trợ từ Nhà bán hàng.
                    </p>
                  </div>
                </div>
              </section>

              {/* Phần VI */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-vibe-ink flex items-center gap-2 border-l-4 border-vibe-accent pl-3">
                  PHẦN VI: QUY TRÌNH THỰC HIỆN ĐỔI TRẢ & HOÀN TIỀN (5 BƯỚC)
                </h2>
                <div className="space-y-3">
                  {[
                    { step: 'Bước 1', title: 'Khởi tạo yêu cầu', desc: 'Vào "Đơn mua của tôi" → Chọn đơn hàng cần xử lý → Bấm nút "Yêu cầu Trả hàng / Hoàn tiền".' },
                    { step: 'Bước 2', title: 'Cung cấp thông tin & Bằng chứng', desc: 'Chọn đúng lý do đổi trả, nhập mô tả chi tiết lỗi phát sinh và đính kèm video unbox, hình ảnh chụp thực tế sản phẩm lỗi.' },
                    { step: 'Bước 3', title: 'Gửi trả sản phẩm', desc: 'Chờ hệ thống/Shop phê duyệt (24 - 48h). Đóng gói sản phẩm cẩn thận, dán mã đổi trả (Mã RMA) và bàn giao cho bưu tá đến lấy.' },
                    { step: 'Bước 4', title: 'Kiểm tra & Thẩm định chất lượng', desc: 'Kho tiếp nhận sản phẩm, tiến hành kiểm tra tình trạng thực tế so với tiêu chí đổi trả công bố.' },
                    { step: 'Bước 5', title: 'Hoàn tiền hoặc Đổi hàng', desc: 'Nếu đổi hàng: Giao đơn mới trong 3 - 5 ngày. Nếu hoàn tiền: Hoàn qua ví/tài khoản ngân hàng trong 3 - 7 ngày làm việc.' },
                  ].map((s, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-vibe-50 rounded-2xl border border-vibe-border items-start">
                      <span className="bg-vibe-ink text-white text-2xs font-bold px-2 py-1 rounded-lg uppercase flex-shrink-0 mt-0.5">
                        {s.step}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-vibe-ink">{s.title}</h4>
                        <p className="text-2xs text-vibe-muted mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Phần VII */}
              <section className="p-4 bg-neutral-900 text-white rounded-2xl space-y-2 text-xs">
                <h3 className="font-bold text-sm text-vibe-accent flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-4 h-4 text-vibe-accent" />
                  PHẦN VII: ĐIỀU KHOẢN GIẢI QUYẾT TRANH CHẤP
                </h3>
                <p className="text-2xs text-vibe-300 leading-relaxed">
                  Trong trường hợp phát sinh tranh chấp giữa Người mua và Nhà bán hàng liên quan đến chất lượng sản phẩm đổi trả, bộ phận CSKH / Trọng tài thương mại của VibeBili sẽ can thiệp đóng vai trò trung gian phân xử dựa trên video unbox của Người mua và camera đóng hàng tại kho Nhà bán. <strong>Quyết định của VibeBili là quyết định cuối cùng.</strong>
                </p>
              </section>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: HƯỚNG DẪN CHỌN SIZE VÒNG ĐẦU TÓC GIẢ */}
          {/* ======================================================== */}
          {activeTab === 'size-guide' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header */}
              <div className="border-b border-vibe-border pb-6">
                <span className="badge-new mb-2 inline-flex">Cẩm nang người dùng</span>
                <h1 className="text-2xl sm:text-3xl font-black text-vibe-ink tracking-tight mt-1">
                  Hướng Dẫn Đo Kích Thước Vòng Đầu Chuẩn Xác
                </h1>
                <p className="text-xs sm:text-sm text-vibe-muted mt-2">
                  Để chọn được bộ tóc giả ôm sát, tự nhiên và êm ái suốt cả ngày dài, hãy chuẩn bị <strong>thước dây mềm may mặc</strong> và thực hiện theo hướng dẫn sau.
                </p>
              </div>

              {/* Chuẩn bị */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <strong>Chuẩn bị trước khi đo:</strong> Buộc gọn tóc thật hoặc đội lưới trùm tóc (wig cap) ép sát vào da đầu. Nếu tóc thật quá dày hoặc dài, cần dàn đều tóc ra sau gáy trước khi tiến hành đo để tránh sai số chu vi.
                </div>
              </div>

              {/* 3 Bước đo cơ bản */}
              <section className="space-y-4">
                <h2 className="text-base font-bold text-vibe-ink flex items-center gap-2 border-l-4 border-vibe-accent pl-3">
                  3 BƯỚC ĐO KÍCH THƯỚC CƠ BẢN
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-vibe-50 rounded-2xl border border-vibe-border space-y-2">
                    <div className="w-8 h-8 rounded-full bg-vibe-ink text-white font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <h3 className="text-xs font-bold text-vibe-ink">Chu vi vòng đầu</h3>
                    <p className="text-2xs text-vibe-muted leading-relaxed">
                      Đặt đầu thước dây ở giữa trán (ngay chân tóc), kéo vòng qua sát trên mang tai, quấn xuống dưới gáy (nơi chân tóc kết thúc) và vòng qua tai bên kia về điểm xuất phát. <strong>Đây là chỉ số quan trọng nhất!</strong>
                    </p>
                  </div>

                  <div className="p-4 bg-vibe-50 rounded-2xl border border-vibe-border space-y-2">
                    <div className="w-8 h-8 rounded-full bg-vibe-ink text-white font-black text-xs flex items-center justify-center">
                      2
                    </div>
                    <h3 className="text-xs font-bold text-vibe-ink">Từ trán ra gáy (Front to Nape)</h3>
                    <p className="text-2xs text-vibe-muted leading-relaxed">
                      Đặt thước ở chính giữa trán (ngay đường chân tóc trước), kéo dọc qua đỉnh đầu và kết thúc tại điểm chân tóc ở chính giữa gáy sau.
                    </p>
                  </div>

                  <div className="p-4 bg-vibe-50 rounded-2xl border border-vibe-border space-y-2">
                    <div className="w-8 h-8 rounded-full bg-vibe-ink text-white font-black text-xs flex items-center justify-center">
                      3
                    </div>
                    <h3 className="text-xs font-bold text-vibe-ink">Từ tai sang tai ngang đỉnh đầu</h3>
                    <p className="text-2xs text-vibe-muted leading-relaxed">
                      Kéo thước từ chân tóc ngay mép tai trái, quấn thẳng qua đỉnh đầu sang chân tóc ở mép tai phải (Ear to Ear).
                    </p>
                  </div>
                </div>
              </section>

              {/* Bảng quy đổi */}
              <section className="space-y-4">
                <h2 className="text-base font-bold text-vibe-ink flex items-center gap-2 border-l-4 border-vibe-accent pl-3">
                  BẢNG QUY ĐỔI KÍCH THƯỚC TÓC GIẢ TIÊU CHUẨN
                </h2>

                <div className="overflow-x-auto rounded-2xl border border-vibe-border">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-vibe-950 text-white uppercase text-2xs tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Phân loại Size</th>
                        <th className="py-3 px-4">Chu vi vòng đầu</th>
                        <th className="py-3 px-4">Từ trán ra gáy</th>
                        <th className="py-3 px-4">Tai sang tai</th>
                        <th className="py-3 px-4">Độ phổ biến</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vibe-border bg-white text-vibe-ink">
                      <tr className="hover:bg-vibe-50 transition">
                        <td className="py-3 px-4 font-bold">Nhỏ (Petite)</td>
                        <td className="py-3 px-4">53 – 54 cm</td>
                        <td className="py-3 px-4">33 – 34 cm</td>
                        <td className="py-3 px-4">33 – 34 cm</td>
                        <td className="py-3 px-4 text-2xs text-vibe-muted">Người vóc dáng nhỏ / thiếu niên</td>
                      </tr>
                      <tr className="bg-orange-50/50 hover:bg-orange-50 font-semibold transition">
                        <td className="py-3 px-4 font-black text-vibe-accent flex items-center gap-1.5">
                          <span>Trung bình (Average)</span>
                          <span className="bg-vibe-accent text-white text-2xs px-1.5 py-0.5 rounded-full uppercase">HOT</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-vibe-accent">54.5 – 55.5 cm</td>
                        <td className="py-3 px-4">35.5 – 36.5 cm</td>
                        <td className="py-3 px-4">34 – 35 cm</td>
                        <td className="py-3 px-4 text-xs font-bold text-vibe-accent">Vừa vặn với 90 - 95% người dùng</td>
                      </tr>
                      <tr className="hover:bg-vibe-50 transition">
                        <td className="py-3 px-4 font-bold">Lớn (Large)</td>
                        <td className="py-3 px-4">57 – 58.5 cm</td>
                        <td className="py-3 px-4">38 – 39.5 cm</td>
                        <td className="py-3 px-4">35.5 – 36.5 cm</td>
                        <td className="py-3 px-4 text-2xs text-vibe-muted">Tóc thật dày hoặc chu vi đầu lớn</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Lưu ý quan trọng */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-vibe-ink flex items-center gap-2 border-l-4 border-vibe-accent pl-3">
                  LƯU Ý KHI LỰA CHỌN VÀ SỬ DỤNG
                </h2>
                <div className="space-y-2 text-xs text-vibe-700 bg-vibe-50 p-4 rounded-2xl border border-vibe-border">
                  <p>
                    <strong>• Khi số đo nằm giữa 2 size:</strong> Luôn ưu tiên chọn size lớn hơn để đảm bảo lưu thông máu và sự thoải mái, tránh tình trạng hằn viền hoặc đau đầu khi đội liên tục nhiều giờ.
                  </p>
                  <p>
                    <strong>• Tùy chỉnh móc gài linh hoạt:</strong> Khung tóc giả VibeBili luôn trang bị sẵn đai thun và móc gài ẩn ở hai bên gáy, cho phép bạn chủ động nới lỏng hoặc thu hẹp biên độ linh hoạt khoảng <strong>1 - 1.5 cm</strong>.
                  </p>
                  <p>
                    <strong>• Độ dày của tóc thật:</strong> Khối lượng tóc thật bên trong sẽ làm tăng chu vi vòng đầu thực tế lên từ 1 - 2 cm; hãy kẹp tăm phân bổ đều tóc ra sau trước khi đo.
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: QUY CHẾ HOẠT ĐỘNG SÀN GIAO DỊCH TMĐT */}
          {/* ======================================================== */}
          {activeTab === 'terms' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header */}
              <div className="border-b border-vibe-border pb-6">
                <span className="badge-new mb-2 inline-flex">Văn bản Pháp lý nền tảng</span>
                <h1 className="text-2xl sm:text-3xl font-black text-vibe-ink tracking-tight mt-1">
                  Quy Chế Hoạt Động Sàn Giao Dịch TMĐT VibeBili
                </h1>
                <p className="text-xs sm:text-sm text-vibe-muted mt-2">
                  Áp dụng cho toàn bộ các thành viên đăng ký sử dụng và tham gia giao dịch trên Sàn giao dịch TMĐT VibeBili.vn.
                </p>
              </div>

              {/* Điều khoản chi tiết */}
              <div className="space-y-6 text-xs text-vibe-700">
                <section className="space-y-2">
                  <h3 className="font-bold text-sm text-vibe-ink uppercase">I. Nguyên Tắc Chung</h3>
                  <p className="leading-relaxed">
                    Sàn giao dịch TMĐT VibeBili do Ban quản lý (Đơn vị chủ quản) xây dựng, vận hành và định hướng trở thành nền tảng chuyên biệt cung cấp các sản phẩm thời trang, trang phục và tóc giả (wigs) chất lượng cao. Các thành viên thực hiện giao dịch trên tinh thần tự nguyện, tôn trọng quyền lợi lẫn nhau và tuân thủ nghiêm ngặt các quy định pháp luật Việt Nam.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-sm text-vibe-ink uppercase">II. Quy Định Về Thành Viên & Hàng Hóa</h3>
                  <p className="leading-relaxed">
                    <strong>Người bán:</strong> Là thương nhân, tổ chức, cá nhân thiết lập gian hàng để đăng tải thông tin và bán hàng hóa.<br />
                    <strong>Người mua:</strong> Là cá nhân, tổ chức có nhu cầu tìm hiểu thông tin, đặt hàng và thanh toán trên sàn.<br />
                    <strong>Sản phẩm:</strong> Phải đáp ứng đầy đủ tiêu chuẩn chất lượng, nguồn gốc xuất xứ rõ ràng và không thuộc danh mục hàng hóa cấm kinh doanh theo quy định hiện hành.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-sm text-vibe-ink uppercase">III. Quy Trình Giao Dịch & Vận Chuyển</h3>
                  <ul className="list-disc list-inside space-y-1.5 pl-1">
                    <li><strong>Dành cho Người mua:</strong> Tìm kiếm sản phẩm, đối chiếu bảng size (chu vi vòng đầu đối với tóc giả), thêm vào giỏ hàng, áp dụng voucher, chọn phương thức thanh toán và theo dõi vận đơn.</li>
                    <li><strong>Dành cho Người bán:</strong> Tiếp nhận thông báo đơn hàng, đóng gói chuẩn quy cách, bàn giao cho đơn vị vận chuyển đối tác trong thời gian SLA cam kết (tối đa 48h).</li>
                    <li><strong>Giao nhận vận chuyển:</strong> VibeBili hợp tác với các đơn vị vận chuyển chuyên nghiệp (GHN, GHTK, Viettel Post) với thời gian giao từ 2 - 5 ngày toàn quốc.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-sm text-vibe-ink uppercase">IV. Cơ Chế Thanh Toán & Đảm Bảo An Toàn (Ví Escrow)</h3>
                  <div className="p-4 bg-vibe-50 rounded-2xl border border-vibe-border space-y-1.5">
                    <p>
                      <strong>• COD:</strong> Người mua thanh toán tiền mặt trực tiếp cho nhân viên giao hàng sau khi nhận và kiểm tra kiện hàng.
                    </p>
                    <p>
                      <strong>• Thanh toán trực tuyến:</strong> Tiền thanh toán sẽ được hệ thống <strong>Tạm giữ an toàn (Escrow)</strong> và chỉ giải ngân cho Người bán sau khi Người mua xác nhận "Đã nhận hàng" hoặc sau 7 ngày kể từ khi đơn giao thành công mà không phát sinh khiếu nại.
                    </p>
                    <p>
                      <strong>• Bảo mật:</strong> Áp dụng mã hóa SSL 256-bit và chữ ký số HMAC server-to-server. Nghiêm cấm mọi hành vi giao dịch ngoài sàn.
                    </p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-sm text-vibe-ink uppercase">V. Quản Lý Thông Tin Xấu & Sở Hữu Trí Tuệ</h3>
                  <p className="leading-relaxed">
                    Nghiêm cấm đăng tải hàng giả, hàng nhái, vi phạm quyền sở hữu trí tuệ hoặc hình ảnh có bản quyền chưa được cấp phép. Ban quản lý có quyền gỡ bỏ sản phẩm, khóa tài khoản tạm thời hoặc vĩnh viễn (Ban) đối với các gian hàng vi phạm mà không cần báo trước.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="font-bold text-sm text-vibe-ink uppercase">VI. Quyền & Trách Nhiệm Của Ban Quản Lý Sàn</h3>
                  <p className="leading-relaxed">
                    Duy trì hệ thống máy chủ hoạt động ổn định 24/7; xây dựng quy chế bảo vệ người tiêu dùng; bảo mật dữ liệu cá nhân; hỗ trợ xử lý khiếu nại và cung cấp thông tin cho cơ quan thẩm quyền khi có yêu cầu hợp pháp.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: CAM KẾT TIÊU CHUẨN SỢI TƠ */}
          {/* ======================================================== */}
          {activeTab === 'fiber-standards' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header */}
              <div className="border-b border-vibe-border pb-6">
                <span className="badge-sale mb-2 inline-flex">Tiêu chuẩn độc quyền</span>
                <h1 className="text-2xl sm:text-3xl font-black text-vibe-ink tracking-tight mt-1">
                  Cam Kết Tiêu Chuẩn Chất Lượng Sợi Tơ (Wig Fiber Standards)
                </h1>
                <p className="text-xs sm:text-sm text-vibe-muted mt-2">
                  Nhằm định vị tính chuyên biệt và bảo vệ quyền lợi tối đa cho khách hàng mua sắm tóc giả, VibeBili thiết lập các tiêu chuẩn kiểm duyệt bắt buộc sau:
                </p>
              </div>

              {/* 3 Trụ cột tiêu chuẩn */}
              <div className="space-y-6 text-xs text-vibe-700">
                {/* 1 */}
                <div className="p-5 bg-vibe-50 rounded-2xl border border-vibe-border space-y-2">
                  <h3 className="text-sm font-bold text-vibe-ink flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-vibe-accent text-white flex items-center justify-center text-xs">1</span>
                    Khai Báo Minh Bạch Vật Liệu 100%
                  </h3>
                  <p className="text-2xs text-vibe-muted leading-relaxed pl-8">
                    Người bán bắt buộc phải ghi rõ và chính xác 100% thành phần chất liệu cấu tạo sản phẩm ngay trong tiêu đề hoặc mục thuộc tính (vd: <strong>Tóc thật / Human Hair</strong>, <strong>Tơ tơ tằm nhân tạo Kanekalon</strong>, Tơ chịu nhiệt cao cấp, Tơ tổng hợp phổ thông).
                  </p>
                  <p className="text-2xs font-semibold text-red-600 pl-8">
                    ⚠️ Nghiêm cấm mọi hành vi quảng cáo sai lệch (trộn sợi nylon gắn nhãn tóc thật 100%, hoặc đăng tơ thường quảng cáo chịu nhiệt).
                  </p>
                </div>

                {/* 2 */}
                <div className="p-5 bg-vibe-50 rounded-2xl border border-vibe-border space-y-2">
                  <h3 className="text-sm font-bold text-vibe-ink flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-vibe-accent text-white flex items-center justify-center text-xs">2</span>
                    Tiêu Chuẩn Kỹ Thuật & An Toàn Da Liễu
                  </h3>
                  <div className="pl-8 space-y-2 text-2xs text-vibe-muted">
                    <p>
                      <strong>• Mức độ chịu nhiệt 120°C - 180°C:</strong> Sản phẩm dán nhãn "Tơ chịu nhiệt" phải đảm bảo khả năng chịu tác động từ máy uốn, máy ép nhiệt trong biên độ công bố mà không bị nóng chảy, co sun hay hỏng lõi tóc.
                    </p>
                    <p>
                      <strong>• An toàn da đầu:</strong> Lưới trùm (wig cap) và sợi tơ qua quy trình xử lý hóa chất an toàn, không chứa tạp chất độc hại gây ngứa ngáy, kích ứng, viêm da đầu hoặc rụng tóc tự nhiên.
                    </p>
                    <p>
                      <strong>• Công nghệ khử bóng ảo:</strong> Sợi tơ được xử lý phủ mờ vi mô mang lại cảm giác chân thực như tóc thật, hạn chế tối đa xơ rối và rụng mảng khi chải.
                    </p>
                  </div>
                </div>

                {/* 3 */}
                <div className="p-5 bg-red-50/70 rounded-2xl border border-red-200 space-y-2">
                  <h3 className="text-sm font-bold text-red-950 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs">3</span>
                    Chế Tài Xử Lý Gian Lận Chất Lượng
                  </h3>
                  <div className="pl-8 space-y-2 text-2xs text-red-900">
                    <p>
                      <strong>• Hoàn tiền 100% trong 15 ngày:</strong> Khách hàng được hoàn trả ngay 100% nếu sản phẩm bị chảy mủn khi kẹp nhiệt ở mức độ cho phép, tóc rụng bất thường hoặc lưới gây kích ứng.
                    </p>
                    <p>
                      <strong>• Phạt Shop vi phạm:</strong> Người bán chịu toàn bộ phí vận chuyển thu hồi 2 chiều. Các gian hàng cố tình gian lận vật liệu nhiều lần sẽ bị hạ điểm tín nhiệm, khóa vĩnh viễn sản phẩm hoặc trục xuất khỏi sàn VibeBili.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default PolicyPage;
