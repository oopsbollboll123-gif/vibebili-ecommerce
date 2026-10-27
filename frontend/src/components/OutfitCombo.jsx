import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { SparklesIcon, ShoppingBagIcon, CheckIcon } from './Icons';

function OutfitCombo({ onNavigateCheckout }) {
  const { addToCart } = useCart();

  // Dữ liệu các Combo Phối đồ Quần áo x Tóc giả
  const combos = [
    {
      id: 5,
      title: "Y2K Cyberpunk & Tóc Giả Bob Ngắn Cá Tính",
      description: "Set áo croptop ôm sát kèm chân váy ngắn kết hợp hoàn hảo cùng tóc giả bob ngắn uốn cụp cụp phong cách tương lai.",
      price: 480000,
      originalPrice: 650000,
      discount: "-26%",
      imageOutfit: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
      imageHair: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=600&q=80",
      main_image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
      items: ["Áo Croptop Y2K dây xích kim loại", "Chân váy cạp trễ sành điệu", "Tóc giả Bob ngắn sợi tơ cao cấp màu xám khói"],
      vibe: "Cá tính, Nổi loạn, Hiện đại"
    },
    {
      id: 6,
      title: "Korean Chic & Tóc Giả Xoăn Sóng Nước Dài",
      description: "Đầm tiểu thư thanh lịch nhẹ nhàng phối cùng tóc giả xoăn sóng nước bồng bềnh tự nhiên chuẩn Hàn Quốc.",
      price: 590000,
      originalPrice: 800000,
      discount: "-25%",
      imageOutfit: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80",
      imageHair: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
      main_image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
      items: ["Đầm tweed dáng dài cao cấp đính ngọc", "Tóc giả xoăn sóng nước 60cm màu nâu sô-cô-la kèm lưới trùm"],
      vibe: "Ngọt ngào, Sang trọng, Nữ tính"
    },
    {
      id: 7,
      title: "Dark Academia & Tóc Giả Layer Sợi Tự Nhiên",
      description: "Phong cách học đường cổ điển Anh Quốc với áo blazer và chân váy xếp ly, điểm nhấn bằng mái tóc layer buông lơi.",
      price: 520000,
      originalPrice: 700000,
      discount: "-25%",
      imageOutfit: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80",
      imageHair: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80",
      main_image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=80",
      items: ["Áo Blazer dạ tweed vintage", "Chân váy xếp ly caro", "Tóc giả Layer tự nhiên màu đen tuyền"],
      vibe: "Trí thức, Cổ điển, Bí ẩn"
    }
  ];

  const [selectedCombo, setSelectedCombo] = useState(combos[0]);

  // Thêm combo vào giỏ hàng
  const handleAddComboToCart = (combo) => {
    const productLike = {
      id: combo.id,
      name: combo.title,
      price: combo.price,
      original_price: combo.originalPrice,
      main_image: combo.main_image
    };

    addToCart(productLike, { id: combo.id * 10, title: 'Combo Trọn Bộ (Outfit + Wig)' }, 1, {
      color: 'Set chuẩn Lookbook',
      size: 'Freesize / M'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-gray-900">
      {/* Tiêu đề & Giới thiệu tính năng điểm nhấn */}
      <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center space-x-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          <SparklesIcon className="w-3.5 h-3.5 text-orange-600" />
          <span>Tính Năng Độc Quyền VibeBili.vn</span>
        </span>
        <h1 className="text-3xl font-black uppercase tracking-wider">Outfit x Hairstyle Combo</h1>
        <p className="text-xs text-gray-500 leading-relaxed">
          Không cần đau đầu lựa chọn, các chuyên gia thời trang của chúng tôi đã phối sẵn các set trang phục quần áo đồng điệu tuyệt đối cùng kiểu tóc giả cao cấp giúp bạn tỏa sáng mọi lúc mọi nơi.
        </p>
      </div>

      {/* Lưới các Combo gợi ý */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {combos.map((combo) => (
          <div 
            key={combo.id}
            onClick={() => setSelectedCombo(combo)}
            className={`bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl ${
              selectedCombo.id === combo.id ? 'border-black ring-2 ring-black/10' : 'border-gray-200'
            }`}
          >
            {/* Khung hình ảnh ghép đôi (Outfit x Hairstyle) */}
            <div className="grid grid-cols-2 h-60 bg-gray-100 relative overflow-hidden">
              <div className="h-full overflow-hidden border-r border-white">
                <img src={combo.imageOutfit} alt="Outfit" className="w-full h-full object-cover" />
              </div>
              <div className="h-full overflow-hidden">
                <img src={combo.imageHair} alt="Hairstyle" className="w-full h-full object-cover" />
              </div>
              <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                {combo.discount}
              </span>
              <span className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                Vibe: {combo.vibe}
              </span>
            </div>

            {/* Nội dung combo */}
            <div className="p-5 space-y-3">
              <h3 className="text-base font-bold line-clamp-1">{combo.title}</h3>
              <p className="text-xs text-gray-600 line-clamp-2">{combo.description}</p>

              {/* Thành phần trong combo */}
              <div className="border-t border-gray-100 pt-3 space-y-1.5">
                <p className="text-[11px] font-bold uppercase text-gray-400">Combo bao gồm:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  {combo.items.map((item, idx) => (
                    <li key={idx} className="flex items-center space-x-1.5 truncate">
                      <CheckIcon className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Giá và nút chọn */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <span className="text-lg font-black text-red-600">{combo.price.toLocaleString()} đ</span>
                  <span className="text-xs text-gray-400 line-through ml-2">{combo.originalPrice.toLocaleString()} đ</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddComboToCart(combo);
                  }}
                  className="text-xs px-4 py-2.5 rounded-full font-bold bg-black text-white hover:bg-neutral-800 transition-colors shadow flex items-center space-x-1.5 min-h-[36px]"
                >
                  <ShoppingBagIcon className="w-3.5 h-3.5 text-white" />
                  <span>Thêm combo</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Khu vực Chi tiết Combo đang chọn & Nút mua nhanh */}
      <div className="bg-black text-white rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10">
        <div className="space-y-3 max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 bg-orange-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Combo Nổi Bật Đang Chọn</span>
          </span>
          <h2 className="text-2xl font-black">{selectedCombo.title}</h2>
          <p className="text-xs md:text-sm text-gray-300 leading-relaxed">{selectedCombo.description}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedCombo.items.map((it, i) => (
              <span key={i} className="bg-white/10 text-xs px-3 py-1.5 rounded-full text-gray-200 flex items-center space-x-1.5">
                <CheckIcon className="w-3 h-3 text-orange-400" />
                <span>{it}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white text-gray-900 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 min-w-[280px] shadow-2xl">
          <div className="text-center">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Trọn bộ combo lookbook</span>
            <div className="text-2xl font-black text-red-600 mt-1">{selectedCombo.price.toLocaleString()} đ</div>
            <span className="text-xs text-gray-400 line-through">{selectedCombo.originalPrice.toLocaleString()} đ</span>
          </div>

          <button 
            onClick={() => handleAddComboToCart(selectedCombo)}
            className="w-full bg-black text-white py-3.5 rounded-full font-black text-xs hover:bg-neutral-800 transition-colors uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <ShoppingBagIcon className="w-4 h-4 text-white" />
            <span>Mua Trọn Bộ Combo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OutfitCombo;
