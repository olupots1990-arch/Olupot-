import React from 'react';
import { AdminPanelView } from '../types';
import { DashboardIcon, ShoppingCartIcon, BookOpenIcon, ChartBarIcon, UsersIcon, TrendingUpIcon, ClipboardListIcon, ClockIcon, CurrencyDollarIcon, TagIcon, WrenchScrewdriverIcon, MailIcon, ArchiveBoxIcon, CalendarDaysIcon } from './icons';

interface AdminSidebarProps {
  currentView: AdminPanelView;
  onViewChange: (view: AdminPanelView) => void;
  pendingOrderCount: number;
}

interface NavItem {
    view: AdminPanelView;
    label: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    count?: number;
}

const NavButton: React.FC<{
    view: AdminPanelView,
    label: string,
    Icon: React.FC<React.SVGProps<SVGSVGElement>>,
    currentView: AdminPanelView,
    onViewChange: (view: AdminPanelView) => void,
    count?: number
}> = ({ view, label, Icon, currentView, onViewChange, count }) => {
    const isActive = view === currentView;
    const baseClasses = 'flex items-center w-full p-3 my-1 text-left rounded-lg transition-colors duration-200';
    const activeClasses = 'bg-green-600 text-white shadow-md';
    const inactiveClasses = 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
    
    return (
        <button onClick={() => onViewChange(view)} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            <Icon className="w-6 h-6 mr-3 flex-shrink-0" />
            <span className="font-medium flex-grow">{label}</span>
            {count && count > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {count}
              </span>
            )}
        </button>
    );
};

const NavHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {children}
    </h3>
);

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentView, onViewChange, pendingOrderCount }) => {
  const navItems: {
    top: NavItem[];
    overview: NavItem[];
    management: NavItem[];
    settings: NavItem[];
  } = {
    top: [
        { view: 'dashboard', label: 'Dashboard', Icon: DashboardIcon },
    ],
    overview: [
        { view: 'orders', label: 'Orders', Icon: ShoppingCartIcon, count: pendingOrderCount },
        { view: 'sales', label: 'Sales', Icon: ChartBarIcon },
        { view: 'tasks', label: 'Tasks', Icon: ClipboardListIcon },
        { view: 'submissions', label: 'Submissions', Icon: MailIcon },
    ],
    management: [
        { view: 'products', label: 'Products', Icon: TagIcon },
        { view: 'inventory', label: 'Inventory', Icon: ArchiveBoxIcon },
        { view: 'menu', label: 'Menu Preview', Icon: BookOpenIcon },
        { view: 'agents', label: 'Agents', Icon: UsersIcon },
        { view: 'performance', label: 'Performance', Icon: TrendingUpIcon },
        { view: 'attendance', label: 'Attendance', Icon: ClockIcon },
        { view: 'payroll', label: 'Payroll', Icon: CurrencyDollarIcon },
        { view: 'expenses', label: 'Expenses', Icon: CurrencyDollarIcon },
        { view: 'leave', label: 'Leave', Icon: CalendarDaysIcon },
    ],
    settings: [
        { view: 'settings', label: 'Settings', Icon: WrenchScrewdriverIcon },
    ]
  };

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white px-2">Admin Panel</h2>
      <nav className="flex-grow overflow-y-auto">
        <ul>
          {navItems.top.map(item => (
            <li key={item.view}><NavButton {...item} currentView={currentView} onViewChange={onViewChange} /></li>
          ))}

          <li><NavHeader>Overview</NavHeader></li>
          {navItems.overview.map(item => (
            <li key={item.view}><NavButton {...item} currentView={currentView} onViewChange={onViewChange} /></li>
          ))}

          <li><NavHeader>Management</NavHeader></li>
          {navItems.management.map(item => (
            <li key={item.view}><NavButton {...item} currentView={currentView} onViewChange={onViewChange} /></li>
          ))}

        </ul>
      </nav>
      <div className="flex-shrink-0">
          <ul>
            <li><NavHeader>Configuration</NavHeader></li>
            {navItems.settings.map(item => (
                <li key={item.view}><NavButton {...item} currentView={currentView} onViewChange={onViewChange} /></li>
            ))}
          </ul>
      </div>
    </div>
  );
};

export default AdminSidebar;