import React, { useState, useEffect, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';
import AdminSidebar from './components/AdminSidebar';
import CustomerDashboard from './components/CustomerDashboard';
import HomePage from './components/HomePage';
import { AppView, AdminPanelView, Product, DeliveryOrder, DeliveryAgent, FaqItem, OrderItem, InitialAction, LeaveRequest } from './types';
import { UserIcon, CogIcon, MoonIcon, SunIcon, ExclamationTriangleIcon, CloseIcon } from './components/icons';

const DEFAULT_SYSTEM_INSTRUCTION = " STANLEY'S CAFETERIA. Your goal is to assist users, show the menu, and answer any questions. You can list available food products with their prices. You can also help users place food delivery orders. Since you work for Stanley's Cafeteria, you do not need to ask for the restaurant name. When a user wants to place an order, if you don't have all the necessary information, ask for it. The required information is: food items, delivery address, customer's name, and phone number. A helpful way to ask is: 'Great! To help me place your order, could you please tell me: 1. What food items would you like to order? 2. What is the delivery address? 3. What is your name? 4. What is your phone number?'";

const DEFAULT_ABOUT = "Founded in 2025, STANLEY'S CAFETERIA was born from a passion for authentic, high-quality food served with a modern twist. We believe in fresh ingredients, culinary excellence, and providing a warm, welcoming experience for every customer.";
const DEFAULT_HISTORY = "From our humble beginnings as a small family-run kitchen, we've grown into a beloved local eatery. We've embraced technology to better serve our loyal customers.";
const DEFAULT_FAQS: FaqItem[] = [
  {
    id: `faq-${Date.now()}-1`,
    question: "How can I place an order?",
    answer: "You can place an order directly through our interactive chat! Just click the 'Chat to Order' button. You can ask our bot to show you the menu, or tell it what you'd like to order."
  },
  {
    id: `faq-${Date.now()}-2`,
    question: "What are your opening hours?",
    answer: "We are open from 11:00 AM to 10:00 PM from Monday to Saturday, and from 12:00 PM to 9:00 PM on Sundays."
  },
];
const DEFAULT_WHATSAPP_MESSAGE = "Hello! I'd like to place an order.";


const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300 animate-pulse">
            {message}
        </div>
    );
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  const [view, setView] = useState<AppView>('home');
  const [adminView, setAdminView] = useState<AdminPanelView>('dashboard');
  const [systemInstruction, setSystemInstruction] = useState<string>(() => {
    return localStorage.getItem('geminiSystemInstruction') || DEFAULT_SYSTEM_INSTRUCTION;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [homeBackground, setHomeBackground] = useState<string | null>(null);
  const [showCompatibilityWarning, setShowCompatibilityWarning] = useState(false);
  const [initialAdminAction, setInitialAdminAction] = useState<InitialAction>(null);
  const [loggedInAgent, setLoggedInAgent] = useState<DeliveryAgent | null>(null);

  // Home page content state
  const [aboutContent, setAboutContent] = useState<string>('');
  const [historyContent, setHistoryContent] = useState<string>('');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const checkCompatibility = () => {
        const hasLocalStorage = typeof window.localStorage !== 'undefined';
        const hasMediaDevices = !!navigator.mediaDevices;
        const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);

        if (!hasLocalStorage || !hasMediaDevices || !hasAudioContext) {
            setShowCompatibilityWarning(true);
        }
    };
    checkCompatibility();
  }, []);

  useEffect(() => {
    // Handle deep-linking for order approvals
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const actionParam = params.get('action');
    const orderIdParam = params.get('orderId');

    if (viewParam === 'admin' && actionParam === 'approve' && orderIdParam) {
      setView('admin');
      setAdminView('orders'); // Go directly to orders view
      setInitialAdminAction({ type: 'approve', orderId: orderIdParam });
      // Clean the URL so a refresh doesn't re-trigger the action
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }, []);

  useEffect(() => {
    const loggedInAgentId = sessionStorage.getItem('loggedInAgentId');
    if (loggedInAgentId) {
        const agents: DeliveryAgent[] = JSON.parse(localStorage.getItem('geminiDeliveryAgents') || '[]');
        const agent = agents.find(a => a.id === loggedInAgentId);
        if (agent) {
            setLoggedInAgent(agent);
        }
    }
  }, []);

  const handleLogin = (agentId: string) => {
    const agents: DeliveryAgent[] = JSON.parse(localStorage.getItem('geminiDeliveryAgents') || '[]');
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
        setLoggedInAgent(agent);
        sessionStorage.setItem('loggedInAgentId', agent.id);
        setToastMessage(`Welcome, ${agent.name}!`);
    }
  };

  const handleLogout = () => {
      if(loggedInAgent) {
        setToastMessage(`Goodbye, ${loggedInAgent.name}!`);
      }
      setLoggedInAgent(null);
      sessionStorage.removeItem('loggedInAgentId');
  };


  useEffect(() => {
    const storedBg = localStorage.getItem('geminiHomeBackground');
    if (storedBg) {
        setHomeBackground(storedBg);
    }
    setAboutContent(localStorage.getItem('geminiAboutContent') || DEFAULT_ABOUT);
    setHistoryContent(localStorage.getItem('geminiHistoryContent') || DEFAULT_HISTORY);
    setFaqs(JSON.parse(localStorage.getItem('geminiFaqs') || JSON.stringify(DEFAULT_FAQS)));
    setContactPhone(localStorage.getItem('geminiContactPhone') || '+971504291207');
    setContactEmail(localStorage.getItem('geminiContactEmail') || 'contact@stanleyscafeteria.com');
    setWhatsappMessage(localStorage.getItem('geminiWhatsappMessage') || DEFAULT_WHATSAPP_MESSAGE);

  }, []);

  const handleSetHomeBackground = (imageDataUrl: string | null) => {
    setHomeBackground(imageDataUrl);
    if (imageDataUrl) {
        localStorage.setItem('geminiHomeBackground', imageDataUrl);
    } else {
        localStorage.removeItem('geminiHomeBackground');
    }
  };

  const calculatePendingOrders = useCallback(() => {
      const orders: DeliveryOrder[] = JSON.parse(localStorage.getItem('geminiDeliveryOrders') || '[]');
      const count = orders.filter(o => o.status === 'pending').length;
      setPendingOrderCount(count);
  }, []);
  
  const showNewOrderNotification = useCallback(() => {
    setToastMessage('New pending order received!');
    calculatePendingOrders();
  }, [calculatePendingOrders]);


  useEffect(() => {
      calculatePendingOrders();
  }, [calculatePendingOrders]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'geminiDeliveryOrders' && event.newValue) {
        const newOrders: DeliveryOrder[] = JSON.parse(event.newValue);
        const oldOrders: DeliveryOrder[] = JSON.parse(event.oldValue || '[]');
        
        const newPendingCount = newOrders.filter(o => o.status === 'pending').length;
        const oldPendingCount = oldOrders.filter(o => o.status === 'pending').length;
        
        if (newPendingCount > oldPendingCount) {
             setToastMessage('New pending order received!');
        }
        setPendingOrderCount(newPendingCount);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('geminiSystemInstruction', systemInstruction);
  }, [systemInstruction]);
  
  useEffect(() => {
    localStorage.setItem('geminiAboutContent', aboutContent);
  }, [aboutContent]);

  useEffect(() => {
    localStorage.setItem('geminiHistoryContent', historyContent);
  }, [historyContent]);

  useEffect(() => {
    localStorage.setItem('geminiFaqs', JSON.stringify(faqs));
  }, [faqs]);

  useEffect(() => {
    localStorage.setItem('geminiContactPhone', contactPhone);
  }, [contactPhone]);

  useEffect(() => {
    localStorage.setItem('geminiContactEmail', contactEmail);
  }, [contactEmail]);
  
  useEffect(() => {
    localStorage.setItem('geminiWhatsappMessage', whatsappMessage);
  }, [whatsappMessage]);

  useEffect(() => {
    const existingProducts = localStorage.getItem('geminiProducts');
    if (!existingProducts) {
      const defaultProducts: Product[] = [
        { id: `prod-${Date.now()}-1`, name: 'Margherita Pizza', price: 12.99, description: 'Classic pizza with fresh mozzarella, tomatoes, and basil.', image: 'https://placehold.co/600x400/F87171/FFFFFF?text=Pizza', stock: 20 },
        { id: `prod-${Date.now()}-2`, name: 'Pepperoni Pizza', price: 14.99, description: 'A favorite with spicy pepperoni and melted cheese.', image: 'https://placehold.co/600x400/FBBF24/FFFFFF?text=Pizza', stock: 15 },
        { id: `prod-${Date.now()}-3`, name: 'Cheeseburger', price: 9.99, description: 'Juicy beef patty with cheddar cheese, lettuce, and tomato.', image: 'https://placehold.co/600x400/34D399/FFFFFF?text=Burger', stock: 30 },
        { id: `prod-${Date.now()}-4`, name: 'Caesar Salad', price: 8.50, description: 'Crisp romaine lettuce with Caesar dressing, croutons, and parmesan.', image: 'https://placehold.co/600x400/60A5FA/FFFFFF?text=Salad', stock: 25 },
        { id: `prod-${Date.now()}-5`, name: 'Coca-Cola', price: 2.50, description: 'A refreshing can of Coca-Cola.', image: 'https://placehold.co/600x400/A78BFA/FFFFFF?text=Drink', stock: 50 },
      ];
      localStorage.setItem('geminiProducts', JSON.stringify(defaultProducts));
      setProducts(defaultProducts);
    } else {
      setProducts(JSON.parse(existingProducts));
    }
    
    let defaultAgents: DeliveryAgent[] = [];
    const existingAgents = localStorage.getItem('geminiDeliveryAgents');
    if (!existingAgents) {
      defaultAgents = [
        { id: `agent-${Date.now()}-1`, name: 'John Doe', phone: '123-456-7890', status: 'available', currentLocation: { lat: 34.0522, lng: -118.2437 }, attendanceStatus: 'clocked-out', hourlyRate: 15.50 },
        { id: `agent-${Date.now()}-2`, name: 'Jane Smith', phone: '098-765-4321', status: 'available', currentLocation: { lat: 34.0522, lng: -118.2437 }, attendanceStatus: 'clocked-out', hourlyRate: 16.00 },
      ];
      localStorage.setItem('geminiDeliveryAgents', JSON.stringify(defaultAgents));
    } else {
      defaultAgents = JSON.parse(existingAgents);
    }

    const existingSubmissions = localStorage.getItem('geminiContactSubmissions');
    if (!existingSubmissions) {
      localStorage.setItem('geminiContactSubmissions', JSON.stringify([]));
    }

    const existingTasks = localStorage.getItem('geminiTasks');
    if (!existingTasks) {
      localStorage.setItem('geminiTasks', JSON.stringify([]));
    }

    const existingAttendance = localStorage.getItem('geminiAttendanceRecords');
    if (!existingAttendance) {
        localStorage.setItem('geminiAttendanceRecords', JSON.stringify([]));
    }

    const existingPayroll = localStorage.getItem('geminiPayrollRecords');
    if (!existingPayroll) {
        localStorage.setItem('geminiPayrollRecords', JSON.stringify([]));
    }

    const existingExpenses = localStorage.getItem('geminiExpenseRecords');
    if (!existingExpenses) {
        localStorage.setItem('geminiExpenseRecords', JSON.stringify([]));
    }

    const existingStockRecords = localStorage.getItem('geminiStockRecords');
    if (!existingStockRecords) {
        localStorage.setItem('geminiStockRecords', JSON.stringify([]));
    }

    const existingLeaveRequests = localStorage.getItem('geminiLeaveRequests');
    if (!existingLeaveRequests && defaultAgents.length > 0) {
        const sampleLeaveRequests: LeaveRequest[] = [
            {
                id: `leave-${Date.now()}-1`,
                agentId: defaultAgents[0].id,
                agentName: defaultAgents[0].name,
                startDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
                endDate: new Date(new Date().setDate(new Date().getDate() + 12)).toISOString().split('T')[0],
                reason: 'Family vacation',
                status: 'pending',
                requestedAt: new Date().toISOString()
            },
            {
                id: `leave-${Date.now()}-2`,
                agentId: defaultAgents.length > 1 ? defaultAgents[1].id : defaultAgents[0].id,
                agentName: defaultAgents.length > 1 ? defaultAgents[1].name : defaultAgents[0].name,
                startDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
                endDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
                reason: 'Doctor\'s appointment',
                status: 'approved',
                requestedAt: new Date(Date.now() - 86400000 * 2).toISOString()
            }
        ];
        localStorage.setItem('geminiLeaveRequests', JSON.stringify(sampleLeaveRequests));
    }

  }, []);

  const handleSetSystemInstruction = (instruction: string) => {
    setSystemInstruction(instruction);
  };
  
  const handleResetSystemInstruction = () => {
    setSystemInstruction(DEFAULT_SYSTEM_INSTRUCTION);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 shadow-2xl rounded-lg overflow-hidden">
        
        {showCompatibilityWarning && (
            <div className="bg-yellow-100 border-b-2 border-yellow-300 text-yellow-800 p-3 text-sm flex justify-between items-center dark:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    <span>Your browser may not support all features (like voice chat). Please use a modern browser for the best experience.</span>
                </div>
                <button onClick={() => setShowCompatibilityWarning(false)} className="p-1 rounded-full hover:bg-yellow-200/50 dark:hover:bg-yellow-800/50">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
        )}

        <div className="flex items-center p-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex-1"></div> {/* Left spacer */}
          <div className="flex-none flex space-x-2 rounded-lg p-1 bg-gray-200 dark:bg-gray-700">
            <button 
              onClick={() => setView('home')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === 'home' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600/50'}`}
              title="Home"
            >
              <UserIcon className="w-5 h-5" />
              <span>Home</span>
            </button>
            <button 
              onClick={() => setView('admin')}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === 'admin' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600/50'}`}
              title="Admin Panel"
            >
              <CogIcon className="w-5 h-5" />
              <span>Admin Panel</span>
            </button>
          </div>
           <div className="flex-1 flex justify-end pr-2">
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
          {view === 'home' ? (
            <HomePage
              backgroundImage={homeBackground}
              aboutContent={aboutContent}
              historyContent={historyContent}
              faqs={faqs}
              contactPhone={contactPhone}
              contactEmail={contactEmail}
              whatsappMessage={whatsappMessage}
              products={products}
              systemInstruction={systemInstruction}
              onNewOrderPlaced={showNewOrderNotification}
              onOrderChange={calculatePendingOrders}
              loggedInAgent={loggedInAgent}
              onLogin={handleLogin}
              onLogout={handleLogout}
              setToast={setToastMessage}
            />
          ) : (
            <>
              <AdminSidebar currentView={adminView} onViewChange={setAdminView} pendingOrderCount={pendingOrderCount} />
              <AdminPanel 
                view={adminView}
                systemInstruction={systemInstruction} 
                onSaveSystemInstruction={handleSetSystemInstruction}
                onResetSystemInstruction={handleResetSystemInstruction}
                homeBackground={homeBackground}
                onSetHomeBackground={handleSetHomeBackground}
                aboutContent={aboutContent}
                onAboutContentChange={setAboutContent}
                historyContent={historyContent}
                onHistoryContentChange={setHistoryContent}
                faqs={faqs}
                onFaqsChange={setFaqs}
                contactPhone={contactPhone}
                onContactPhoneChange={setContactPhone}
                contactEmail={contactEmail}
                onContactEmailChange={setContactEmail}
                whatsappMessage={whatsappMessage}
                onWhatsappMessageChange={setWhatsappMessage}
                initialAction={initialAdminAction}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;