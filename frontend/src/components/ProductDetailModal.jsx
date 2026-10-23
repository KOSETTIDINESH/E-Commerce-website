import React, { useState } from 'react';
import { X, Star, ShoppingBag, Truck, ShieldCheck, Check, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart, loading } = useCart();

  const [activeImage, setActiveImage] = useState(
    product.images && product.images.length > 0 ? product.images[0] : ''
  );
  const [selectedSize, setSelectedSize] = useState(
    product.available_sizes && product.available_sizes.length > 0 ? product.available_sizes[0] : 'M'
  );
  const [selectedColor, setSelectedColor] = useState(
    product.available_colors && product.available_colors.length > 0 ? product.available_colors[0].name : 'Onyx Black'
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  // Calculate live stock for selected size & color
  const matchedVariant = product.variants
    ? product.variants.find(
        (v) => v.size === selectedSize && v.color_name.toLowerCase() === selectedColor.toLowerCase()
      )
    : null;

  const currentStock = matchedVariant ? matchedVariant.stock_quantity : (product.is_in_stock ? 15 : 0);

  const discountPercent = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAddToCart = async () => {
    setIsAdding(true);
    const res = await addToCart(product.id, selectedSize, selectedColor, quantity);
    setIsAdding(false);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 my-8 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/90 hover:bg-zinc-100 text-zinc-700 transition shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Images */}
          <div className="bg-zinc-100 p-6 flex flex-col justify-between">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-inner">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 mt-4">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-20 rounded-xl overflow-hidden border-2 transition ${
                      activeImage === img ? 'border-zinc-950 ring-2 ring-zinc-950/20' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details & Selection */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Category & Rating */}
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                <span className="uppercase tracking-widest font-bold text-zinc-400">
                  {product.category} COLLECTION
                </span>
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                  <span>{product.rating || '4.9'} ({product.reviews_count || 120} reviews)</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 font-serif leading-tight">
                {product.name}
              </h2>

              {/* Price Row */}
              <div className="mt-3 flex items-baseline space-x-3">
                <span className="text-2xl sm:text-3xl font-black text-zinc-950">
                  ₹{product.price}
                </span>
                {product.original_price && (
                  <span className="text-base text-zinc-400 line-through">
                    ₹{product.original_price}
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Save ₹{product.original_price ? product.original_price - product.price : 0}
                </span>
              </div>

              {/* Live Stock Indicator */}
              <div className="mt-3 flex items-center space-x-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${currentStock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="font-semibold text-zinc-700">
                  {currentStock > 5
                    ? `In Stock (${currentStock} units available in ${selectedSize})`
                    : currentStock > 0
                    ? `Only ${currentStock} left in stock - order soon!`
                    : 'Out of stock in selected variant'}
                </span>
              </div>

              {/* Description */}
              <p className="mt-4 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {product.description}
              </p>

              {/* Size Selector */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-zinc-900 tracking-wider uppercase">
                    Select Size
                  </label>
                  <span className="text-[11px] text-zinc-500 hover:text-zinc-900 cursor-pointer underline">
                    Size Guide (True to Oversized Fit)
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                    const isAvailable = product.available_sizes
                      ? product.available_sizes.includes(size)
                      : true;
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 rounded-xl text-xs font-black border transition ${
                          selectedSize === size
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm'
                            : isAvailable
                            ? 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-400'
                            : 'bg-zinc-100 text-zinc-300 border-zinc-200 line-through cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selector */}
              {product.available_colors && product.available_colors.length > 0 && (
                <div className="mt-5">
                  <label className="block text-xs font-bold text-zinc-900 tracking-wider uppercase mb-2">
                    Select Color: <span className="font-normal text-zinc-600">{selectedColor}</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    {product.available_colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c.name)}
                        className={`w-7 h-7 rounded-full border-2 transition transform ${
                          selectedColor === c.name
                            ? 'ring-2 ring-zinc-950 ring-offset-2 scale-110'
                            : 'border-zinc-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.code }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="mt-5 flex items-center space-x-4">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-black text-zinc-950">{quantity}</span>
                  <button
                    type="button"
                    disabled={quantity >= currentStock}
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    className="p-2 text-zinc-600 hover:bg-zinc-200 disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-zinc-100 space-y-3">
              <button
                type="button"
                disabled={isAdding || loading || currentStock <= 0}
                onClick={handleAddToCart}
                className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center space-x-2 transition shadow-xl ${
                  currentStock > 0
                    ? 'bg-zinc-950 hover:bg-zinc-800 text-white active:scale-[0.99]'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isAdding
                    ? 'Adding to Bag...'
                    : currentStock > 0
                    ? `Add ${quantity} to Bag • ₹${product.price * quantity}`
                    : 'Currently Out of Stock'}
                </span>
              </button>

              <div className="flex items-center justify-center space-x-6 text-[11px] text-zinc-400">
                <span className="flex items-center">
                  <Truck className="w-3.5 h-3.5 mr-1" />
                  Free shipping over ₹999
                </span>
                <span className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Simulated Demo Checkout
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
