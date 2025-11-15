

import React, { useState, useEffect, useRef } from 'react';
import { PhoneIcon, MailIcon, WhatsAppIcon, InformationCircleIcon, ClockIcon, QuestionMarkCircleIcon, ChevronDownIcon, BotIcon, CloseIcon, SearchIcon, UserIcon, LogoutIcon } from './icons';
import { FaqItem, Product, DeliveryAgent, AttendanceRecord } from '../types';
import ChatInterface from './ChatInterface';

interface HomePageProps {
  backgroundImage: string | null;
  aboutContent: string;
  historyContent: string;
  faqs: FaqItem[];
  contactPhone: string;
  contactEmail: string;
  whatsappMessage: string;
  products: Product[];
  systemInstruction: string;
  onNewOrderPlaced: () => void;
  onOrderChange: () => void;
  loggedInAgent: DeliveryAgent | null;
  onLogin: (agentId: string) => void;
  onLogout: () => void;
  setToast: (message: string) => void;
}

const AgentLoginModal: React.FC<{
    onClose: () => void;
    onLogin: (agentId: string) => void;
}> = ({ onClose, onLogin }) => {
    const [agents, setAgents] = useState<DeliveryAgent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');

    useEffect(() => {
        const storedAgents: DeliveryAgent[] = JSON.parse(localStorage.getItem('geminiDeliveryAgents') || '[]');
        setAgents(storedAgents);
        if (storedAgents.length > 0) {
            setSelectedAgentId(storedAgents[0].id);
        }
    }, []);

    const handleLoginClick = () => {
        if (selectedAgentId) {
            onLogin(selectedAgentId);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Agent Login</h3>
                    <button type="button" onClick={onClose} aria-label="Close login modal"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="agent-select" className="block text-sm font-medium mb-1">Select Your Profile</label>
                        <select
                            id="agent-select"
                            value={selectedAgentId}
                            onChange={e => setSelectedAgentId(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        >
                            {agents.map(agent => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleLoginClick} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 w-full">
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
};

const HomePage_AttendanceCameraModal: React.FC<{
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


const HomePage: React.FC<HomePageProps> = (props) => {
  const { 
    backgroundImage, aboutContent, historyContent, faqs, contactPhone, contactEmail, whatsappMessage, products,
    systemInstruction, onNewOrderPlaced, onOrderChange, loggedInAgent, onLogin, onLogout, setToast
  } = props;

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const whatsappLink = `https://wa.me/${contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappLink)}`;

  const handleFaqToggle = (index: number) => {
    setOpenFaqIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const handlePhotoCapture = (imageDataUrl: string) => {
    if (!loggedInAgent) return;

    const agents: DeliveryAgent[] = JSON.parse(localStorage.getItem('geminiDeliveryAgents') || '[]');
    const records: AttendanceRecord[] = JSON.parse(localStorage.getItem('geminiAttendanceRecords') || '[]');

    if (loggedInAgent.attendanceStatus === 'clocked-out') {
        const newRecord: AttendanceRecord = {
            id: `att-${Date.now()}`,
            agentId: loggedInAgent.id,
            agentName: loggedInAgent.name,
            clockInTime: new Date().toISOString(),
            clockOutTime: null,
            status: 'clocked-in',
            clockInPhoto: imageDataUrl,
        };
        const updatedRecords = [newRecord, ...records];
        const updatedAgents = agents.map(a => a.id === loggedInAgent.id ? { ...a, attendanceStatus: 'clocked-in' as 'clocked-in' } : a);
        localStorage.setItem('geminiAttendanceRecords', JSON.stringify(updatedRecords));
        localStorage.setItem('geminiDeliveryAgents', JSON.stringify(updatedAgents));
        setToast(`Clocked in successfully at ${new Date().toLocaleTimeString()}`);
    } else {
        const updatedRecords = records.map(r => 
            r.agentId === loggedInAgent.id && r.status === 'clocked-in'
            ? { ...r, status: 'clocked-out' as 'clocked-out', clockOutTime: new Date().toISOString(), clockOutPhoto: imageDataUrl }
            : r
        );
        const updatedAgents = agents.map(a => a.id === loggedInAgent.id ? { ...a, attendanceStatus: 'clocked-out' as 'clocked-out' } : a);
        localStorage.setItem('geminiAttendanceRecords', JSON.stringify(updatedRecords));
        localStorage.setItem('geminiDeliveryAgents', JSON.stringify(updatedAgents));
        setToast(`Clocked out successfully at ${new Date().toLocaleTimeString()}`);
    }
    
    onLogin(loggedInAgent.id); // Re-fetch agent data to update state
    setIsCameraModalOpen(false);
  };


  const bgStyle = backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {};
  
  const filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(menuSearchQuery.toLowerCase()))
  );


  return (
    <div className="w-full h-full relative">
      {isLoginModalOpen && <AgentLoginModal onClose={() => setIsLoginModalOpen(false)} onLogin={onLogin} />}
      {isCameraModalOpen && loggedInAgent && (
          <HomePage_AttendanceCameraModal 
              agent={loggedInAgent} 
              onClose={() => setIsCameraModalOpen(false)}
              onCapture={handlePhotoCapture}
          />
      )}
      <div 
        className="w-full h-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-y-auto bg-cover bg-center relative"
        style={bgStyle}
      >
        {backgroundImage && <div className="absolute inset-0 bg-black/60"></div>}
        
        <div className="relative z-10">
          <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md p-4 flex justify-between items-center sticky top-0">
            <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">STANLEY'S CAFETERIA</h1>
            <div className="flex items-center gap-4">
              {loggedInAgent ? (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCameraModalOpen(true)}
                        className={`px-3 py-2 text-sm font-semibold text-white rounded-lg shadow transition-colors ${loggedInAgent.attendanceStatus === 'clocked-in' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        {loggedInAgent.attendanceStatus === 'clocked-in' ? 'Clock Out' : 'Clock In'}
                    </button>
                    <span className="text-sm hidden sm:inline">Welcome, <strong>{loggedInAgent.name.split(' ')[0]}</strong></span>
                     <button onClick={onLogout} title="Logout" className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <LogoutIcon className="w-5 h-5"/>
                    </button>
                </div>
              ) : (
                <button onClick={() => setIsLoginModalOpen(true)} className="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                    <UserIcon className="w-5 h-5"/> Agent Login
                </button>
              )}

              <button
                onClick={() => setIsChatOpen(true)}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition-colors"
              >
                Chat to Order
              </button>
            </div>
          </header>

          <div className="container mx-auto p-4 md:p-8">
              <section className="text-center mb-8">
                <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl inline-block">
                  <h2 className="text-3xl font-extrabold mb-3 text-white">welcome to stanleys cafe</h2>
                  <p className="text-base text-gray-200 max-w-2xl mx-auto mb-6">
                    Welcome to Stanley's Cafeteria, where every meal is a celebration. Browse our menu and chat with our friendly bot to place your order in seconds.
                  </p>
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="px-6 py-3 bg-green-600 text-white text-base font-bold rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105"
                  >
                    Chat to Order Now
                  </button>
                </div>
              </section>

              <div className="flex flex-col lg:flex-row gap-8">
                  <main className="flex-grow space-y-8">
                      <section id="about" className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3"><InformationCircleIcon className="w-7 h-7 text-green-500" /> About Us</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {aboutContent}
                        </p>
                      </section>

                      <section id="history" className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3"><ClockIcon className="w-7 h-7 text-green-500" /> Our History</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {historyContent}
                        </p>
                      </section>
                      
                      <section id="faq" className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3"><QuestionMarkCircleIcon className="w-7 h-7 text-green-500" /> Frequently Asked Questions</h3>
                        <div className="space-y-4">
                          {faqs.map((faq, index) => (
                            <div key={faq.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                              <button
                                onClick={() => handleFaqToggle(index)}
                                className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-800 dark:text-gray-200 py-2"
                              >
                                <span>{faq.question}</span>
                                <ChevronDownIcon
                                  className={`w-6 h-6 transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180' : ''}`}
                                />
                              </button>
                              {openFaqIndex === index && (
                                <div className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed pr-8">
                                  {faq.answer}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                  </main>

                  <aside className="lg:w-1/3 flex-shrink-0 space-y-8">
                      <section id="menu" className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg">
                        <h3 className="text-2xl font-bold mb-4">Our Menu</h3>
                        <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Search menu..."
                                value={menuSearchQuery}
                                onChange={e => setMenuSearchQuery(e.target.value)}
                                className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700"
                            />
                            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                              <div key={product.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:pb-0 last:border-0">
                                <div className="flex justify-between items-baseline">
                                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">{product.name}</h4>
                                  <p className="font-mono text-green-600 dark:text-green-400">${product.price.toFixed(2)}</p>
                                </div>
                                {product.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{product.description}</p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-center text-gray-500 py-4">No menu items match your search.</p>
                          )}
                        </div>
                      </section>
                      <section id="whatsapp" className="p-6 bg-green-50/80 dark:bg-green-900/70 backdrop-blur-sm rounded-xl shadow-lg text-center">
                        <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3"><WhatsAppIcon className="w-7 h-7 text-green-500" /> Chat on WhatsApp</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Scan the QR code with your phone to start a conversation with us instantly!
                        </p>
                        <div className="flex justify-center p-2 bg-white rounded-lg">
                          <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-40 h-40" />
                        </div>
                        <a 
                          href={whatsappLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="mt-6 inline-flex items-center gap-3 px-8 py-3 bg-green-600 text-white text-lg font-bold rounded-full shadow-lg hover:bg-green-700 transition-all transform hover:scale-105 hover:shadow-green-500/40"
                        >
                          <WhatsAppIcon className="w-6 h-6"/> Click to Chat
                        </a>
                      </section>
                      
                      <section id="contact" className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg">
                        <h3 className="text-2xl font-bold mb-4">Contact Us</h3>
                        <div className="space-y-3">
                          <p className="flex items-center gap-3">
                            <PhoneIcon className="w-5 h-5 text-green-500" />
                            <a href={`tel:${contactPhone}`} className="hover:underline">{contactPhone}</a>
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp">
                              <WhatsAppIcon className="w-5 h-5 text-green-500 hover:text-green-600" />
                            </a>
                          </p>
                          <p className="flex items-center gap-3">
                            <MailIcon className="w-5 h-5 text-green-500" />
                            <a href={`mailto:${contactEmail}`} className="hover:underline">{contactEmail}</a>
                          </p>
                        </div>
                      </section>
                  </aside>
              </div>
          </div>
        </div>
      </div>

      {isChatOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setIsChatOpen(false)}></div>
          <div className="fixed bottom-0 right-0 md:bottom-4 md:right-4 w-full h-full md:w-[400px] md:h-[calc(100%-3rem)] md:max-h-[700px] bg-white dark:bg-gray-800 rounded-t-lg md:rounded-lg shadow-2xl z-50 flex flex-col animate-fade-in-up">
            <div className="flex-shrink-0 flex items-center justify-between p-2 bg-transparent text-white rounded-t-lg md:rounded-t-lg">
              <button onClick={() => setIsChatOpen(false)} className="absolute top-2 right-2 z-20 p-1 rounded-full text-gray-700 dark:text-gray-200 bg-white/50 hover:bg-white/80 dark:bg-black/50 dark:hover:bg-black/80">
                  <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-grow overflow-hidden -mt-12">
                <ChatInterface
                    systemInstruction={systemInstruction}
                    onNewOrderPlaced={onNewOrderPlaced}
                    onOrderChange={onOrderChange}
                    contactPhone={contactPhone}
                    whatsappMessage={whatsappMessage}
                />
            </div>
          </div>
        </>
      )}

      {!isChatOpen && (
          <button
              onClick={() => setIsChatOpen(true)}
              className="fixed bottom-6 right-6 bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 transition-transform transform hover:scale-110 z-30"
              aria-label="Open chat"
              title="Open chat"
          >
              <BotIcon className="w-8 h-8" />
          </button>
      )}
    </div>
  );
};

export default HomePage;
