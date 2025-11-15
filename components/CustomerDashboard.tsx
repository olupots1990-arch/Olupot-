import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import Menu from './Menu';
import { ShoppingCartIcon, CloseIcon, TrashIcon } from './icons';

interface CustomerDashboardProps {
  onPlaceOrder: (cart: { product: Product, quantity: number }[], address: string) => void;
}

type CartItem = {
    product: Product;
    quantity: number;
}

const MINIMUM_ORDER_VALUE = 10;

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onPlaceOrder }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderSummary, setOrderSummary] = useState<{ cart: CartItem[], address: string } | null>(null);
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('geminiProducts') || '[]');
    setProducts(storedProducts);
  }, []);

  const handleAddToCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
        const existingItem = prevCart.find(item => item.product.id === product.id);
        if (existingItem) {
            return prevCart.map(item => 
                item.product.id === product.id 
                ? { ...item, quantity: item.quantity + quantity } 
                : item
            );
        }
        return [...prevCart, { product, quantity }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };
  
  const handleShowConfirmation = (e: React.FormEvent) => {
      e.preventDefault();
      if(deliveryAddress.trim() === '') {
          setAddressError('Delivery address cannot be empty.');
          return;
      }
      setAddressError('');
      setOrderSummary({ cart, address: deliveryAddress });
      setIsAddressModalOpen(false);
      setIsConfirmationModalOpen(true);
  }

  const handleConfirmOrder = () => {
    if (!orderSummary) return;

    onPlaceOrder(orderSummary.cart, orderSummary.address);
    setCart([]);
    setDeliveryAddress('');
    setOrderSummary(null);
    setIsConfirmationModalOpen(false);
  }

  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const isBelowMinimum = cart.length > 0 && cartTotal < MINIMUM_ORDER_VALUE;

  return (
    <div className="w-full md:w-3/5 p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-y-auto hidden md:flex flex-col">
       {isAddressModalOpen && (
         <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
              <form onSubmit={handleShowConfirmation}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Delivery Information</h3>
                  <button type="button" onClick={() => setIsAddressModalOpen(false)}><CloseIcon className="w-6 h-6 text-gray-500 hover:text-gray-800"/></button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Address</label>
                  <input 
                    type="text" 
                    value={deliveryAddress} 
                    onChange={e => {
                        setDeliveryAddress(e.target.value);
                        if (addressError) setAddressError('');
                    }} 
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700" 
                    placeholder="e.g., 123 Main St, Anytown, USA"
                  />
                  {addressError && <p className="text-red-500 text-sm mt-1">{addressError}</p>}
                </div>
                <div className="mt-6 flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Review Order</button>
                </div>
              </form>
            </div>
          </div>
       )}

      {isConfirmationModalOpen && orderSummary && (
         <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Confirm Your Order</h3>
                <button type="button" onClick={() => setIsConfirmationModalOpen(false)}><CloseIcon className="w-6 h-6 text-gray-500 hover:text-gray-800"/></button>
              </div>
              <div className="space-y-3 my-3 max-h-48 overflow-y-auto pr-2 border-b dark:border-gray-700 pb-3">
                  {orderSummary.cart.map(item => (
                      <div key={item.product.id} className="flex justify-between items-center text-sm">
                          <div>
                              <p className="font-semibold">{item.product.name}</p>
                              <p className="text-xs text-gray-500">${item.product.price.toFixed(2)} x {item.quantity}</p>
                          </div>
                          <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                  ))}
              </div>
              <div className="text-sm mt-3">
                  <p><span className="font-semibold">Deliver to:</span> {orderSummary.address}</p>
              </div>
              <div className="border-t dark:border-gray-700 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold text-xl">Total: ${cartTotal.toFixed(2)}</span>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setIsConfirmationModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Go Back</button>
                  <button onClick={handleConfirmOrder} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirm Order</button>
              </div>
            </div>
          </div>
       )}

      <div className="flex-shrink-0 p-4 mb-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Stanley's Cafeteria Menu</h2>
        <p className="text-gray-600 dark:text-gray-400">Browse our menu and add items to your cart.</p>
      </div>

      <div className="flex-grow overflow-y-auto pr-2">
        <Menu products={products} isCustomerView={true} onAddToCart={handleAddToCart} />
      </div>

      {cart.length > 0 && (
          <div className="flex-shrink-0 mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold flex items-center gap-2"><ShoppingCartIcon className="w-6 h-6"/> Your Cart</h3>
            <div className="space-y-2 my-3 max-h-32 overflow-y-auto pr-2">
                {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center text-sm">
                        <div>
                            <p className="font-semibold">{item.product.name}</p>
                            <p className="text-xs text-gray-500">${item.product.price.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                           <button onClick={() => handleRemoveFromCart(item.product.id)} className="p-1 text-gray-500 hover:text-red-500">
                                <TrashIcon className="w-4 h-4"/>
                           </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t dark:border-gray-700 pt-3">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-xl">Total: ${cartTotal.toFixed(2)}</span>
                    <button 
                        onClick={() => setIsAddressModalOpen(true)} 
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={isBelowMinimum}
                    >
                        Place Order
                    </button>
                </div>
                {isBelowMinimum && (
                    <p className="text-right text-sm text-red-500 dark:text-red-400 mt-2">
                        You need ${ (MINIMUM_ORDER_VALUE - cartTotal).toFixed(2) } more to reach the minimum order of ${MINIMUM_ORDER_VALUE.toFixed(2)}.
                    </p>
                )}
            </div>
          </div>
      )}
    </div>
  );
};

export default CustomerDashboard;