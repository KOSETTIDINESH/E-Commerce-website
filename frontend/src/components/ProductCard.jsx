import React, { useState } from 'react';
import { ShoppingBag, Eye, Star, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, onViewDetails }) {
  const { addToCart, loading } = useCart();

  const [selectedSize, setSelectedSize] = useState(
    product.available_sizes && product.available_sizes.length > 0 ? product.available_sizes[0] : 'M'
  );
  const [selectedColor, setSelectedColor] = useState(
    product.available_colors && product.available_colors.length > 0 ? product.available_colors[0].name : 'Onyx Black'
  );
  const [isAdding, setIsAdding] = useState(false);

  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleQuickAdd = async (e) => {
    e.stopPropagation();
    setIsAdding(true);
    await addToCart(product.id, selectedSize, selectedColor, 1);
    setIsAdding(false);
  };

  const isTestItem = product.price === 799;

  return (
    <div
      onClick={() => onViewDetails(product)}
      className="group relative bg-white rounded-2xl border border-zinc-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Product Image Box */}
      <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
        <img
          src={product.images && product.images[0] ? product.images[0] : ''}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isTestItem && (
            <span className="bg-amber-400 text-zinc-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-md tracking-wider">
              TEST PRODUCT (₹799)
            </span>
          )}
          {product.is_new_arrival && (
            <span className="bg-zinc-950 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm tracking-wider">
              NEW DROP
            </span>
          )}
          {product.category === 'anime' && (
            <span className="bg-purple-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-sm tracking-wider">
              ANIME ED.
            </span>
          )}
        </div>

        {discountPercent > 0 && (
          <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-md">
            {discountPercent}% OFF
          </span>
        )}

        {/* Quick View Button Hover Overlay */}
        <div className="absolute inset-0 bg-zinc-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-zinc-900 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center space-x-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </span>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between text-left">
        <div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
            <span className="uppercase tracking-widest font-semibold text-zinc-400">
              {product.category}
            </span>
            <div className="flex items-center text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
              <span>{product.rating || '4.9'}</span>
            </div>
          </div>

          <h3 className="font-bold text-zinc-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-zinc-600 transition-colors">
            {product.name}
          </h3>

          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-lg font-black text-zinc-950">
              ₹{product.price}
            </span>
            {product.original_price && (
              <span className="text-xs text-zinc-400 line-through">
                ₹{product.original_price}
              </span>
            )}
          </div>
        </div>

        {/* Interactive Quick Size & Color Selectors */}
        <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2.5">
          {/* Sizes */}
          {product.available_sizes && product.available_sizes.length > 0 && (
            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] text-zinc-400 font-semibold mr-1">SIZE:</span>
              <div className="flex flex-wrap gap-1">
                {product.available_sizes.slice(0, 5).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition ${
                      selectedSize === size
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color preview swatches */}
          {product.available_colors && product.available_colors.length > 0 && (
            <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] text-zinc-400 font-semibold mr-1">COLOR:</span>
              <div className="flex items-center space-x-1.5">
                {product.available_colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className={`w-4 h-4 rounded-full border transition transform ${
                      selectedColor === c.name
                        ? 'ring-2 ring-zinc-950 ring-offset-1 scale-110'
                        : 'border-zinc-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.code }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick Add To Cart Button */}
          <button
            type="button"
            disabled={isAdding || loading || !product.is_in_stock}
            onClick={handleQuickAdd}
            className={`w-full mt-2 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition shadow-sm ${
              product.is_in_stock
                ? 'bg-zinc-950 hover:bg-zinc-800 text-white active:scale-[0.98]'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>
              {isAdding ? 'Adding to Bag...' : product.is_in_stock ? 'Add to Bag' : 'Out of Stock'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
