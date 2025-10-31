import React, { useState, useEffect } from 'react';
import { AdminPanelView } from '../types';
import { DashboardIcon, PackageIcon, ShoppingCartIcon, BookOpenIcon, ChartBarIcon, UsersIcon, TrendingUpIcon, ChevronDownIcon } from './icons';

interface AdminSidebarProps {
  currentView: AdminPanelView;
  onViewChange: (view: AdminPanelView) => void;
  pendingOrderCount: number;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentView, onViewChange, pendingOrderCount }) => {
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  useEffect(() => {
    // Automatically open the dropdown if the current view is one of its children
    if (currentView === 'products' || currentView === 'menu' || currentView === 'sales') {
      setIsProductsOpen(true);
    }
  }, [currentView]);

  const navItems = [
    { view: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { view: 'orders', label: 'Orders', icon: ShoppingCartIcon, count: pendingOrderCount },
  ];
  
  const productsSubItems = [
      { view: 'products', label: 'Product Management' },
      { view: 'menu', label: 'Menu Preview' },
      { view: 'sales', label: 'Sales' },
  ];

  const bottomNavItems = [
    { view: 'agents', label: 'Delivery Agents', icon: UsersIcon },
    { view: 'performance', label: 'Agent Performance', icon: TrendingUpIcon },
  ];

  const getButtonClasses = (view: AdminPanelView) => {
    const baseClasses = 'flex items-center w-full p-3 my-1 text-left rounded-lg transition-colors duration-200';
    if (view === currentView) {
      return `${baseClasses} bg-green-600 text-white shadow-md`;
    }
    return `${baseClasses} text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700`;
  };
  
  const getDropdownButtonClasses = () => {
    const baseClasses = 'flex items-center w-full p-3 my-1 text-left rounded-lg transition-colors duration-200';
    const isActive = currentView === 'products' || currentView === 'menu' || currentView === 'sales';
    if (isActive) {
      return `${baseClasses} bg-green-600 text-white shadow-md`;
    }
    return `${baseClasses} text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700`;
  };
  
  const getSubItemButtonClasses = (view: AdminPanelView) => {
    const baseClasses = 'w-full p-2 my-1 text-left rounded-md transition-colors duration-200 text-sm';
     if (view === currentView) {
      return `${baseClasses} bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 font-semibold`;
    }
    return `${baseClasses} text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700`;
  };

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white px-2">Admin Menu</h2>
      <nav>
        <ul>
          {navItems.map(item => (
            <li key={item.view}>
              <button onClick={() => onViewChange(item.view as AdminPanelView)} className={getButtonClasses(item.view as AdminPanelView)}>
                <item.icon className="w-6 h-6 mr-3 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
                {item.count && item.count > 0 ? (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {item.count}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
          
          {/* Products Dropdown */}
          <li>
              <button onClick={() => setIsProductsOpen(!isProductsOpen)} className={getDropdownButtonClasses()}>
                  <PackageIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                  <span className="font-medium">Products</span>
                  <ChevronDownIcon className={`w-5 h-5 ml-auto transition-transform duration-200 ${isProductsOpen ? 'rotate-180' : ''}`} />
              </button>
              {isProductsOpen && (
                  <ul className="pl-6 mt-1 space-y-1">
                      {productsSubItems.map(subItem => (
                          <li key={subItem.view}>
                              <button onClick={() => onViewChange(subItem.view as AdminPanelView)} className={getSubItemButtonClasses(subItem.view as AdminPanelView)}>
                                &#8227; {subItem.label}
                              </button>
                          </li>
                      ))}
                  </ul>
              )}
          </li>

          {bottomNavItems.map(item => (
            <li key={item.view}>
              <button onClick={() => onViewChange(item.view as AdminPanelView)} className={getButtonClasses(item.view as AdminPanelView)}>
                <item.icon className="w-6 h-6 mr-3 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;