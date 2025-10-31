import React, { useState } from 'react';
import { Product } from '../types';
import { BookOpenIcon, CloseIcon, ShoppingCartIcon } from './icons';

interface MenuProps {
  products: Product[];
  isCustomerView?: boolean;
  onAddToCart?: (product: Product, quantity: number) => void;
}

const Menu: React.FC<MenuProps> = ({ products, isCustomerView, onAddToCart }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <div key={product.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-xl flex flex-col ${product.stock === 0 ? 'opacity-60' : ''}`}>
            <div 
              className="relative h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => product.image && setSelectedImage(product.image)}
            >
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white font-bold px-3 py-1 rounded-full text-sm">Out of Stock</span>
                </div>
              )}
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <BookOpenIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{product.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-2">{product.description || 'No description available.'}</p>
              </div>

              <div className="mt-auto pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-green-600 dark:text-green-400 font-bold">${product.price.toFixed(2)}</p>
                  {isCustomerView && onAddToCart && product.stock > 0 ? (
                    <button
                        onClick={() => onAddToCart(product, 1)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 flex items-center gap-1"
                    >
                        <ShoppingCartIcon className="w-4 h-4" />
                        Add to Cart
                    </button>
                  ) : (
                    <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="col-span-1 md:col-span-2 text-center text-gray-500 dark:text-gray-400 py-4">
            No products available on the menu yet.
          </p>
        )}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute -top-3 -right-3 bg-white dark:bg-gray-600 rounded-full p-1 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 z-10"
              aria-label="Close image view"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
            <img src={selectedImage} alt="Enlarged product view" className="w-full h-full object-contain max-h-[calc(80vh-2rem)]" />
          </div>
        </div>
      )}
    </>
  );
};

export default Menu;
