import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DeliveryOrder, AdminPanelView, Product, DeliveryAgent, FaqItem, ContactSubmission, Task, AttendanceRecord, PayrollRecord, ExpenseRecord, ExpenseCategory, InitialAction, StockRecord, LeaveRequest, LeaveRequestStatus } from '../types';
import { PlusIcon, EditIcon, TrashIcon, SaveIcon, CloseIcon, BookOpenIcon, UsersIcon, MapPinIcon, TrendingUpIcon, ChartBarIcon, QuestionMarkCircleIcon, MailIcon, ClipboardListIcon, ClockIcon, CurrencyDollarIcon, ShoppingCartIcon, WhatsAppIcon, CheckCircleIcon, ArchiveBoxIcon, CalendarDaysIcon, TagIcon } from './icons';
import Menu from './Menu';
import { compressImage } from '../utils/image';

// Fix: Declare the 'google' global variable to resolve TypeScript errors for the Google Maps API.
declare const google: any;

const TrackAgentModal: React.FC<{
  onClose: () => void;
  order: DeliveryOrder;
  agent: DeliveryAgent;
}> = ({ onClose, order, agent }) => {
    const [currentLocation, setCurrentLocation] = useState(agent.currentLocation);
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<any | null>(null);
    const markerRef = useRef<any | null>(null);

    const simulateMovement = useCallback(() => {
        setCurrentLocation(prev => {
            if (!prev) return prev;
            // Simple simulation: slightly alter lat/lng
            const newLat = prev.lat + (Math.random() - 0.5) * 0.001;
            const newLng = prev.lng + (Math.random() - 0.5) * 0.001;
            const newPos = { lat: newLat, lng: newLng };
            
            if (googleMapRef.current && markerRef.current) {
                const googleLatLng = new google.maps.LatLng(newLat, newLng);
                markerRef.current.setPosition(googleLatLng);
                googleMapRef.current.panTo(googleLatLng);
            }
            return newPos;
        });
    }, []);

    useEffect(() => {
        // This effect initializes the map once a location is available and the map isn't already created.
        if (mapRef.current && currentLocation && !googleMapRef.current) {
            const map = new google.maps.Map(mapRef.current, {
                center: currentLocation,
                zoom: 15,
            });
            googleMapRef.current = map;
            markerRef.current = new google.maps.Marker({
                position: currentLocation,
                map: map,
                title: agent.name
            });
        }
    }, [currentLocation, agent.name]);

    useEffect(() => {
        // This effect runs the simulation interval.
        const intervalId = window.setInterval(simulateMovement, 3000);
        return () => {
            clearInterval(intervalId);
        };
    }, [simulateMovement]);


    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2"><MapPinIcon className="w-6 h-6"/>Tracking Agent: {agent.name}</h3>
                    <button type="button" onClick={onClose} aria-label="Close agent tracking modal"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <div className="space-y-2 text-sm mb-4">
                    <p><strong>Destination:</strong> {order.deliveryAddress}</p>
                    <p><strong>Agent Status:</strong> <span className="font-mono p-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">{agent.status}</span></p>
                    {currentLocation && <p><strong>Live Location:</strong> <span className="font-mono text-xs">{currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span></p>}
                </div>
                 {currentLocation ? (
                    <div ref={mapRef} className="w-full h-80 bg-gray-200 dark:bg-gray-700 rounded-md">
                        {/* Google Map will be rendered here */}
                    </div>
                 ) : (
                    <div className="w-full h-80 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500">
                        Agent location not currently available.
                    </div>
                 )}
            </div>
        </div>
    );
};


interface AdminPanelProps {
  view: AdminPanelView;
  systemInstruction: string;
  onSaveSystemInstruction: (instruction: string) => void;
  onResetSystemInstruction: () => void;
  homeBackground: string | null;
  onSetHomeBackground: (imageDataUrl: string | null) => void;
  aboutContent: string;
  onAboutContentChange: (content: string) => void;
  historyContent: string;
  onHistoryContentChange: (content: string) => void;
  faqs: FaqItem[];
  onFaqsChange: (faqs: FaqItem[]) => void;
  contactPhone: string;
  onContactPhoneChange: (phone: string) => void;
  contactEmail: string;
  onContactEmailChange: (email: string) => void;
  whatsappMessage: string;
  onWhatsappMessageChange: (message: string) => void;
  initialAction: InitialAction;
}

interface FaqModalProps {
    faq: FaqItem | null;
    onClose: () => void;
    onSave: (faq: FaqItem) => void;
}

const FaqModal: React.FC<FaqModalProps> = ({ faq, onClose, onSave }) => {
    const [question, setQuestion] = useState(faq?.question || '');
    const [answer, setAnswer] = useState(faq?.answer || '');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: faq?.id || `faq-${Date.now()}`,
            question,
            answer,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                <form onSubmit={handleSave}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">{faq ? 'Edit FAQ' : 'Add New FAQ'}</h3>
                        <button type="button" onClick={onClose} aria-label="Close modal"><CloseIcon className="w-6 h-6"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Question</label>
                            <input type="text" value={question} onChange={e => setQuestion(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Answer</label>
                            <textarea value={answer} onChange={e => setAnswer(e.target.value)} required rows={4} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 resize-none" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"><SaveIcon className="w-5 h-5 inline mr-2"/>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


interface SettingsViewProps {
  systemInstruction: string;
  onSaveSystemInstruction: (instruction: string) => void;
  onResetSystemInstruction: () => void;
  homeBackground: string | null;
  onSetHomeBackground: (imageDataUrl: string | null) => void;
  aboutContent: string;
  onAboutContentChange: (content: string) => void;
  historyContent: string;
  onHistoryContentChange: (content: string) => void;
  faqs: FaqItem[];
  onFaqsChange: (faqs: FaqItem[]) => void;
  contactPhone: string;
  onContactPhoneChange: (phone: string) => void;
  contactEmail: string;
  onContactEmailChange: (email: string) => void;
  whatsappMessage: string;
  onWhatsappMessageChange: (message: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const [localInstruction, setLocalInstruction] = useState(props.systemInstruction);
  const [isInstructionSaved, setIsInstructionSaved] = useState(true);

  const [localAbout, setLocalAbout] = useState(props.aboutContent);
  const [localHistory, setLocalHistory] = useState(props.historyContent);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [localPhone, setLocalPhone] = useState(props.contactPhone);
  const [localEmail, setLocalEmail] = useState(props.contactEmail);
  const [localWhatsappMessage, setLocalWhatsappMessage] = useState(props.whatsappMessage);

  useEffect(() => {
    setLocalInstruction(props.systemInstruction);
    setIsInstructionSaved(true);
  }, [props.systemInstruction]);

  useEffect(() => {
      setLocalAbout(props.aboutContent);
      setLocalHistory(props.historyContent);
      setLocalPhone(props.contactPhone);
      setLocalEmail(props.contactEmail);
      setLocalWhatsappMessage(props.whatsappMessage);
  }, [props.aboutContent, props.historyContent, props.contactPhone, props.contactEmail, props.whatsappMessage]);


  const handleSaveInstruction = () => {
    props.onSaveSystemInstruction(localInstruction);
    setIsInstructionSaved(true);
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file, 1920, 0.8);
        props.onSetHomeBackground(compressedDataUrl);
      } catch (error) {
        console.error("Failed to compress image:", error);
        alert("There was an error processing the image. Please try a different file.");
      }
    }
  };

  const handleSaveFaq = (faq: FaqItem) => {
      const isEditing = props.faqs.some(f => f.id === faq.id);
      const updatedFaqs = isEditing
          ? props.faqs.map(f => f.id === faq.id ? faq : f)
          : [...props.faqs, faq];
      props.onFaqsChange(updatedFaqs);
      setIsFaqModalOpen(false);
      setEditingFaq(null);
  };

  const handleDeleteFaq = (faqId: string) => {
      if (window.confirm("Are you sure you want to delete this FAQ?")) {
          props.onFaqsChange(props.faqs.filter(f => f.id !== faqId));
      }
  };
  
  const handleSaveContactInfo = () => {
    props.onContactPhoneChange(localPhone);
    props.onContactEmailChange(localEmail);
    props.onWhatsappMessageChange(localWhatsappMessage);
    alert('Contact info saved!');
  };

  return (
    <div className="space-y-6">
       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Bot Configuration</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This is the core instruction that tells your AI bot how to behave. Be descriptive for the best results.</p>
        <textarea
          value={localInstruction}
          onChange={(e) => {setLocalInstruction(e.target.value); setIsInstructionSaved(false);}}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 bg-gray-50 dark:bg-gray-700 resize-none transition"
          rows={6}
        />
        <div className="mt-4 flex justify-end space-x-3">
          <button onClick={props.onResetSystemInstruction} className="px-4 py-2 border rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Reset to Default
          </button>
          <button onClick={handleSaveInstruction} disabled={isInstructionSaved} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
            {isInstructionSaved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Home Page Content</h3>
        <div className="space-y-4">
           <div>
               <label className="block text-sm font-medium mb-1">"About Us" Section</label>
               <textarea value={localAbout} onChange={(e) => setLocalAbout(e.target.value)} rows={4} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
               <button onClick={() => props.onAboutContentChange(localAbout)} className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Save About</button>
           </div>
           <div>
               <label className="block text-sm font-medium mb-1">"Our History" Section</label>
               <textarea value={localHistory} onChange={(e) => setLocalHistory(e.target.value)} rows={4} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
               <button onClick={() => props.onHistoryContentChange(localHistory)} className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Save History</button>
           </div>
           <div>
               <label className="block text-sm font-medium mb-2">FAQs</label>
               <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2 dark:border-gray-600">
                   {props.faqs.length > 0 ? props.faqs.map(faq => (
                       <div key={faq.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                           <p className="truncate font-semibold">{faq.question}</p>
                           <div className="flex space-x-2">
                               <button onClick={() => { setEditingFaq(faq); setIsFaqModalOpen(true); }} className="p-1 text-gray-500 hover:text-blue-500" aria-label={`Edit FAQ: ${faq.question}`}><EditIcon className="w-5 h-5"/></button>
                               <button onClick={() => handleDeleteFaq(faq.id)} className="p-1 text-gray-500 hover:text-red-500" aria-label={`Delete FAQ: ${faq.question}`}><TrashIcon className="w-5 h-5"/></button>
                           </div>
                       </div>
                   )) : (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                            <QuestionMarkCircleIcon className="w-8 h-8 mx-auto mb-2 text-gray-400"/>
                            <p>No FAQs have been added yet.</p>
                            <p>Click "Add FAQ" to get started.</p>
                        </div>
                   )}
               </div>
               <button onClick={() => { setEditingFaq(null); setIsFaqModalOpen(true); }} className="mt-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"><PlusIcon className="w-4 h-4 inline mr-1"/>Add FAQ</button>
           </div>
        </div>
        <div className="border-t dark:border-gray-700 pt-4 mt-4">
            <h4 className="text-md font-semibold mb-2">Contact Information</h4>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium mb-1">Phone Number</label>
                       <input type="text" value={localPhone} onChange={(e) => setLocalPhone(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1">Email Address</label>
                       <input type="email" value={localEmail} onChange={(e) => setLocalEmail(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">WhatsApp Welcome Message</label>
                    <textarea value={localWhatsappMessage} onChange={(e) => setLocalWhatsappMessage(e.target.value)} rows={2} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="The default message when a user starts a chat via QR code or link."/>
                 </div>
            </div>
            <button onClick={handleSaveContactInfo} className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"><SaveIcon className="w-5 h-5"/>Save Contact Info</button>
        </div>
      </div>
      {isFaqModalOpen && <FaqModal faq={editingFaq} onClose={() => setIsFaqModalOpen(false)} onSave={handleSaveFaq} />}

       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Home Page Background</h3>
        <div className="flex items-center gap-4">
          <div className="w-48 h-28 rounded-md bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
            {props.homeBackground ? (
              <img src={props.homeBackground} alt="Home page background preview" className="w-full h-full object-cover"/>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No Image</div>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="bg-upload" className="cursor-pointer px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
              Upload Background
            </label>
            <input id="bg-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden"/>
            {props.homeBackground && (
              <button onClick={() => props.onSetHomeBackground(null)} className="text-sm text-red-500 hover:underline">
                Remove Image
              </button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">Recommended size: 1920x1080px</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const DashboardHeader: React.FC = () => {
    const [stats, setStats] = useState({
        todaySales: 0,
        pendingOrders: 0,
        availableAgents: 0,
    });

    useEffect(() => {
        const calculateStats = () => {
            const orders: DeliveryOrder[] = JSON.parse(localStorage.getItem('geminiDeliveryOrders') || '[]');
            const agents: DeliveryAgent[] = JSON.parse(localStorage.getItem('geminiDeliveryAgents') || '[]');
            
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const todaySales = orders
                .filter(o => (o.status === 'delivered' || o.status === 'out-for-delivery' || o.status === 'approved') && new Date(o.timestamp) >= todayStart)
                .reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);

            const pendingOrders = orders.filter(o => o.status === 'pending').length;
            const availableAgents = agents.filter(a => a.status === 'available').length;

            setStats({ todaySales, pendingOrders, availableAgents });
        };

        calculateStats();
        // Listen for storage changes to keep stats up-to-date
        window.addEventListener('storage', calculateStats);
        return () => window.removeEventListener('storage', calculateStats);
    }, []);
    
    const StatCard: React.FC<{ icon: React.FC<any>, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${color}`}>
                <Icon className="w-6 h-6 text-white"/>
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard icon={CurrencyDollarIcon} title="Today's Revenue" value={`$${stats.todaySales.toFixed(2)}`} color="bg-green-500"/>
            <StatCard icon={ShoppingCartIcon} title="Pending Orders" value={stats.pendingOrders} color="bg-yellow-500"/>
            <StatCard icon={UsersIcon} title="Available Agents" value={stats.availableAgents} color="bg-blue-500"/>
        </div>
    );
};

const DashboardView: React.FC = () => {
    const [chartData, setChartData] = useState<number[]>([]);
    const [recentOrders, setRecentOrders] = useState<DeliveryOrder[]>([]);

    useEffect(() => {
        const orders: DeliveryOrder[] = JSON.parse(localStorage.getItem('geminiDeliveryOrders') || '[]');
        
        // Sales chart data for the last 7 days
        const salesByDay: number[] = Array(7).fill(0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        orders.forEach(order => {
            if(order.status === 'delivered') {
                const orderDate = new Date(order.timestamp);
                const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                    const dayIndex = 6 - diffDays;
                    salesByDay[dayIndex] += order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                }
            }
        });
        setChartData(salesByDay);

        // Recent 5 orders
        const sortedOrders = orders.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentOrders(sortedOrders.slice(0, 5));

    }, []);

    const maxSale = Math.max(...chartData, 1); // Avoid division by zero
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayDayIndex = new Date().getDay();
    const chartLabels = Array.from({length: 7}, (_, i) => daysOfWeek[(todayDayIndex - 6 + i + 7) % 7]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Last 7 Days Sales</h3>
                <div className="flex justify-between items-end h-64 border-b-2 border-l-2 border-gray-200 dark:border-gray-700 pb-2 pl-2">
                    {chartData.map((sale, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end h-full px-2">
                            <div 
                                className="w-full bg-green-500 hover:bg-green-600 rounded-t-md transition-all"
                                style={{ height: `${(sale / maxSale) * 100}%` }}
                                title={`$${sale.toFixed(2)}`}
                            ></div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{chartLabels[index]}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                <div className="space-y-3">
                    {recentOrders.length > 0 ? recentOrders.map(order => (
                        <div key={order.id} className="text-sm">
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{order.customerName}</span>
                                <span className="font-mono text-gray-700 dark:text-gray-300">${order.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.timestamp).toLocaleTimeString()}</p>
                        </div>
                    )) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No recent orders.</p>}
                </div>
            </div>
        </div>
    );
};

const SubmissionsView: React.FC = () => {
    const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);

    useEffect(() => {
        const storedSubmissions = JSON.parse(localStorage.getItem('geminiContactSubmissions') || '[]').sort((a: ContactSubmission, b: ContactSubmission) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setSubmissions(storedSubmissions);
    }, []);

    const handleDelete = (submissionId: string) => {
        if (window.confirm("Are you sure you want to delete this submission?")) {
            const updatedSubmissions = submissions.filter(s => s.id !== submissionId);
            setSubmissions(updatedSubmissions);
            localStorage.setItem('geminiContactSubmissions', JSON.stringify(updatedSubmissions));
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><MailIcon className="w-6 h-6"/>Contact Form Submissions</h3>
            <div className="space-y-4">
                {submissions.length > 0 ? submissions.map(sub => (
                    <div key={sub.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{sub.name} <span className="font-normal text-gray-500 dark:text-gray-400">&lt;{sub.email}&gt;</span></p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(sub.timestamp).toLocaleString()}</p>
                            </div>
                            <button onClick={() => handleDelete(sub.id)} className="p-1 text-gray-500 hover:text-red-500" title="Delete Submission" aria-label={`Delete submission from ${sub.name}`}>
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        <p className="mt-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{sub.message}</p>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No contact submissions yet.</p>
                )}
            </div>
        </div>
    );
};


const AssignAgentModal: React.FC<{
    onClose: () => void;
    onAssign: (agentId: string) => void;
    agents: DeliveryAgent[];
}> = ({ onClose, onAssign, agents }) => {
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
    const [lastAssignedAgentId, setLastAssignedAgentId] = useState<string | null>(null);

    useEffect(() => {
        const lastId = localStorage.getItem('geminiLastAssignedAgentId');
        setLastAssignedAgentId(lastId);
    }, []);

    const handleAssignClick = (agent: DeliveryAgent) => {
        if (window.confirm(`Are you sure you want to assign this order to ${agent.name}?`)) {
            onAssign(agent.id);
        }
    };

    const filteredAgents = showOnlyAvailable ? agents.filter(a => a.status === 'available') : agents;

    const sortedAgents = [...filteredAgents].sort((a, b) => {
        if (a.id === lastAssignedAgentId) return -1;
        if (b.id === lastAssignedAgentId) return 1;
        // Optional: sort by name as a secondary criterion
        return a.name.localeCompare(b.name);
    });

    const getStatusClasses = (status: DeliveryAgent['status']) => {
        const base = 'px-2 py-0.5 text-xs font-medium rounded-full capitalize';
        switch (status) {
            case 'available': return `${base} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
            case 'on-delivery': return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
            default: return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Assign Delivery Agent</h3>
                    <button type="button" onClick={onClose} aria-label="Close assign agent modal"><CloseIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="mb-4 border-b dark:border-gray-700 pb-4">
                    <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showOnlyAvailable}
                            onChange={() => setShowOnlyAvailable(!showOnlyAvailable)}
                            className="form-checkbox h-5 w-5 rounded text-green-600 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-offset-gray-800"
                        />
                        <span className="ml-2">Show only available agents</span>
                    </label>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {sortedAgents.length > 0 ? sortedAgents.map(agent => {
                        const isSuggested = agent.id === lastAssignedAgentId;
                        return (
                            <div key={agent.id} className={`flex justify-between items-center p-2 rounded-md transition-colors ${isSuggested ? 'bg-green-50 dark:bg-green-900/40 border-l-4 border-green-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <div>
                                    <p className="font-semibold">{agent.name}</p>
                                    <p className="text-sm text-gray-500">{agent.phone}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isSuggested && <span className="text-xs font-semibold text-green-700 dark:text-green-300">Suggested</span>}
                                    <span className={getStatusClasses(agent.status)}>{agent.status}</span>
                                    <button
                                        onClick={() => handleAssignClick(agent)}
                                        disabled={agent.status !== 'available'}
                                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        Assign
                                    </button>
                                </div>
                            </div>
                        )
                    }) : (
                        <p className="text-center text-gray-500 py-4">No agents match the filter.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const ApprovalModal: React.FC<{
    order: DeliveryOrder;
    onClose: () => void;
    onApprove: (deliveryTime: number) => void;
}> = ({ order, onClose, onApprove }) => {
    const [deliveryTime, setDeliveryTime] = useState('30');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onApprove(parseInt(deliveryTime, 10));
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
              <form onSubmit={handleSubmit}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2"><CheckCircleIcon className="w-6 h-6 text-green-500"/>Approve Order</h3>
                  <button type="button" onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500 hover:text-gray-800"/></button>
                </div>
                <div className="text-sm mb-4">
                    <p>You are approving order <span className="font-bold">#{order.id.slice(-6)}</span> for <span className="font-bold">{order.customerName}</span>.</p>
                </div>
                <div>
                  <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Delivery Time (minutes)</label>
                  <input 
                    type="number" 
                    id="deliveryTime"
                    value={deliveryTime} 
                    onChange={e => setDeliveryTime(e.target.value)} 
                    required 
                    min="5"
                    step="5"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Approve Order</button>
                </div>
              </form>
            </div>
        </div>
    );
};


const OrdersView: React.FC<{ initialAction: InitialAction }> = ({ initialAction }) => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const loadData = useCallback(() => {
    const storedOrders = JSON.parse(localStorage.getItem('geminiDeliveryOrders') || '[]');
    setOrders(storedOrders.sort((a: DeliveryOrder, b: DeliveryOrder) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    const storedAgents = JSON.parse(localStorage.getItem('geminiDeliveryAgents') || '[]');
    setAgents(storedAgents);
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [loadData]);

  useEffect(() => {
    if (initialAction?.type === 'approve' && orders.length > 0) {
      const orderToApprove = orders.find(o => o.id === initialAction.orderId && o.status === 'pending');
      if (orderToApprove) {
        setSelectedOrder(orderToApprove);
        setIsApprovalModalOpen(true);
      }
    }
  }, [initialAction, orders]);

  const updateLocalStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', { key }));
  };
  
  const handleUpdateStatus = (orderId: string, status: DeliveryOrder['status'], deliveryTime?: number) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;
    
    if (status === 'delivered') {
        const currentProducts: Product[] = JSON.parse(localStorage.getItem('geminiProducts') || '[]');
        const currentStockRecords: StockRecord[] = JSON.parse(localStorage.getItem('geminiStockRecords') || '[]');
        const newStockRecords: StockRecord[] = [];

        let productsAfterSale = [...currentProducts];

        orderToUpdate.items.forEach(item => {
            const productIndex = productsAfterSale.findIndex(p => p.name.toLowerCase() === item.name.toLowerCase());
            if (productIndex !== -1) {
                const product = productsAfterSale[productIndex];
                const newStockLevel = product.stock - item.quantity;
                productsAfterSale[productIndex] = { ...product, stock: newStockLevel >= 0 ? newStockLevel : 0 }; // Prevent negative stock

                newStockRecords.push({
                    id: `stock-${Date.now()}-${item.name}`,
                    productId: product.id,
                    productName: product.name,
                    type: 'sale',
                    quantityChange: -item.quantity,
                    newStockLevel: newStockLevel >= 0 ? newStockLevel : 0,
                    timestamp: new Date().toISOString(),
                    orderId: orderToUpdate.id,
                });
            }
        });
        
        const updatedRecords = [...newStockRecords, ...currentStockRecords];

        updateLocalStorage('geminiProducts', productsAfterSale);
        updateLocalStorage('geminiStockRecords', updatedRecords);
    }


    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const updatedOrder: DeliveryOrder = { ...o, status };
        if (status === 'approved' && deliveryTime) {
          updatedOrder.estimatedDeliveryTime = `${deliveryTime} minutes`;
        }
        if (status === 'delivered') {
            updatedOrder.actualDeliveryTime = new Date().toISOString();
        }
        return updatedOrder;
      }
      return o;
    });
    let updatedAgents = [...agents];

    if ((status === 'delivered' || status === 'cancelled') && orderToUpdate.agentId) {
         updatedAgents = agents.map(a => a.id === orderToUpdate.agentId ? {...a, status: 'available' as 'available'} : a);
    }
    
    updateLocalStorage('geminiDeliveryOrders', updatedOrders);
    if(JSON.stringify(updatedAgents) !== JSON.stringify(agents)) {
        updateLocalStorage('geminiDeliveryAgents', updatedAgents);
    }
  };

  const handleRejectOrder = (orderId: string) => {
    if (window.confirm("Are you sure you want to reject this order? This will cancel the order for the customer.")) {
      handleUpdateStatus(orderId, 'cancelled');
    }
  };

  const handleAssignAgent = (orderId: string, agentId: string) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, agentId, status: 'out-for-delivery' as 'out-for-delivery' } : o);
    const updatedAgents = agents.map(a => a.id === agentId ? { ...a, status: 'on-delivery' as 'on-delivery' } : a);
    
    updateLocalStorage('geminiDeliveryOrders', updatedOrders);
    updateLocalStorage('geminiDeliveryAgents', updatedAgents);
    localStorage.setItem('geminiLastAssignedAgentId', agentId);
    setIsAssignModalOpen(false);
    setSelectedOrder(null);
  };
  
  const handleContactCustomer = (order: DeliveryOrder) => {
    const message = encodeURIComponent(`Hello ${order.customerName}, I'm contacting you from STANLEY'S CAFETERIA regarding your order #${order.id.slice(-6)}.`);
    const whatsappUrl = `https://wa.me/${order.phoneNumber.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const getAgentName = (agentId?: string) => {
      if (!agentId) return 'N/A';
      return agents.find(a => a.id === agentId)?.name || 'Unknown';
  };

  const getStatusClasses = (status: DeliveryOrder['status']) => {
    const base = 'px-2 py-1 text-xs font-semibold rounded-full capitalize';
    switch (status) {
      case 'pending': return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 animate-pulse`;
      case 'approved': return `${base} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
      case 'out-for-delivery': return `${base} bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300`;
      case 'delivered': return `${base} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'cancelled': return `${base} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 opacity-70`;
    }
  };

  return (
    <div>
        {isAssignModalOpen && selectedOrder && <AssignAgentModal onClose={() => {setIsAssignModalOpen(false); setSelectedOrder(null);}} onAssign={(agentId) => handleAssignAgent(selectedOrder.id, agentId)} agents={agents} />}
        {isApprovalModalOpen && selectedOrder && (
          <ApprovalModal
            order={selectedOrder}
            onClose={() => {setIsApprovalModalOpen(false); setSelectedOrder(null);}}
            onApprove={(deliveryTime) => {
              handleUpdateStatus(selectedOrder.id, 'approved', deliveryTime);
              setIsApprovalModalOpen(false);
              setSelectedOrder(null);
            }}
          />
        )}
        {isTrackingModalOpen && selectedOrder && selectedOrder.agentId && agents.find(a => a.id === selectedOrder.agentId) && <TrackAgentModal onClose={() => {setIsTrackingModalOpen(false); setSelectedOrder(null);}} order={selectedOrder} agent={agents.find(a => a.id === selectedOrder.agentId)!} />}
        <h3 className="text-xl font-semibold mb-4">Delivery Order History</h3>
        <div className="space-y-4">
        {orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{order.customerName}</p>
                    <p className="text-gray-500 dark:text-gray-400">{order.phoneNumber}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(order.timestamp).toLocaleString()}</p>
                </div>
                <div>
                    <p className="font-semibold">Items:</p>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                    {order.items.map((item, i) => <li key={i}>{item.quantity}x {item.name}</li>)}
                    </ul>
                </div>
                 <div className="grid grid-cols-2 gap-x-2">
                    <div>
                        <p className="font-semibold">Address:</p>
                        <p className="text-gray-600 dark:text-gray-300">{order.deliveryAddress}</p>
                    </div>
                     <div>
                        <p className="font-semibold">Delivery Info:</p>
                        <p className="text-gray-600 dark:text-gray-300">
                            Agent: {' '}
                            {order.agentId && agents.find(a => a.id === order.agentId) && order.status === 'out-for-delivery' ? (
                                <button
                                    onClick={() => { setSelectedOrder(order); setIsTrackingModalOpen(true); }}
                                    className="text-blue-500 hover:underline focus:outline-none font-semibold"
                                    title="Track this agent's live location"
                                >
                                    {getAgentName(order.agentId)}
                                </button>
                            ) : (
                                <span>{getAgentName(order.agentId)}</span>
                            )}
                        </p>
                        {order.estimatedDeliveryTime && <p className="text-gray-600 dark:text-gray-300">ETA: {order.estimatedDeliveryTime}</p>}
                        {order.actualDeliveryTime && <p className="text-gray-600 dark:text-gray-300">Delivered: {new Date(order.actualDeliveryTime).toLocaleTimeString()}</p>}
                    </div>
                </div>
                <div className="flex flex-col items-start md:items-end justify-between">
                    <span className={getStatusClasses(order.status)}>{order.status.replace('-', ' ')}</span>
                </div>
            </div>
            <div className="border-t dark:border-gray-700 mt-3 pt-3 flex flex-wrap gap-2 justify-end">
                {order.phoneNumber && (
                  <button onClick={() => handleContactCustomer(order)} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1.5" title="Contact customer on WhatsApp">
                      <WhatsAppIcon className="w-4 h-4" />
                      Contact Customer
                  </button>
                )}
                {order.status === 'pending' && (
                    <>
                    <button onClick={() => { setSelectedOrder(order); setIsApprovalModalOpen(true); }} className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Approve</button>
                    <button onClick={() => handleRejectOrder(order.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">Reject</button>
                    </>
                )}
                 {order.status === 'approved' && (
                    <button onClick={() => { setSelectedOrder(order); setIsAssignModalOpen(true); }} className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Assign Agent</button>
                 )}
                 {order.status === 'out-for-delivery' && (
                    <button onClick={() => handleUpdateStatus(order.id, 'delivered')} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">Mark as Delivered</button>
                 )}
            </div>
            </div>
        ))}
        </div>
    </div>
  );
};

interface ProductModalProps {
    product: Partial<Product> | null;
    onClose: () => void;
    onSave: (product: Partial<Product>) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onSave }) => {
    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product?.price?.toString() || '');
    const [description, setDescription] = useState(product?.description || '');
    const [image, setImage] = useState(product?.image || '');
    const [stock, setStock] = useState(product?.stock?.toString() || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ 
            ...product, 
            name, 
            price: parseFloat(price) || 0, 
            description, 
            image, 
            stock: parseInt(stock, 10) || 0 
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">{product?.id ? 'Edit Product' : 'Add New Product'}</h3>
                        <button type="button" onClick={onClose} aria-label="Close modal"><CloseIcon className="w-6 h-6"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Product Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Price ($)</label>
                                <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                                <input type="number" step="1" value={stock} onChange={e => setStock(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 resize-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Image URL</label>
                            <input type="text" value={image} onChange={e => setImage(e.target.value)} placeholder="https://placehold.co/..." className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"><SaveIcon className="w-5 h-5 inline mr-2"/>Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProductsView: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

    const loadProducts = useCallback(() => {
        const storedProducts = JSON.parse(localStorage.getItem('geminiProducts') || '[]');
        setProducts(storedProducts);
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const handleSave = (productData: Partial<Product>) => {
        let updatedProducts: Product[];
        if (productData.id) { // Editing
            updatedProducts = products.map(p => p.id === productData.id ? { ...p, ...productData } as Product : p);
        } else { // Adding
            const newProduct: Product = {
                id: `prod-${Date.now()}`,
                name: productData.name || 'New Product',
                price: productData.price || 0,
                description: productData.description || '',
                image: productData.image || '',
                stock: productData.stock || 0,
            };
            updatedProducts = [...products, newProduct];
        }
        localStorage.setItem('geminiProducts', JSON.stringify(updatedProducts));
        setProducts(updatedProducts);
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleDelete = (productId: string) => {
        if (window.confirm("Are you sure you want to delete this product? This will remove it from the menu permanently.")) {
            const updatedProducts = products.filter(p => p.id !== productId);
            localStorage.setItem('geminiProducts', JSON.stringify(updatedProducts));
            setProducts(updatedProducts);
        }
    };

    return (
        <div>
            {isModalOpen && <ProductModal product={editingProduct} onClose={() => { setIsModalOpen(false); setEditingProduct(null); }} onSave={handleSave} />}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2"><TagIcon className="w-6 h-6"/>Product Management</h3>
                <button onClick={() => { setEditingProduct({}); setIsModalOpen(true); }} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Add Product
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Product Name</th>
                                <th scope="col" className="px-6 py-3">Price</th>
                                <th scope="col" className="px-6 py-3">Stock</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <img src={product.image || 'https://placehold.co/40x40/cccccc/FFFFFF?text=?'} alt={product.name} className="w-10 h-10 rounded-md object-cover"/>
                                            <div>
                                                {product.name}
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{product.description}</p>
                                            </div>
                                        </div>
                                    </th>
                                    <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4">{product.stock}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-3">Edit</button>
                                        <button onClick={() => handleDelete(product.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {products.length === 0 && <p className="text-center p-4">No products found. Click 'Add Product' to start.</p>}
                </div>
            </div>
        </div>
    );
};

const MenuView: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const storedProducts = JSON.parse(localStorage.getItem('geminiProducts') || '[]');
        setProducts(storedProducts);
    }, []);

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><BookOpenIcon className="w-6 h-6"/>Menu Preview</h3>
            <Menu products={products} />
        </div>
    );
};

const SalesView: React.FC = () => {
  const [salesData, setSalesData] = useState({ today: 0, month: 0, year: 0, recent: [] as DeliveryOrder[] });

  useEffect(() => {
    const orders: DeliveryOrder[] = JSON.parse(localStorage.getItem('geminiDeliveryOrders') || '[]');
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const todaySales = deliveredOrders
      .filter(o => new Date(o.timestamp) >= todayStart)
      .reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);
      
    const monthSales = deliveredOrders
      .filter(o => new Date(o.timestamp) >= monthStart)
      .reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);
      
    const yearSales = deliveredOrders
      .filter(o => new Date(o.timestamp) >= yearStart)
      .reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);

    const recent = deliveredOrders.slice(0, 5);
    
    setSalesData({ today: todaySales, month: monthSales, year: yearSales, recent });
  }, []);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><ChartBarIcon className="w-6 h-6"/>Sales Dashboard</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales (Today)</p>
            <p className="text-2xl font-bold">${salesData.today.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales (Month)</p>
            <p className="text-2xl font-bold">${salesData.month.toFixed(2)}</p>
        </div>
         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales (Year)</p>
            <p className="text-2xl font-bold">${salesData.year.toFixed(2)}</p>
        </div>
      </div>
       <h4 className="text-lg font-semibold mb-2">Recent Transactions</h4>
       <div className="space-y-2">
           {salesData.recent.map(order => (
               <div key={order.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-sm">
                   <div className="flex justify-between">
                       <div>
                            <p className="font-semibold">{order.customerName}</p>
                            <p className="text-xs text-gray-500">{new Date(order.timestamp).toLocaleString()}</p>
                       </div>
                       <p className="font-bold text-green-600">+${order.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}</p>
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
};

const AgentsView: React.FC = () => {
    const [agents, setAgents] = useState<DeliveryAgent[]>([]);
    const [orders, setOrders] = useState<DeliveryOrder[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Partial<DeliveryAgent> | null>(null);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [trackedData, setTrackedData] = useState<{agent: DeliveryAgent, order: DeliveryOrder} | null>(null);

    const loadData = useCallback(() => {
        const storedAgents = JSON.parse(localStorage.getItem('geminiDeliveryAgents') || '[]');
        setAgents(storedAgents);
        const storedOrders = JSON.parse(localStorage.getItem('geminiDeliveryOrders') || '[]');
        setOrders(storedOrders);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = (agentData: Partial<DeliveryAgent>) => {
        let updatedAgents: DeliveryAgent[];
        if (agentData.id) { // Editing existing agent
            updatedAgents = agents.map(a => a.id === agentData.id ? { ...a, ...agentData } as DeliveryAgent : a);
        } else { // Adding new agent
            const newAgent: DeliveryAgent = {
                id: `agent-${Date.now()}`,
                name: agentData.name || 'New Agent',
                phone: agentData.phone || '',
                status: 'available',
                attendanceStatus: 'clocked-out',
                hourlyRate: agentData.hourlyRate || 0,
                ...agentData
            };
            updatedAgents = [...agents, newAgent];
        }
        localStorage.setItem('geminiDeliveryAgents', JSON.stringify(updatedAgents));
        setAgents(updatedAgents);
        setIsModalOpen(false);
        setEditingAgent(null);
    };

    const handleDelete = (agentId: string) => {
        if (window.confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
            const updatedAgents = agents.filter(a => a.id !== agentId);
            localStorage.setItem('geminiDeliveryAgents', JSON.stringify(updatedAgents));
            setAgents(updatedAgents);
        }
    };

    const handleTrackAgent = (agent: DeliveryAgent) => {
        const order = orders.find(o => o.agentId === agent.id && o.status === 'out-for-delivery');
        if (order) {
            setTrackedData({ agent, order });
            setIsTrackingModalOpen(true);
        }
    };

    const AgentModal: React.FC<{ agent: Partial<DeliveryAgent> | null; onClose: () => void; onSave: (agent: Partial<DeliveryAgent>) => void; }> = ({ agent, onClose, onSave }) => {
        const [name, setName] = useState(agent?.name || '');
        const [phone, setPhone] = useState(agent?.phone || '');
        const [hourlyRate, setHourlyRate] = useState(agent?.hourlyRate?.toString() || '');

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave({ ...agent, name, phone, hourlyRate: parseFloat(hourlyRate) || 0 });
        };

        return (
            <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">{agent?.id ? 'Edit Agent' : 'Add New Agent'}</h3>
                             <button type="button" onClick={onClose} aria-label="Close modal"><CloseIcon className="w-6 h-6"/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Hourly Rate ($)</label>
                                <input type="number" step="0.01" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save Agent</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div>
            {isModalOpen && <AgentModal agent={editingAgent} onClose={() => { setIsModalOpen(false); setEditingAgent(null); }} onSave={handleSave} />}
            {isTrackingModalOpen && trackedData && <TrackAgentModal onClose={() => setIsTrackingModalOpen(false)} agent={trackedData.agent} order={trackedData.order} />}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2"><UsersIcon className="w-6 h-6"/>Delivery Agent Management</h3>
                <button onClick={() => { setEditingAgent({}); setIsModalOpen(true); }} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Add Agent
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="space-y-2">
                    {agents.map(agent => {
                        const activeOrder = orders.find(o => o.agentId === agent.id && o.status === 'out-for-delivery');
                        return (
                        <div key={agent.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b dark:border-gray-700 last:border-b-0">
                            <div>
                                <p className="font-bold">{agent.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{agent.phone}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Rate: ${agent.hourlyRate.toFixed(2)}/hr</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0 self-end md:self-center">
                                <button
                                    onClick={() => handleTrackAgent(agent)}
                                    disabled={!activeOrder}
                                    className="p-2 text-gray-500 hover:text-indigo-500 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
                                    title={activeOrder ? "Track Agent" : "Agent not on an active delivery"}
                                >
                                    <MapPinIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => { setEditingAgent(agent); setIsModalOpen(true); }} className="p-2 text-gray-500 hover:text-blue-500" title="Edit Agent"><EditIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDelete(agent.id)} className="p-2 text-gray-500 hover:text-red-500" title="Delete Agent"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    )})}
                     {agents.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-4">No agents have been added yet.</p>}
                </div>
            </div>
        </div>
    );
};

const PerformanceView: React.FC = () => {
  const [performance, setPerformance] = useState<{[key: string]: number}>({});
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);

  useEffect(() => {
    const orders: DeliveryOrder[] = JSON.parse(localStorage.getItem('geminiDeliveryOrders') || '[]');
    const storedAgents: DeliveryAgent[] = JSON.parse(localStorage.getItem('geminiDeliveryAgents') || '[]');
    setAgents(storedAgents);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dailyPerformance = orders
      .filter(o => o.status === 'delivered' && new Date(o.timestamp) >= todayStart && o.agentId)
      .reduce((acc, order) => {
        acc[order.agentId!] = (acc[order.agentId!] || 0) + 1;
        return acc;
      }, {} as {[key: string]: number});
    
    setPerformance(dailyPerformance);
  }, []);

  const getAgentName = (agentId: string) => agents.find(a => a.id === agentId)?.name || 'Unknown Agent';

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><TrendingUpIcon className="w-6 h-6"/>Agent Performance (Today)</h3>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          {agents.length > 0 ? (
            <ul className="space-y-3">
              {agents.map(agent => (
                <li key={agent.id} className="flex justify-between items-center">
                    <span className="font-semibold">{agent.name}</span>
                    <span className="font-bold text-lg">{performance[agent.id] || 0} deliveries</span>
                </li>
              ))}
            </ul>
          ) : <p>No agents found.</p>}
      </div>
    </div>
  );
};

const TasksView: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');

    useEffect(() => {
        const storedTasks = JSON.parse(localStorage.getItem('geminiTasks') || '[]');
        setTasks(storedTasks.sort((a: Task, b: Task) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, []);

    const saveTasks = (updatedTasks: Task[]) => {
        localStorage.setItem('geminiTasks', JSON.stringify(updatedTasks));
        setTasks(updatedTasks.sort((a: Task, b: Task) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: newTaskTitle,
            description: newTaskDescription,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        saveTasks([...tasks, newTask]);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setIsModalOpen(false);
    };

    const handleToggleStatus = (taskId: string) => {
        const updatedTasks = tasks.map(task =>
            task.id === taskId
                ? { ...task, status: (task.status === 'pending' ? 'completed' : 'pending') as Task['status'] }
                : task
        );
        saveTasks(updatedTasks);
    };

    const handleDeleteTask = (taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            const updatedTasks = tasks.filter(task => task.id !== taskId);
            saveTasks(updatedTasks);
        }
    };
    
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    return (
        <div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                        <form onSubmit={handleAddTask}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Add New Task</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Close new task modal"><CloseIcon className="w-6 h-6"/></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input 
                                        type="text" 
                                        value={newTaskTitle} 
                                        onChange={e => setNewTaskTitle(e.target.value)} 
                                        required 
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea 
                                        value={newTaskDescription} 
                                        onChange={e => setNewTaskDescription(e.target.value)} 
                                        rows={4} 
                                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 resize-none"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                                    <SaveIcon className="w-5 h-5"/>Save Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2"><ClipboardListIcon className="w-6 h-6"/>Task Management</h3>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/>Add New Task
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-lg font-semibold mb-3 border-b pb-2 dark:border-gray-700">Pending ({pendingTasks.length})</h4>
                    <div className="space-y-4">
                        {pendingTasks.length > 0 ? pendingTasks.map(task => (
                            <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-start gap-4">
                                <input 
                                  type="checkbox"
                                  checked={false}
                                  onChange={() => handleToggleStatus(task.id)}
                                  className="form-checkbox h-5 w-5 rounded text-green-600 focus:ring-green-500 mt-1 cursor-pointer dark:bg-gray-900 dark:border-gray-600 flex-shrink-0"
                                  aria-label={`Mark task as complete: ${task.title}`}
                                />
                                <div className="flex-grow">
                                    <h5 className="font-bold">{task.title}</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 my-1 whitespace-pre-wrap">{task.description}</p>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">Created: {new Date(task.createdAt).toLocaleDateString()}</div>
                                </div>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0" aria-label={`Delete task: ${task.title}`}><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        )) : <p className="text-center text-gray-500 py-4">No pending tasks.</p>}
                    </div>
                </div>
                <div>
                    <h4 className="text-lg font-semibold mb-3 border-b pb-2 dark:border-gray-700">Completed ({completedTasks.length})</h4>
                    <div className="space-y-4">
                        {completedTasks.length > 0 ? completedTasks.map(task => (
                             <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow opacity-70 flex items-start gap-4">
                                 <input 
                                    type="checkbox"
                                    checked={true}
                                    onChange={() => handleToggleStatus(task.id)}
                                    className="form-checkbox h-5 w-5 rounded text-green-600 focus:ring-green-500 mt-1 cursor-pointer dark:bg-gray-900 dark:border-gray-600 flex-shrink-0"
                                    aria-label={`Mark task as pending: ${task.title}`}
                                />
                                <div className="flex-grow">
                                    <h5 className="font-bold line-through">{task.title}</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 my-1 whitespace-pre-wrap line-through">{task.description}</p>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">Created: {new Date(task.createdAt).toLocaleDateString()}</div>
                                </div>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0" aria-label={`Delete task: ${task.title}`}><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        )) : <p className="text-center text-gray-500 py-4">No completed tasks.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AttendanceCameraModal: React.FC<{
    agent: DeliveryAgent;
    onClose: () => void;
    onCapture: (imageDataUrl: string) => void;
}> = ({ agent, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let activeStream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    activeStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    setStream(activeStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = activeStream;
                    }
                } else {
                    setError("Your browser does not support camera access.");
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access camera. Please check permissions.");
            }
        };

        startCamera();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                onCapture(imageDataUrl);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Photo Verification for {agent.name}</h3>
                    <button type="button" onClick={onClose} aria-label="Close camera modal"><CloseIcon className="w-6 h-6"/></button>
                </div>
                {error ? (
                    <div className="text-red-500 text-center p-4">{error}</div>
                ) : (
                    <div className="relative">
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-md bg-gray-900"></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                )}
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={handleCapture} 
                        disabled={!stream}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400"
                    >
                        Capture &amp; {agent.attendanceStatus === 'clocked-out' ? 'Clock In' : 'Clock Out'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AttendanceView: React.FC = () => {
    const [agents, setAgents] = useState<DeliveryAgent[]>([]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [monthlySummary, setMonthlySummary] = useState<Array<{ agentId: string; agentName: string; totalHours: number }>>([]);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [agentForPhoto, setAgentForPhoto] = useState<DeliveryAgent | null>(null);

    const loadData = useCallback(() => {
        const storedAgents = JSON.parse(localStorage.getItem('geminiDeliveryAgents') || '[]');
        const storedRecords = JSON.parse(localStorage.getItem('geminiAttendanceRecords') || '[]')
            .sort((a: AttendanceRecord, b: AttendanceRecord) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime());
        setAgents(storedAgents);
        setRecords(storedRecords);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const calculateSummary = () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            const summaryData: Record<string, number> = {};
            agents.forEach(agent => {
                summaryData[agent.id] = 0;
            });

            records
                .filter(rec => new Date(rec.clockInTime) >= startOfMonth && rec.clockOutTime)
                .forEach(rec => {
                    const start = new Date(rec.clockInTime);
                    const end = new Date(rec.clockOutTime!);
                    const durationHours = (end.getTime() - start.getTime()) / 3600000;
                    if (summaryData[rec.agentId] !== undefined) {
                        summaryData[rec.agentId] += durationHours;
                    }
                });

            const summaryArray = agents.map(agent => ({
                agentId: agent.id,
                agentName: agent.name,
                totalHours: summaryData[agent.id] || 0,
            })).sort((a, b) => b.totalHours - a.totalHours);

            setMonthlySummary(summaryArray);
        };

        if (agents.length > 0) {
            calculateSummary();
        }
    }, [agents, records]);

    const saveData = (key: string, data: any) => {
        localStorage.setItem(key, JSON.stringify(data));
        loadData(); // Re-load data to ensure UI is in sync
    };

    const handlePhotoCapture = (imageDataUrl: string) => {
        if (!agentForPhoto) return;

        if (agentForPhoto.attendanceStatus === 'clocked-out') {
            // Clocking In
            const newRecord: AttendanceRecord = {
                id: `att-${Date.now()}`,
                agentId: agentForPhoto.id,
                agentName: agentForPhoto.name,
                clockInTime: new Date().toISOString(),
                clockOutTime: null,
                status: 'clocked-in',
                clockInPhoto: imageDataUrl,
            };
            const updatedRecords = [newRecord, ...records];
            const updatedAgents = agents.map(a => a.id === agentForPhoto.id ? { ...a, attendanceStatus: 'clocked-in' as 'clocked-in' } : a);
            saveData('geminiAttendanceRecords', updatedRecords);
            saveData('geminiDeliveryAgents', updatedAgents);
        } else {
            // Clocking Out
            const updatedRecords = records.map(r => 
                r.agentId === agentForPhoto.id && r.status === 'clocked-in'
                ? { ...r, status: 'clocked-out' as 'clocked-out', clockOutTime: new Date().toISOString(), clockOutPhoto: imageDataUrl }
                : r
            );
            const updatedAgents = agents.map(a => a.id === agentForPhoto.id ? { ...a, attendanceStatus: 'clocked-out' as 'clocked-out' } : a);
            saveData('geminiAttendanceRecords', updatedRecords);
            saveData('geminiDeliveryAgents', updatedAgents);
        }

        setIsCameraModalOpen(false);
        setAgentForPhoto(null);
    };
    
    const calculateDuration = (startIso: string, endIso: string | null): string => {
        if (!endIso) return 'In Progress';
        const start = new Date(startIso);
        const end = new Date(endIso);
        let diff = end.getTime() - start.getTime();
        if (diff < 0) return 'Invalid';

        const hours = Math.floor(diff / 3600000);
        diff %= 3600000;
        const minutes = Math.floor(diff / 60000);

        return `${hours}h ${minutes}m`;
    };

    return (
        <div>
            {isCameraModalOpen && agentForPhoto && (
                <AttendanceCameraModal 
                    agent={agentForPhoto} 
                    onClose={() => setIsCameraModalOpen(false)}
                    onCapture={handlePhotoCapture}
                />
            )}
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ClockIcon className="w-6 h-6" /> Time & Attendance Management
            </h3>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                <h4 className="text-lg font-semibold mb-3 border-b pb-2 dark:border-gray-700">
                    Current Month Summary ({new Date().toLocaleString('default', { month: 'long' })})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {monthlySummary.length > 0 && monthlySummary.some(s => s.totalHours > 0) ? monthlySummary.map(item => (
                        <div key={item.agentId} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <span className="font-semibold">{item.agentName}</span>
                            <span className="font-mono font-bold">{item.totalHours.toFixed(2)} hours</span>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-4">No attendance data for the current month.</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h4 className="text-lg font-semibold mb-3 border-b pb-2 dark:border-gray-700">Agent Clock-In/Out</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {agents.map(agent => (
                            <div key={agent.id} className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                <div className="flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full ${agent.attendanceStatus === 'clocked-in' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                    <span className="font-semibold">{agent.name}</span>
                                </div>
                                <button onClick={() => { setAgentForPhoto(agent); setIsCameraModalOpen(true); }} className={`px-3 py-1 text-sm text-white rounded hover:opacity-90 ${agent.attendanceStatus === 'clocked-in' ? 'bg-red-500' : 'bg-green-500'}`}>
                                    {agent.attendanceStatus === 'clocked-in' ? 'Clock Out with Photo' : 'Clock In with Photo'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <h4 className="text-lg font-semibold mb-3 border-b pb-2 dark:border-gray-700">Attendance Log</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {records.map(record => (
                            <div key={record.id} className="text-sm p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                <div className="flex justify-between items-center font-semibold">
                                    <p>{record.agentName}</p>
                                    <p>{calculateDuration(record.clockInTime, record.clockOutTime)}</p>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    <div className="flex items-center gap-2">
                                        {record.clockInPhoto && <img src={record.clockInPhoto} alt="Clock in" className="w-8 h-8 rounded-full object-cover"/>}
                                        <span>{new Date(record.clockInTime).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>{record.clockOutTime ? new Date(record.clockOutTime).toLocaleTimeString() : '...'}</span>
                                        {record.clockOutPhoto && <img src={record.clockOutPhoto} alt="Clock out" className="w-8 h-8 rounded-full object-cover"/>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PayrollView: React.FC = () => {
    const [agents, setAgents] = useState<DeliveryAgent[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const loadData = useCallback(() => {
        setAgents(JSON.parse(localStorage.getItem('geminiDeliveryAgents') || '[]'));
        setAttendanceRecords(JSON.parse(localStorage.getItem('geminiAttendanceRecords') || '[]'));
        setPayrollRecords(JSON.parse(localStorage.getItem('geminiPayrollRecords') || '[]').sort((a: PayrollRecord, b: PayrollRecord) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime()));
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleGeneratePayroll = () => {
        if (!startDate || !endDate) {
            alert('Please select a start and end date.');
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        const newPayrollRecords: PayrollRecord[] = [];

        agents.forEach(agent => {
            const agentShifts = attendanceRecords.filter(rec =>
                rec.agentId === agent.id &&
                rec.clockOutTime &&
                new Date(rec.clockInTime) >= start &&
                new Date(rec.clockOutTime) <= end
            );

            if (agentShifts.length > 0) {
                const hoursWorked = agentShifts.reduce((total, shift) => {
                    const shiftStart = new Date(shift.clockInTime);
                    const shiftEnd = new Date(shift.clockOutTime!);
                    const durationMs = shiftEnd.getTime() - shiftStart.getTime();
                    return total + (durationMs / 3600000); // convert ms to hours
                }, 0);

                newPayrollRecords.push({
                    id: `payroll-${agent.id}-${start.getTime()}`,
                    agentId: agent.id,
                    agentName: agent.name,
                    periodStart: start.toISOString(),
                    periodEnd: end.toISOString(),
                    hoursWorked: parseFloat(hoursWorked.toFixed(2)),
                    hourlyRate: agent.hourlyRate,
                    totalPay: parseFloat((hoursWorked * agent.hourlyRate).toFixed(2)),
                    status: 'pending',
                    paidAt: null
                });
            }
        });
        
        const updatedPayroll = [...payrollRecords, ...newPayrollRecords]
          .filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i); // Remove duplicates
          
        localStorage.setItem('geminiPayrollRecords', JSON.stringify(updatedPayroll));
        loadData();
        alert(`${newPayrollRecords.length} payroll records generated.`);
    };

    const handleMarkAsPaid = (recordId: string) => {
        const recordToPay = payrollRecords.find(rec => rec.id === recordId);
        if (!recordToPay) return;

        if (window.confirm(`Mark payroll for ${recordToPay.agentName} (Total: $${recordToPay.totalPay.toFixed(2)}) as paid?`)) {
            const updated = payrollRecords.map(rec => rec.id === recordId ? { ...rec, status: 'paid' as 'paid', paidAt: new Date().toISOString() } : rec);
            localStorage.setItem('geminiPayrollRecords', JSON.stringify(updated));
            loadData();
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><CurrencyDollarIcon className="w-6 h-6"/>Payroll Management</h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                <h4 className="font-semibold mb-2">Generate Payroll for Period</h4>
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="text-sm">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="text-sm">End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <button onClick={handleGeneratePayroll} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Generate</button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h4 className="font-semibold mb-2">Payroll History</h4>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {payrollRecords.map(rec => (
                        <div key={rec.id} className="p-3 rounded-md bg-gray-50 dark:bg-gray-700/50">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                                <div><span className="font-semibold">{rec.agentName}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Period:</span> {new Date(rec.periodStart).toLocaleDateString()} - {new Date(rec.periodEnd).toLocaleDateString()}</div>
                                <div><span className="text-gray-500 dark:text-gray-400">Hours:</span> {rec.hoursWorked}</div>
                                <div className="font-bold text-lg">${rec.totalPay.toFixed(2)}</div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${rec.status === 'paid' ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>{rec.status}</span>
                                    {rec.status === 'pending' && <button onClick={() => handleMarkAsPaid(rec.id)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Pay</button>}
                                    {rec.status === 'paid' && rec.paidAt && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            on {new Date(rec.paidAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ExpensesView: React.FC = () => {
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Partial<ExpenseRecord> | null>(null);

    const loadExpenses = useCallback(() => {
        const stored = JSON.parse(localStorage.getItem('geminiExpenseRecords') || '[]').sort((a: ExpenseRecord, b: ExpenseRecord) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setExpenses(stored);
    }, []);

    useEffect(() => { loadExpenses(); }, [loadExpenses]);

    const handleSave = (expense: Partial<ExpenseRecord>) => {
        let updated: ExpenseRecord[];
        if (expense.id) {
            updated = expenses.map(e => e.id === expense.id ? { ...e, ...expense } as ExpenseRecord : e);
        } else {
            const newExpense: ExpenseRecord = {
                id: `exp-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                category: 'Other',
                description: '',
                amount: 0,
                ...expense
            };
            updated = [newExpense, ...expenses];
        }
        localStorage.setItem('geminiExpenseRecords', JSON.stringify(updated));
        loadExpenses();
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Delete this expense record?")) {
            const updated = expenses.filter(e => e.id !== id);
            localStorage.setItem('geminiExpenseRecords', JSON.stringify(updated));
            loadExpenses();
        }
    };
    
    const ExpenseModal: React.FC<{ expense: Partial<ExpenseRecord> | null; onClose: () => void; onSave: (expense: Partial<ExpenseRecord>) => void; }> = ({ expense, onClose, onSave }) => {
        const [date, setDate] = useState(expense?.date || new Date().toISOString().split('T')[0]);
        const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'Supplies');
        const [description, setDescription] = useState(expense?.description || '');
        const [amount, setAmount] = useState(expense?.amount?.toString() || '');
        
        const categories: ExpenseCategory[] = ['Supplies', 'Rent', 'Utilities', 'Marketing', 'Other'];

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave({ ...expense, date, category, description, amount: parseFloat(amount) });
        };

        return (
            <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                     <h3 className="text-xl font-semibold mb-4">{expense?.id ? 'Edit Expense' : 'Add New Expense'}</h3>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-sm font-medium">Date</label>
                           <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div>
                           <label className="block text-sm font-medium">Category</label>
                           <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                               {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium">Description</label>
                           <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                        <div>
                           <label className="block text-sm font-medium">Amount ($)</label>
                           <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                     </div>
                     <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save Expense</button>
                     </div>
                </form>
            </div>
        );
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div>
            {isModalOpen && <ExpenseModal expense={editingExpense} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2"><CurrencyDollarIcon className="w-6 h-6"/>Expense Tracking</h3>
                <button onClick={() => { setEditingExpense({}); setIsModalOpen(true); }} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Add Expense
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-3 border-b pb-3 dark:border-gray-700">
                    <h4 className="font-semibold">All Expenses</h4>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                        <p className="font-bold text-xl">${totalExpenses.toFixed(2)}</p>
                    </div>
                </div>
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                    {expenses.map(exp => (
                        <div key={exp.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <div>
                                <p className="font-semibold">{exp.description}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(exp.date).toLocaleDateString()} - {exp.category}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="font-mono font-semibold">${exp.amount.toFixed(2)}</p>
                                <button onClick={() => { setEditingExpense(exp); setIsModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-500"><EditIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleDelete(exp.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LOW_STOCK_THRESHOLD = 5;

const StockAdjustmentModal: React.FC<{
    product: Product;
    onClose: () => void;
    onSave: (productId: string, adjustment: number, note: string) => void;
}> = ({ product, onClose, onSave }) => {
    const [adjustment, setAdjustment] = useState('');
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const adjustmentAmount = parseInt(adjustment, 10);
        if (isNaN(adjustmentAmount) || adjustmentAmount === 0) {
            alert('Please enter a valid, non-zero number for the adjustment.');
            return;
        }
        onSave(product.id, adjustmentAmount, note);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Adjust Stock for {product.name}</h3>
                        <button type="button" onClick={onClose} aria-label="Close modal"><CloseIcon className="w-6 h-6"/></button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Current stock: <span className="font-bold">{product.stock}</span></p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="adjustment" className="block text-sm font-medium mb-1">Adjustment Quantity</label>
                            <input
                                id="adjustment"
                                type="number"
                                value={adjustment}
                                onChange={e => setAdjustment(e.target.value)}
                                required
                                placeholder="e.g., 50 for stock-in, -10 for stock-out"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            />
                            <p className="text-xs text-gray-500 mt-1">Use a positive number to add stock (stock-in) and a negative number to remove stock (e.g., for spoilage).</p>
                        </div>
                        <div>
                            <label htmlFor="note" className="block text-sm font-medium mb-1">Reason / Note (Optional)</label>
                            <textarea
                                id="note"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={3}
                                placeholder="e.g., Received new shipment, Damaged items"
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 resize-none"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                            <SaveIcon className="w-5 h-5"/>Save Adjustment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InventoryView: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const loadData = useCallback(() => {
        const storedProducts = JSON.parse(localStorage.getItem('geminiProducts') || '[]');
        setProducts(storedProducts);
    }, []);

    useEffect(() => {
        loadData();
        const handleStorage = () => loadData();
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [loadData]);

    const handleOpenAdjustmentModal = (product: Product) => {
        setSelectedProduct(product);
        setIsAdjustmentModalOpen(true);
    };

    const handleSaveStockAdjustment = (productId: string, adjustment: number, note: string) => {
        const currentProducts: Product[] = JSON.parse(localStorage.getItem('geminiProducts') || '[]');
        const productIndex = currentProducts.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            console.error("Product not found for stock adjustment");
            return;
        }

        const productToUpdate = currentProducts[productIndex];
        const newStockLevel = productToUpdate.stock + adjustment;

        if (newStockLevel < 0) {
            if (!window.confirm(`This adjustment will result in a negative stock level (${newStockLevel}). Are you sure you want to proceed?`)) {
                return;
            }
        }

        currentProducts[productIndex] = { ...productToUpdate, stock: newStockLevel };
        localStorage.setItem('geminiProducts', JSON.stringify(currentProducts));

        const newRecord: StockRecord = {
            id: `stock-${Date.now()}`,
            productId: productToUpdate.id,
            productName: productToUpdate.name,
            type: 'adjustment',
            quantityChange: adjustment,
            newStockLevel: newStockLevel,
            timestamp: new Date().toISOString(),
            note: note || (adjustment > 0 ? 'Stock-in' : 'Stock-out'),
        };

        const currentStockRecords: StockRecord[] = JSON.parse(localStorage.getItem('geminiStockRecords') || '[]');
        localStorage.setItem('geminiStockRecords', JSON.stringify([newRecord, ...currentStockRecords]));
        
        setIsAdjustmentModalOpen(false);
        setSelectedProduct(null);
        
        // Dispatch custom event to trigger storage listener
        window.dispatchEvent(new StorageEvent('storage', { key: 'geminiProducts' }));
        window.dispatchEvent(new StorageEvent('storage', { key: 'geminiStockRecords' }));
    };

    const lowStockProducts = products
        .filter(p => p.stock < LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.stock - b.stock);
    const inStockProducts = products.filter(p => p.stock >= LOW_STOCK_THRESHOLD);
    const lowStockCount = lowStockProducts.length;

    const ProductRow: React.FC<{ product: Product, isLowStock: boolean }> = ({ product, isLowStock }) => (
        <div className={`grid grid-cols-3 gap-4 items-center p-2 rounded-md ${isLowStock ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
            <span className="font-semibold">{product.name}</span>
            <div className="text-center">
                <span className={`font-bold text-lg px-2 py-1 rounded ${isLowStock ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50' : 'text-gray-800 dark:text-gray-200'}`}>
                    {product.stock}
                </span>
            </div>
            <div className="text-right">
                <button
                    onClick={() => handleOpenAdjustmentModal(product)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                >
                    Adjust
                </button>
            </div>
        </div>
    );

    return (
        <div>
            {isAdjustmentModalOpen && selectedProduct && (
                <StockAdjustmentModal 
                    product={selectedProduct}
                    onClose={() => setIsAdjustmentModalOpen(false)}
                    onSave={handleSaveStockAdjustment}
                />
            )}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2"><ArchiveBoxIcon className="w-6 h-6"/>Inventory Management</h3>
                {lowStockCount > 0 && 
                    <span className="bg-red-100 text-red-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                        {lowStockCount} item(s) are low on stock!
                    </span>
                }
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-3 gap-4 items-center p-2 font-bold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <span>Product</span>
                        <span className="text-center">Stock Level</span>
                        <span className="text-right">Actions</span>
                    </div>

                    {lowStockProducts.length > 0 && (
                        <div className="py-2">
                            <h5 className="px-2 mb-1 text-xs font-bold text-red-500 uppercase tracking-wider">Low Stock Items</h5>
                            {lowStockProducts.map(product => <ProductRow key={product.id} product={product} isLowStock={true} />)}
                        </div>
                    )}

                    {inStockProducts.length > 0 && (
                        <div className="py-2 border-t dark:border-gray-700 mt-2">
                             <h5 className="px-2 mt-2 mb-1 text-xs font-bold text-gray-500 uppercase tracking-wider">In Stock Items</h5>
                            {inStockProducts.map(product => <ProductRow key={product.id} product={product} isLowStock={false} />)}
                        </div>
                    )}
                    
                    {products.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No products found. Add products in the 'Menu' section.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const LeaveManagementView: React.FC = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);

    const loadRequests = useCallback(() => {
        const stored = JSON.parse(localStorage.getItem('geminiLeaveRequests') || '[]').sort((a: LeaveRequest, b: LeaveRequest) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        setRequests(stored);
    }, []);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleUpdateStatus = (requestId: string, status: LeaveRequestStatus, currentStatus: LeaveRequestStatus) => {
        let confirmMessage = `Are you sure you want to ${status} this leave request?`;
        if (currentStatus === 'approved' && status === 'rejected') {
            confirmMessage = "Are you sure you want to cancel this approved leave? This will mark it as rejected.";
        } else if (currentStatus === 'rejected' && status === 'approved') {
            confirmMessage = "Are you sure you want to approve this previously rejected leave request?";
        }

        if (!window.confirm(confirmMessage)) {
            return;
        }

        const updatedRequests = requests.map(req =>
            req.id === requestId ? { ...req, status } : req
        );
        setRequests(updatedRequests);
        localStorage.setItem('geminiLeaveRequests', JSON.stringify(updatedRequests));
    };

    const getStatusClasses = (status: LeaveRequestStatus) => {
        const base = 'px-2 py-1 text-xs font-semibold rounded-full capitalize';
        switch (status) {
            case 'pending': return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
            case 'approved': return `${base} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
            case 'rejected': return `${base} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="w-6 h-6" />
                Leave Management
            </h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="space-y-3 max-h-[75vh] overflow-y-auto">
                    {/* Header for larger screens */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 font-bold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b dark:border-gray-700">
                        <div className="col-span-2">Agent</div>
                        <div className="col-span-2">Start Date</div>
                        <div className="col-span-2">End Date</div>
                        <div className="col-span-3">Reason</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>
                    {/* Data Rows */}
                    {requests.length > 0 ? requests.map(req => (
                        <div key={req.id} className="p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 items-center">
                            {/* Agent Name */}
                            <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-gray-500 md:hidden">Agent</p>
                                <p className="font-bold text-gray-900 dark:text-white">{req.agentName}</p>
                            </div>

                            {/* Start Date */}
                            <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-gray-500 md:hidden">Start Date</p>
                                <p>{new Date(req.startDate).toLocaleDateString()}</p>
                            </div>
                            
                            {/* End Date */}
                            <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-gray-500 md:hidden">End Date</p>
                                <p>{new Date(req.endDate).toLocaleDateString()}</p>
                            </div>

                            {/* Reason */}
                            <div className="md:col-span-3">
                                 <p className="text-xs font-semibold text-gray-500 md:hidden">Reason</p>
                                 <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={req.reason}>{req.reason}</p>
                            </div>

                            {/* Status */}
                            <div className="md:col-span-1">
                                <p className="text-xs font-semibold text-gray-500 md:hidden">Status</p>
                                <span className={getStatusClasses(req.status)}>{req.status}</span>
                            </div>

                            {/* Actions */}
                            <div className="md:col-span-2 flex justify-start md:justify-end items-center">
                                {req.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdateStatus(req.id, 'rejected', req.status)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">Reject</button>
                                        <button onClick={() => handleUpdateStatus(req.id, 'approved', req.status)} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">Approve</button>
                                    </div>
                                )}
                                {req.status === 'approved' && (
                                    <button onClick={() => handleUpdateStatus(req.id, 'rejected', req.status)} className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600">Cancel Approval</button>
                                )}
                                {req.status === 'rejected' && (
                                    <button onClick={() => handleUpdateStatus(req.id, 'approved', req.status)} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">Approve</button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No leave requests found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const { view, initialAction } = props;

  const renderView = () => {
    switch(view) {
        case 'dashboard': return <DashboardView />;
        case 'settings': return <SettingsView {...props} />;
        case 'orders': return <OrdersView initialAction={initialAction} />;
        case 'products': return <ProductsView />;
        case 'menu': return <MenuView />;
        case 'sales': return <SalesView />;
        case 'agents': return <AgentsView />;
        case 'performance': return <PerformanceView />;
        case 'submissions': return <SubmissionsView />;
        case 'tasks': return <TasksView />;
        case 'attendance': return <AttendanceView />;
        case 'payroll': return <PayrollView />;
        case 'expenses': return <ExpensesView />;
        case 'inventory': return <InventoryView />;
        case 'leave': return <LeaveManagementView />;
        default: return <DashboardView />;
    }
  }

  return (
    <div className="flex-grow p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto flex flex-col">
        <DashboardHeader />
        <div className="flex-grow">
            {renderView()}
        </div>
    </div>
  );
};

export default AdminPanel;