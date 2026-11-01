import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { ArrowLeftIcon, ShoppingBagIcon, StarIcon, TrashIcon } from './Icons';

function WishlistView({ onBackToHome, onNavigateProduct }) {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleQuickAdd = (e, product) => {
    e.stopPropagation();
    addToCart(product, null, 1, {
      color: 'Mặc định',
      size: 'Tiêu chuẩn'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <button
            onClick={onBackToHome}
            className="inline-flex items-center space-x-1.5 text-xs text-gray-500 hover:text-black font-semibold mb-2"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Quay lại mua sắm</span>
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center space-x-2">
            <span>❤️ Danh Sách Yêu Thích</span>
            <span className="text-sm font-normal text-gray-400 normal-case">
              ({wishlistItems.length} sản phẩm)
            </span>
          </h1>
        </div>

        {wishlistItems.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-xs text-gray-500 hover:text-red-600 font-semibold self-start sm:self-auto"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8 shadow-sm my-8">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🤍
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Chưa có sản phẩm nào trong danh sách yêu thích</h3>
          <p className="text-xs text-gray-500 mb-6">
            Nhấn vào biểu tượng trái tim ở góc mỗi sản phẩm để lưu lại và xem lại bất cứ lúc nào!
          </p>
          <button
            onClick={onBackToHome}
            className="bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase px-6 py-3 rounded-full transition"
          >
            Khám Phá Sản Phẩm Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 my-8">
          {wishlistItems.map((product) => (
            <div
              key={product.id}
              onClick={() => onNavigateProduct && onNavigateProduct(product.id)}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-60 bg-gray-100 relative overflow-hidden">
                  <img
                    src={product.main_image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(product.id);
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow-md hover:bg-red-50 transition"
                    title="Xóa khỏi yêu thích"
                  >
                    ❤️
                  </button>
                </div>

                <div className="p-3.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    {product.category_name || 'Thời Trang & Tóc Giả'}
                  </span>
                  <h3 className="text-xs font-bold line-clamp-2 text-gray-900 group-hover:text-orange-600 transition">
                    {product.name}
                  </h3>
                  <div className="flex items-center space-x-1 mt-1 text-[11px] text-gray-500">
                    <StarIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-gray-800">{product.rating || 5.0}</span>
                    <span>• {product.sold_count || '1.2k+'} đã bán</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 pt-0 border-t border-gray-100 flex items-center justify-between mt-2">
                <div>
                  <span className="text-sm font-black text-red-600 block">
                    {(product.price || 299000).toLocaleString()} đ
                  </span>
                  {product.original_price && (
                    <span className="text-[10px] text-gray-400 line-through">
                      {Number(product.original_price).toLocaleString()} đ
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => handleQuickAdd(e, product)}
                  className="bg-black hover:bg-neutral-800 text-white p-2.5 rounded-full transition shadow"
                  title="Thêm vào giỏ hàng"
                >
                  <ShoppingBagIcon className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WishlistView;
