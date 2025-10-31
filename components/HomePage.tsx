
import React, { useState } from 'react';
import { PhoneIcon, MailIcon, WhatsAppIcon, InformationCircleIcon, ClockIcon, QuestionMarkCircleIcon, ChevronDownIcon, ChatBubbleIcon } from './icons';
import { FaqItem, Product } from '../types';

interface HomePageProps {
  onNavigateToChat: () => void;
  backgroundImage: string | null;
  aboutContent: string;
  faqs: FaqItem[];
  contactPhone: string;
  contactEmail: string;
  whatsappMessage: string;
  products: Product[];
  chatbotUrl: string;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigateToChat, backgroundImage, aboutContent, faqs, contactPhone, contactEmail, whatsappMessage, products, chatbotUrl }) => {
  const whatsappLink = `https://wa.me/${contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
  const chatQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(chatbotUrl)}`;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleFaqToggle = (index: number) => {
    setOpenFaqIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const bgStyle = backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {};

  return (
    <div 
      className="w-full h-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-y-auto bg-cover bg-center relative"
      style={bgStyle}
    >
      {backgroundImage && <div className="absolute inset-0 bg-black/60"></div>}
      
      <div className="relative z-10">
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md p-4 flex justify-between items-center sticky top-0">
          <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">Stanley Restaurant</h1>
          <button
            onClick={onNavigateToChat}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition-colors"
          >
            Chat to Order
          </button>
        </header>

        <div className="container mx-auto p-4 md:p-8">
            <section className="text-center mb-8">
              <div className="bg-black/30 backdrop-blur-sm p-6 rounded-xl inline-block">
                <h2 className="text-3xl font-extrabold mb-3 text-white">Delicious Food, Delivered Fast.</h2>
                <p className="text-base text-gray-200 max-w-2xl mx-auto mb-6">
                  Welcome to Stanley Restaurant, where every meal is a celebration. Browse our menu and chat with our friendly bot to place your order in seconds.
                </p>
                <button
                  onClick={onNavigateToChat}
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
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {products.length > 0 ? (
                          products.map(product => (
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
                          <p className="text-sm text-gray-500">Menu not available.</p>
                        )}
                      </div>
                    </section>
                    <section id="scan-to-chat" className="p-6 bg-green-50/80 dark:bg-green-900/70 backdrop-blur-sm rounded-xl shadow-lg text-center">
                      <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-3"><ChatBubbleIcon className="w-7 h-7 text-green-500" /> Scan to Chat</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Scan the QR code with your phone to start a conversation with our bot instantly!
                      </p>
                      <div className="flex justify-center p-2 bg-white rounded-lg">
                        <img src={chatQrCodeUrl} alt="Chatbot QR Code" className="w-40 h-40" />
                      </div>
                      <button 
                        onClick={onNavigateToChat} 
                        className="mt-6 inline-flex items-center gap-3 px-8 py-3 bg-green-600 text-white text-lg font-bold rounded-full shadow-lg hover:bg-green-700 transition-all transform hover:scale-105 hover:shadow-green-500/40"
                      >
                        <ChatBubbleIcon className="w-6 h-6"/> Click to Chat
                      </button>
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
  );
};

export default HomePage;