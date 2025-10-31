import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DeliveryOrder, AdminPanelView, Product, DeliveryAgent, FaqItem, ContactSubmission } from '../types';
import { PlusIcon, EditIcon, TrashIcon, SaveIcon, CloseIcon, BookOpenIcon, UsersIcon, MapPinIcon, TrendingUpIcon, ChartBarIcon, QuestionMarkCircleIcon, MailIcon, ChatBubbleIcon } from './icons';
import Menu from './Menu';
import { fileToDataUrl } from '../utils/image';

// Fix: Declare the 'google' global variable to resolve TypeScript errors for the Google Maps API.
declare const google: any;

interface AdminPanelProps {
  view: AdminPanelView;
  systemInstruction: string;
  onSaveSystemInstruction: (instruction: string) => void;
  onResetSystemInstruction: () => void;
  homeBackground: string | null;
  onSetHomeBackground: (imageDataUrl: string | null) => void;
  aboutContent: string;
  onAboutContentChange: (content: string) => void;
  faqs: FaqItem[];
  onFaqsChange: (faqs: FaqItem[]) => void;
  contactPhone: string;
  onContactPhoneChange: (phone: string) => void;
  contactEmail: string;
  onContactEmailChange: (email: string) => void;
  whatsappMessage: string;
  onWhatsappMessageChange: (message: string) => void;
  chatbotUrl: string;
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
                        <button type="button" onClick={onClose}><CloseIcon className="w-6 h-6"/></button>
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


interface DashboardViewProps {
  systemInstruction: string;
  onSaveSystemInstruction: (instruction: string) => void;
  onResetSystemInstruction: () => void;
  homeBackground: string | null;
  onSetHomeBackground: (imageDataUrl: string | null) => void;
  aboutContent: string;
  onAboutContentChange: (content: string) => void;
  faqs: FaqItem[];
  onFaqsChange: (faqs: FaqItem[]) => void;
  contactPhone: string;
  onContactPhoneChange: (phone: string) => void;
  contactEmail: string;
  onContactEmailChange: (email: string) => void;
  whatsappMessage: string;
  onWhatsappMessageChange: (message: string) => void;
  chatbotUrl: string;
}

const DashboardView: React.FC<DashboardViewProps> = (props) => {
  const [localInstruction, setLocalInstruction] = useState(props.systemInstruction);
  const [isInstructionSaved, setIsInstructionSaved] = useState(true);

  const [localAbout, setLocalAbout] = useState(props.aboutContent);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [localPhone, setLocalPhone] = useState(props.contactPhone);
  const [localEmail, setLocalEmail] = useState(props.contactEmail);
  const [localWhatsappMessage, setLocalWhatsappMessage] = useState(props.whatsappMessage);
  
  const chatQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(props.chatbotUrl)}`;


  useEffect(() => {
    setLocalInstruction(props.systemInstruction);
    setIsInstructionSaved(true);
  }, [props.systemInstruction]);

  useEffect(() => {
      setLocalAbout(props.aboutContent);
      setLocalPhone(props.contactPhone);
      setLocalEmail(props.contactEmail);
      setLocalWhatsappMessage(props.whatsappMessage);
  }, [props.aboutContent, props.contactPhone, props.contactEmail, props.whatsappMessage]);


  const handleSaveInstruction = () => {
    props.onSaveSystemInstruction(localInstruction);
    setIsInstructionSaved(true);
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await fileToDataUrl(file);
      props.onSetHomeBackground(dataUrl);
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
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2"><ChatBubbleIcon className="w-6 h-6"/> Chatbot QR Code</h3>
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="p-2 bg-white rounded-lg flex-shrink-0">
                <img src={chatQrCodeUrl} alt="Chatbot QR Code" className="w-40 h-40"/>
            </div>
            <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Use this QR code on flyers, table tents, or other promotional materials to direct customers straight to your chatbot.</p>
                <label className="block text-xs font-medium text-gray-500">Chatbot URL</label>
                <input 
                    type="text" 
                    readOnly 
                    value={props.chatbotUrl}
                    className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-sm"
                    onFocus={(e) => e.target.select()}
                />
            </div>
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
               <label className="block text-sm font-medium mb-2">FAQs</label>
               <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2 dark:border-gray-600">
                   {props.faqs.length > 0 ? props.faqs.map(faq => (
                       <div key={faq.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                           <p className="truncate font-semibold">{faq.question}</p>
                           <div className="flex space-x-2">
                               <button onClick={() => { setEditingFaq(faq); setIsFaqModalOpen(true); }} className="p-1 text-gray-500 hover:text-blue-500"><EditIcon className="w-5 h-5"/></button>
                               <button onClick={() => handleDeleteFaq(faq.id)} className="p-1 text-gray-500 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
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
                            <button onClick={() => handleDelete(sub.id)} className="p-1 text-gray-500 hover:text-red-500" title="Delete Submission">
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

    const handleAssignClick = (agent: DeliveryAgent) => {
        if (window.confirm(`Are you sure you want to assign this order to ${agent.name}?`)) {
            onAssign(agent.id);
        }
    };

    const filteredAgents = showOnlyAvailable ? agents.filter(a => a.status === 'available') : agents;

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
                    <button type="button" onClick={onClose}><CloseIcon className="w-6 h-6"/></button>
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
                    {filteredAgents.length > 0 ? filteredAgents.map(agent => (
                        <div key={agent.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            <div>
                                <p className="font-semibold">{agent.name}</p>
                                <p className="text-sm text-gray-500">{agent.phone}</p>
                            </div>
                            <div className="flex items-center gap-2">
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
                    )) : (
                        <p className="text-center text-gray-500 py-4">No agents match the filter.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const TrackAgentModal: React.FC<{
  onClose: () => void;
  order: DeliveryOrder;
  agent: DeliveryAgent;
}> = ({ onClose, order, agent }) => {
    const [currentLocation, setCurrentLocation] = useState(agent.currentLocation);
    const intervalRef = useRef<number | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    // Fix: Changed google.maps.Map to any to resolve namespace error.
    const googleMapRef = useRef<any | null>(null);
    // Fix: Changed google.maps.Marker to any to resolve namespace error.
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
        if (mapRef.current && !googleMapRef.current) {
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
        
        intervalRef.current = window.setInterval(simulateMovement, 3000);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [agent.name, currentLocation, simulateMovement]);

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2"><MapPinIcon className="w-6 h-6"/>Tracking Agent: {agent.name}</h3>
                    <button type="button" onClick={onClose}><CloseIcon className="w-6 h-6"/></button>
                </div>
                <div className="space-y-2 text-sm mb-4">
                    <p><strong>Destination:</strong> {order.deliveryAddress}</p>
                    <p><strong>Agent Status:</strong> <span className="font-mono p-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">{agent.status}</span></p>
                    <p><strong>Live Location:</strong> <span className="font-mono text-xs">{currentLocation?.lat.toFixed(4)}, {currentLocation?.lng.toFixed(4)}</span></p>
                </div>
                 <div ref={mapRef} className="w-full h-80 bg-gray-200 dark:bg-gray-700 rounded-md">
                    {/* Google Map will be rendered here */}
                 </div>
            </div>
        </div>
    );
};


const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);

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

  const updateLocalStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', { key }));
  };
  
  const handleUpdateStatus = (orderId: string, status: DeliveryOrder['status']) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status } : o);
    let updatedAgents = [...agents];

    if (status === 'delivered' || status === 'cancelled') {
        const order = orders.find(o => o.id === orderId);
        if (order?.agentId) {
             updatedAgents = agents.map(a => a.id === order.agentId ? {...a, status: 'available' as 'available'} : a);
        }
    }
    
    updateLocalStorage('geminiDeliveryOrders', updatedOrders);
    if(JSON.stringify(updatedAgents) !== JSON.stringify(agents)) {
        updateLocalStorage('geminiDeliveryAgents', updatedAgents);
    }
  };

  const handleAssignAgent = (orderId: string, agentId: string) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, agentId, status: 'out-for-delivery' as 'out-for-delivery' } : o);
    const updatedAgents = agents.map(a => a.id === agentId ? { ...a, status: 'on-delivery' as 'on-delivery' } : a);
    updateLocalStorage('geminiDeliveryOrders', updatedOrders);
    updateLocalStorage('geminiDeliveryAgents', updatedAgents);
    setIsAssignModalOpen(false);
    setSelectedOrder(null);
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
        {isTrackingModalOpen && selectedOrder && selectedOrder.agentId && <TrackAgentModal onClose={() => {setIsTrackingModalOpen(false); setSelectedOrder(null);}} order={selectedOrder} agent={agents.find(a => a.id === selectedOrder.agentId)!} />}
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
                 <div>
                    <p className="font-semibold">Address:</p>
                    <p className="text-gray-600 dark:text-gray-300">{order.deliveryAddress}</p>
                </div>
                <div className="flex flex-col items-start md:items-end justify-between">
                    <span className={getStatusClasses(order.status)}>{order.status.replace('-', ' ')}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Agent: {getAgentName(order.agentId)}</p>
                </div>
            </div>
            <div className="border-t dark:border-gray-700 mt-3 pt-3 flex flex-wrap gap-2 justify-end">
                {order.status === 'pending' && (
                    <>
                    <button onClick={() => handleUpdateStatus(order.id, 'approved')} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">Approve</button>
                    <button onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">Cancel</button>
                    </>
                )}
                 {order.status === 'approved' && (
                    <button onClick={() => { setSelectedOrder(order); setIsAssignModalOpen(true); }} className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Assign Agent</button>
                 )}
                 {order.status === 'out-for-delivery' && (
                     <>
                        <button onClick={() => { setSelectedOrder(order); setIsTrackingModalOpen(true); }} className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center gap-1"><MapPinIcon className="w-4 h-4"/>Track Agent</button>
                        <button onClick={() => handleUpdateStatus(order.id, 'delivered')} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">Mark as Delivered</button>
                     </>
                 )}
            </div>
            </div>
        ))}
        </div>
    </div>
  );
};

const ProductsView: React.FC = () => {
    // This view is a placeholder, as the functionality is within Modals triggered from other components.
    // In a larger app, you'd list and manage products here.
    return <div>Products View: To be implemented</div>;
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
    // This view is a placeholder, as the functionality is within Modals triggered from other components.
    // In a larger app, you'd list and manage agents here.
    return <div>Agents View: To be implemented</div>;
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


const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const { view } = props;

  return (
    <div className="flex-grow p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {view === 'dashboard' && <DashboardView {...props} />}
      {view === 'orders' && <OrdersView />}
      {view === 'products' && <ProductsView />}
      {view === 'menu' && <MenuView />}
      {view === 'sales' && <SalesView />}
      {view === 'agents' && <AgentsView />}
      {view === 'performance' && <PerformanceView />}
      {view === 'submissions' && <SubmissionsView />}
    </div>
  );
};

export default AdminPanel;