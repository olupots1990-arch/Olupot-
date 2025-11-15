import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { BookOpenIcon, CloseIcon, ShoppingCartIcon, CheckIcon } from './icons';

interface MenuProps {
  products: Product[];
  isCustomerView?: boolean;
  onAddToCart?: (product: Product, quantity: number) => void;
}

const Menu: React.FC<MenuProps> = ({ products, isCustomerView, onAddToCart }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [recentlyAddedProductId, setRecentlyAddedProductId] = useState<string | null>(null);

  // State for zoom and pan functionality
  const [isZoomed, setIsZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const didDragRef = useRef(false);

  const handleOpenModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setIsZoomed(false);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    didDragRef.current = false;
  };

  const handleImageClick = () => {
    if (didDragRef.current) {
      return; 
    }
    if (isZoomed) {
      setIsZoomed(false);
      setPan({ x: 0, y: 0 });
    } else {
      setIsZoomed(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageRef.current) return;
    e.preventDefault();
    didDragRef.current = false;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !isZoomed || !imageRef.current || !imageContainerRef.current) return;
    e.preventDefault();
    didDragRef.current = true;

    const parentRect = imageContainerRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();

    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;
    
    const maxPanX = Math.max(0, (imgRect.width - parentRect.width) / 2);
    const maxPanY = Math.max(0, (imgRect.height - parentRect.height) / 2);

    newX = Math.max(-maxPanX, Math.min(maxPanX, newX));
    newY = Math.max(-maxPanY, Math.min(maxPanY, newY));

    setPan({ x: newX, y: newY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    // Use a short timeout to reset didDragRef, allowing click to process if it was not a drag
    setTimeout(() => {
        didDragRef.current = false;
    }, 50);
  };
  
  const handleAddToCartClick = (product: Product) => {
    if (onAddToCart) {
        onAddToCart(product, 1);
        setRecentlyAddedProductId(product.id);
        setTimeout(() => {
            setRecentlyAddedProductId(null);
        }, 2000);
    }
  };

  const imageModal = (
    selectedImage && (
      <div 
        className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4"
        onClick={handleCloseModal}
      >
        <div
          ref={imageContainerRef}
          className="relative bg-transparent rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full h-full overflow-hidden flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          <button 
            onClick={handleCloseModal} 
            className="absolute top-3 right-3 bg-white/50 dark:bg-gray-600/50 rounded-full p-1 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 z-10"
            aria-label="Close image view"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
          <img
            ref={imageRef}
            src={selectedImage}
            alt="Enlarged product view"
            className={`transition-transform duration-200 ease-in-out select-none ${isZoomed ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${isZoomed ? 2 : 1})`,
              maxHeight: '100%',
              maxWidth: '100%',
            }}
            onClick={handleImageClick}
            draggable="false"
          />
        </div>
      </div>
    )
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => {
            const isRecentlyAdded = recentlyAddedProductId === product.id;
            return (
              <div key={product.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-xl flex flex-col ${product.stock === 0 ? 'opacity-60' : ''}`}>
                <div 
                  className="relative h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => product.image && handleOpenModal(product.image)}
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
                      {isCustomerView && onAddToCart ? (
                        <button
                            onClick={() => handleAddToCartClick(product)}
                            disabled={isRecentlyAdded || product.stock === 0}
                            className={`w-28 px-3 py-1 text-xs font-semibold rounded-full flex items-center justify-center gap-1 transition-all duration-300 ease-in-out ${
                                isRecentlyAdded 
                                ? 'bg-green-600 text-white' 
                                : product.stock > 0
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {isRecentlyAdded ? (
                                <>
                                    <CheckIcon className="w-4 h-4" />
                                    <span>Added!</span>
                                </>
                            ) : product.stock > 0 ? (
                                <>
                                    <ShoppingCartIcon className="w-4 h-4" />
                                    <span>Add to Cart</span>
                                </>
                            ) : (
                                <span>Out of Stock</span>
                            )}
                        </button>
                      ) : (
                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
        })}
        {products.length === 0 && (
          <p className="col-span-1 md:col-span-2 text-center text-gray-500 dark:text-gray-400 py-4">
            No products available on the menu yet.
          </p>
        )}
      </div>

      {imageModal}
    </>
  );
};

export default Menu;