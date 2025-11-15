
import React, { useState, useEffect, useRef, useCallback } from 'react';
// FIX: Rename Blob from @google/genai to GeminiBlob to avoid conflict with the native Blob type.
import { GoogleGenAI, Chat, Modality, LiveServerMessage, Blob as GeminiBlob } from '@google/genai';
import { Message, MessageAuthor, ChatMode, DeliveryOrder, OrderItem, Product, AudioPlayerState } from '../types';
import Header from './Header';
import MessageInput from './MessageInput';
import ChatMessage from './ChatMessage';
import * as geminiService from '../services/geminiService';
import { compressImage } from '../utils/image';
import { decode, decodeAudioData, encode, blobToBase64 } from '../utils/audio';
import { WhatsAppIcon, BrainIcon, CloseIcon, SpinnerIcon } from './icons';

const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const CHAT_HISTORY_KEY = 'geminiChatHistory';

const AiSearchResultPanel: React.FC<{
  isSearching: boolean;
  searchResult: string | null;
  onClose: () => void;
}> = ({ isSearching, searchResult, onClose }) => {
    if (!isSearching && !searchResult) return null;

    return (
        <div className="absolute top-0 left-0 right-0 bg-amber-100 dark:bg-amber-900/80 backdrop-blur-sm p-4 z-10 shadow-lg border-b-2 border-amber-300 dark:border-amber-700 animate-fade-in-down">
            <div className="max-w-4xl mx-auto flex items-start gap-4">
                <div className="flex-shrink-0 text-amber-600 dark:text-amber-300 mt-1">
                    <BrainIcon className="w-6 h-6"/>
                </div>
                <div className="flex-grow">
                    {isSearching && (
                        <div className="flex items-center gap-2">
                            <SpinnerIcon className="w-5 h-5 text-amber-800 dark:text-amber-200" />
                            <p className="font-semibold text-amber-800 dark:text-amber-200">AI is searching your conversation...</p>
                        </div>
                    )}
                    {searchResult && (
                        <div>
                            <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-1">AI Search Summary</h4>
                            <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">{searchResult}</p>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-1 rounded-full text-amber-600 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800">
                    <CloseIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
};


interface ChatInterfaceProps {
  systemInstruction: string;
  onNewOrderPlaced: () => void;
  onOrderChange: () => void;
  contactPhone: string;
  whatsappMessage: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ systemInstruction, onNewOrderPlaced, onOrderChange, contactPhone, whatsappMessage }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
        const saved = localStorage.getItem(CHAT_HISTORY_KEY);
        if (saved) {
            const parsedMessages = JSON.parse(saved);
            if (Array.isArray(parsedMessages)) {
                return parsedMessages;
            }
        }
    } catch (error) {
        console.error("Could not load messages from localStorage", error);
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.STANDARD);
  const [audioPlayerState, setAudioPlayerState] = useState<AudioPlayerState>({
    messageId: null,
    audioUrl: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 1,
    isLoading: false,
    error: null,
    isTransient: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [aiSearchResult, setAiSearchResult] = useState<string | null>(null);

  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    // Don't persist voice chat history
    if (chatMode === ChatMode.VOICE) {
      localStorage.removeItem(CHAT_HISTORY_KEY);
      return;
    }
    
    const messagesToSave = messages.filter(m => m.text !== '...' && !m.needsConfirmation);
    if (messagesToSave.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messagesToSave));
    } else {
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  }, [messages, chatMode]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'geminiDeliveryOrders' && event.newValue && event.oldValue) {
            try {
                const newOrders: DeliveryOrder[] = JSON.parse(event.newValue);
                const oldOrders: DeliveryOrder[] = JSON.parse(event.oldValue);

                newOrders.forEach(newOrder => {
                    const oldOrder = oldOrders.find(o => o.id === newOrder.id);
                    // Check if an order's status has changed from pending
                    if (oldOrder && oldOrder.status === 'pending' && newOrder.status !== 'pending') {
                        const isOrderInChat = messages.some(msg => msg.orderId === newOrder.id);
                        if (isOrderInChat) {
                            setMessages(prevMessages => {
                                // Update original message to remove cancel button
                                let updatedMessages = prevMessages.map(msg =>
                                    msg.orderId === newOrder.id ? { ...msg, cancellable: false } : msg
                                );
                                // Add a new system message based on the new status
                                if (newOrder.status === 'approved') {
                                    updatedMessages.push({
                                        id: `system-approval-${newOrder.id}`,
                                        author: MessageAuthor.SYSTEM,
                                        text: `Your order has been approved! Estimated delivery: ${newOrder.estimatedDeliveryTime || 'soon'}.`,
                                        timestamp: getTimestamp(),
                                    });
                                } else if (newOrder.status === 'cancelled') {
                                     updatedMessages.push({
                                        id: `system-rejection-${newOrder.id}`,
                                        author: MessageAuthor.SYSTEM,
                                        text: `Unfortunately, your order has been rejected by the restaurant.`,
                                        timestamp: getTimestamp(),
                                    });
                                }
                                return updatedMessages;
                            });
                        }
                    }
                });
            } catch (error) {
                console.error("Error processing storage update in chat:", error);
            }
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [messages]);
  
  // Effect to manage audio player event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setAudioPlayerState(s => ({ ...s, duration: audio.duration }));
    const onTimeUpdate = () => setAudioPlayerState(s => s.duration > 0 ? { ...s, progress: audio.currentTime / s.duration } : s);
    const onPlay = () => setAudioPlayerState(s => ({ ...s, isPlaying: true }));
    const onPause = () => setAudioPlayerState(s => ({ ...s, isPlaying: false }));
    const onEnded = () => setAudioPlayerState(s => ({ ...s, isPlaying: false, progress: 1 }));
    const onError = () => setAudioPlayerState(s => ({ ...s, isLoading: false, error: "Failed to load audio." }));

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);
  
  // Effect to manage Blob URL cleanup
  useEffect(() => {
    const url = audioPlayerState.audioUrl;
    const isTransient = audioPlayerState.isTransient;
    return () => {
      // Only revoke transient URLs (like from TTS)
      if (url && isTransient && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [audioPlayerState.audioUrl, audioPlayerState.isTransient]);

  // Effect to clean up all voice message URLs on unmount
  useEffect(() => {
    return () => {
        messagesRef.current.forEach(msg => {
            if (msg.isVoice && msg.audioUrl && msg.audioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(msg.audioUrl);
            }
        });
    };
  }, []);


  const stopVoiceChat = useCallback(async (shouldSetState: boolean) => {
    if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (error) {
            console.warn("Error closing voice session:", error);
        } finally {
            sessionPromiseRef.current = null;
        }
    }
    if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
    }
    if (scriptProcessorNodeRef.current) {
        scriptProcessorNodeRef.current.disconnect();
        scriptProcessorNodeRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close().catch(e => console.warn("Error closing input audio context:", e));
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close().catch(e => console.warn("Error closing output audio context:", e));
    }

    audioSourcesRef.current.forEach(source => {
        try {
            source.stop();
        } catch (e) {
            // Ignore errors if source already stopped
        }
    });
    audioSourcesRef.current.clear();
    setIsBotSpeaking(false);
    
    if (shouldSetState) {
        setIsRecording(false);
    }
  }, []);

  const initializeChat = useCallback((clearHistory: boolean) => {
    try {
      chatSessionRef.current = geminiService.initChat(chatMode, systemInstruction);
      const modeMessage = {
        [ChatMode.STANDARD]: "Standard mode activated.",
        [ChatMode.THINKING]: "Thinking mode activated for complex queries.",
        [ChatMode.LOW_LATENCY]: "Low-latency mode activated for quick responses."
      }[chatMode];

      if (clearHistory || messages.length === 0) {
        setMessages([{
            id: 'system-intro-' + Date.now(),
            author: MessageAuthor.BOT,
            text: `Welcome to STANLEY'S CAFETERIA! ${modeMessage}`,
            timestamp: getTimestamp(),
        }]);
      }
    } catch (error) {
      console.error("Failed to initialize Gemini:", error);
      setMessages([{
        id: 'error-intro',
        author: MessageAuthor.BOT,
        text: "Error: Could not initialize AI model. Please check your API key and refresh.",
        timestamp: getTimestamp(),
      }]);
    }
  }, [chatMode, systemInstruction, messages.length]);

  useEffect(() => {
    if (chatMode === ChatMode.VOICE) {
        chatSessionRef.current = null; // Clear text chat
        setMessages([{
            id: 'system-voice-intro-' + Date.now(),
            author: MessageAuthor.BOT,
            text: "Voice mode is active. Tap the microphone below to start the conversation.",
            timestamp: getTimestamp(),
        }]);
    } else {
        if (sessionPromiseRef.current) {
            stopVoiceChat(true);
        }
        initializeChat(false);
    }
    // This effect should run when mode or instruction changes.
    // The cleanup will be handled by the component unmount or the mode change itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMode, systemInstruction]);
  
   useEffect(() => {
    // ComponentWillUnmount cleanup
    return () => {
        stopVoiceChat(false);
    }
  }, [stopVoiceChat]);


  const handleSendMessage = async (text: string, imageFile: File | null) => {
    if (!text && !imageFile) return;

    // Handle image uploads with a confirmation step
    if (imageFile) {
        try {
            const compressedDataUrl = await compressImage(imageFile, 800, 0.8);
            const userMessage: Message = {
                id: 'user-' + Date.now(),
                author: MessageAuthor.USER,
                text: text,
                image: compressedDataUrl,
                timestamp: getTimestamp(),
                needsConfirmation: true, // This message requires confirmation
            };
            setMessages(prev => [...prev, userMessage]);
        } catch (error) {
            console.error("Failed to compress image:", error);
            const errorMessage: Message = {
                id: 'error-' + Date.now(),
                author: MessageAuthor.SYSTEM,
                text: 'Error: Could not process the uploaded image.',
                timestamp: getTimestamp(),
            };
            setMessages(prev => [...prev, errorMessage]);
        }
        return; // Stop here and wait for user confirmation
    }

    // Handle text-only messages
    setIsLoading(true);
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      author: MessageAuthor.USER,
      text: text,
      timestamp: getTimestamp(),
      status: 'sent',
    };
    
    setMessages(prev => [
      ...prev, 
      userMessage, 
      { id: 'bot-typing-' + Date.now(), author: MessageAuthor.BOT, text: '...', timestamp: ''}
    ]);

    try {
      const responseMessages: Message[] = [];
      if (!chatSessionRef.current) {
        throw new Error("Chat session is not initialized.");
      }
      const response = await geminiService.sendMessage(chatSessionRef.current, text);
      
      if (response.functionCalls && response.functionCalls.length > 0) {
          for (const fc of response.functionCalls) {
            if (fc.name === 'getProducts') {
                const products: Product[] = JSON.parse(localStorage.getItem('geminiProducts') || '[]');
                const toolResult = products.map(p => ({ name: p.name, price: p.price }));
                const finalResponse = await geminiService.sendToolResponse(chatSessionRef.current, fc.id, fc.name, toolResult);
                responseMessages.push({
                    id: 'bot-' + Date.now(),
                    author: MessageAuthor.BOT,
                    text: finalResponse.text,
                    timestamp: getTimestamp(),
                });
            } else if (fc.name === 'orderDelivery') {
                const { items, deliveryAddress, customerName, phoneNumber } = fc.args as { items: string[]; deliveryAddress: string; customerName: string; phoneNumber: string; };
                responseMessages.push({
                    id: 'system-order-' + Date.now(),
                    author: MessageAuthor.SYSTEM,
                    text: `Placing order from STANLEY'S CAFETERIA...`,
                    timestamp: getTimestamp(),
                });
                const orderItems: OrderItem[] = items.map(item => ({ name: item, quantity: 1, price: parseFloat((Math.random() * (25 - 5) + 5).toFixed(2)) }));
                const newOrder: DeliveryOrder = {
                  id: `order-${Date.now()}`,
                  restaurantName: "STANLEY'S CAFETERIA",
                  items: orderItems,
                  deliveryAddress,
                  timestamp: new Date().toISOString(),
                  status: 'pending',
                  customerName,
                  phoneNumber,
                };
                const existingOrders: DeliveryOrder[] = JSON.parse(localStorage.getItem('geminiDeliveryOrders') || '[]');
                localStorage.setItem('geminiDeliveryOrders', JSON.stringify([...existingOrders, newOrder]));
                onNewOrderPlaced();
                const toolResult = { status: "SUCCESS", message: `Order for ${items.join(', ')} has been placed and is now awaiting approval from the restaurant.` };
                const finalResponse = await geminiService.sendToolResponse(chatSessionRef.current, fc.id, fc.name, toolResult);
                responseMessages.push({
                    id: 'bot-' + Date.now(),
                    author: MessageAuthor.BOT,
                    text: finalResponse.text,
                    timestamp: getTimestamp(),
                });
                
                // Generate detailed summaries for display and WhatsApp
                const orderTotal = newOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                const itemsSummaryForDisplay = newOrder.items.map(item => `${item.quantity}x ${item.name}`).join(', ');
                const itemsSummaryForWhatsApp = newOrder.items.map(item => `- ${item.quantity}x ${item.name} @ $${item.price.toFixed(2)}`).join('\n');
                
                // Create the deep link for admin approval
                const approvalLink = `${window.location.origin}${window.location.pathname}?view=admin&action=approve&orderId=${newOrder.id}`;
                
                // Construct the pre-filled WhatsApp message
                const shareSummary = `Hello! Please approve my order from STANLEY'S CAFETERIA.\n\n*Order ID:* ${newOrder.id}\n*Customer:* ${newOrder.customerName}\n*Phone:* ${newOrder.phoneNumber}\n*Address:* ${newOrder.deliveryAddress}\n\n*Items:*\n${itemsSummaryForWhatsApp}\n*Total:* $${orderTotal.toFixed(2)}\n\n*Admin Approval Link:* ${approvalLink}`;
                
                // Construct the system message to be displayed in the chat
                const systemMessageText = `Order Summary (Total: $${orderTotal.toFixed(2)}):\nItems: ${itemsSummaryForDisplay}\nAddress: ${newOrder.deliveryAddress}\n\nPlease click below to send this order for approval via WhatsApp.`;

                responseMessages.push({
                    id: `system-delivery-update-${newOrder.id}`,
                    author: MessageAuthor.SYSTEM,
                    text: systemMessageText, // Updated to show summary in chat
                    timestamp: getTimestamp(),
                    orderId: newOrder.id,
                    cancellable: true,
                    orderSummaryForShare: shareSummary, // Updated to include price details
                });

            } else {
                console.warn(`Unsupported function call: ${fc.name}`);
            }
          }
      } else {
        responseMessages.push({
          id: 'bot-' + Date.now(),
          author: MessageAuthor.BOT,
          text: response.text,
          timestamp: getTimestamp(),
        });
      }
      
      setMessages(prev => {
        const newMessages = prev.slice(0, -1);
        const updatedMessages = newMessages.map(m => m.id === userMessage.id ? { ...m, status: 'delivered' as 'delivered' } : m);
        return [...updatedMessages, ...responseMessages];
      });

    } catch (error) {
      console.error('Gemini API error:', error);
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        author: MessageAuthor.BOT,
        text: 'Sorry, something went wrong. Please try again.',
        timestamp: getTimestamp(),
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpload = async (messageId: string) => {
    const messageToConfirm = messages.find(m => m.id === messageId);
    if (!messageToConfirm || !messageToConfirm.image) return;

    setIsLoading(true);

    // Update the message to remove the confirmation flag and add a bot typing indicator
    setMessages(prev => [
        ...prev.map(m => m.id === messageId ? { ...m, needsConfirmation: false, status: 'sent' as 'sent' } : m),
        { id: 'bot-typing-' + Date.now(), author: MessageAuthor.BOT, text: '...', timestamp: '' }
    ]);

    try {
        const [meta, base64Image] = messageToConfirm.image.split(',');
        const mimeTypeMatch = meta.match(/:(.*?);/);
        if (!mimeTypeMatch) {
            throw new Error("Invalid data URL for image upload");
        }
        const mimeType = mimeTypeMatch[1];
        
        const botResponseText = await geminiService.analyzeImage(messageToConfirm.text, { base64Image, mimeType });
        
        const botMessage: Message = {
            id: 'bot-' + Date.now(),
            author: MessageAuthor.BOT,
            text: botResponseText,
            timestamp: getTimestamp(),
        };

        setMessages(prev => {
            const newMessages = prev.slice(0, -1); // Remove typing indicator
            const updatedMessages = newMessages.map(m => 
                m.id === messageId ? { ...m, status: 'delivered' as 'delivered' } : m
            );
            return [...updatedMessages, botMessage];
        });

    } catch (error) {
        console.error('Gemini API error:', error);
        const errorMessage: Message = {
            id: 'error-' + Date.now(),
            author: MessageAuthor.BOT,
            text: 'Sorry, something went wrong analyzing the image. Please try again.',
            timestamp: getTimestamp(),
        };
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCancelUpload = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };
  
  const handleClearChat = () => {
    initializeChat(true);
  };

  const handleCancelOrder = (orderId: string) => {
    const existingOrders: DeliveryOrder[] = JSON.parse(localStorage.getItem('geminiDeliveryOrders') || '[]');
    const updatedOrders = existingOrders.map(order => 
      order.id === orderId ? { ...order, status: 'cancelled' as 'cancelled' } : order
    );
    localStorage.setItem('geminiDeliveryOrders', JSON.stringify(updatedOrders));
    onOrderChange();

    setMessages(prevMessages => {
        const newMessages = prevMessages.map(msg => 
            msg.orderId === orderId ? { ...msg, cancellable: false, orderSummaryForShare: undefined } : msg
        );
        newMessages.push({
            id: `system-cancel-confirm-${orderId}`,
            author: MessageAuthor.SYSTEM,
            text: 'Your order has been successfully cancelled.',
            timestamp: getTimestamp(),
        });
        return newMessages;
    });
  };

  const handleAudioPlayRequest = async (messageId: string, text: string, audioUrl?: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioPlayerState.messageId === messageId) {
        // Toggle play/pause for the current message
        audioPlayerState.isPlaying ? audio.pause() : audio.play();
    } else {
        // Start playing a new message
        setAudioPlayerState(s => ({ ...s, messageId, isLoading: true, error: null, progress: 0, duration: 0 }));
        try {
            let url: string;
            let isTransient = false;
            if (audioUrl) {
                url = audioUrl;
                isTransient = false; // It's from the message state, not transient.
            } else {
                url = await geminiService.getTextToSpeechUrl(text);
                isTransient = true; // This one is newly generated and transient.
            }
            
            setAudioPlayerState(s => ({ ...s, audioUrl: url, isLoading: false, isTransient }));
            audio.src = url;
            audio.play();
        } catch (error) {
            console.error('Error getting audio URL:', error);
            setAudioPlayerState(s => ({ ...s, isLoading: false, error: 'Could not load audio.' }));
        }
    }
  };

  const handleAudioScrub = (progress: number) => {
    if (audioRef.current && audioPlayerState.duration > 0) {
      audioRef.current.currentTime = progress * audioPlayerState.duration;
      setAudioPlayerState(s => ({ ...s, progress }));
    }
  };

  const handleAudioVolumeChange = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setAudioPlayerState(s => ({ ...s, volume }));
    }
  };
  
   const startVoiceChat = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphoneStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const onMessage = async (message: LiveServerMessage) => {
                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio && outputAudioContextRef.current) {
                    setIsBotSpeaking(true);
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                    const source = outputAudioContextRef.current.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputAudioContextRef.current.destination);
                    source.addEventListener('ended', () => {
                        audioSourcesRef.current.delete(source);
                        if (audioSourcesRef.current.size === 0) {
                            setIsBotSpeaking(false);
                        }
                    });
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    audioSourcesRef.current.add(source);
                }

                if (message.serverContent?.interrupted) {
                    audioSourcesRef.current.forEach(source => source.stop());
                    audioSourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                    setIsBotSpeaking(false);
                }
                
                 if (message.serverContent?.inputTranscription) {
                    const text = message.serverContent.inputTranscription.text;
                    currentInputTranscriptionRef.current += text;
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.id.startsWith('user-voice-')) {
                            return [...prev.slice(0, -1), { ...last, text: currentInputTranscriptionRef.current || '...' }];
                        }
                        return [...prev, { id: 'user-voice-' + Date.now(), author: MessageAuthor.USER, text: currentInputTranscriptionRef.current, timestamp: getTimestamp(), status: 'sent' }];
                    });
                }

                if (message.serverContent?.outputTranscription) {
                    const text = message.serverContent.outputTranscription.text;
                    currentOutputTranscriptionRef.current += text;
                    setMessages(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.id.startsWith('bot-voice-')) {
                            return [...prev.slice(0, -1), { ...last, text: currentOutputTranscriptionRef.current || '...' }];
                        }
                        return [...prev, { id: 'bot-voice-' + Date.now(), author: MessageAuthor.BOT, text: currentOutputTranscriptionRef.current, timestamp: getTimestamp() }];
                    });
                }

                if (message.serverContent?.turnComplete) {
                    currentInputTranscriptionRef.current = '';
                    currentOutputTranscriptionRef.current = '';
                }
            };
            
            const callbacks = {
                onOpen: () => {
                    const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorNodeRef.current = scriptProcessor;
                    
                    scriptProcessor.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        // FIX: Use the aliased GeminiBlob type for the object sent to the Gemini API.
                        const pcmBlob: GeminiBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                        
                        sessionPromiseRef.current?.then(session => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);
                },
                onMessage,
                onError: (e: ErrorEvent) => { console.error('Voice chat error:', e); stopVoiceChat(true); },
                onClose: (e: CloseEvent) => { stopVoiceChat(true); },
            };
            
            sessionPromiseRef.current = geminiService.connectLiveSession(callbacks, systemInstruction);

        } catch (error) {
            console.error('Failed to start voice chat:', error);
            setMessages(prev => [...prev, {
                id: 'system-error-mic-' + Date.now(),
                author: MessageAuthor.SYSTEM,
                text: 'Could not access microphone. Please check permissions and try again.',
                timestamp: getTimestamp(),
            }]);
            setIsRecording(false);
        }
    }, [systemInstruction, stopVoiceChat]);

    const handleSearchSubmit = async (query: string) => {
      if (!query.trim()) {
          setAiSearchResult(null);
          return;
      }
      setIsSearching(true);
      setAiSearchResult(null);
      try {
          const result = await geminiService.performAiSearch(query, messages);
          setAiSearchResult(result);
      } catch (error) {
          console.error("AI search failed:", error);
          setAiSearchResult("Sorry, the AI-powered search failed. Please check your connection or try again.");
      } finally {
          setIsSearching(false);
      }
    };

    const handleSendVoiceMessage = async (audioBlob: Blob) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const voiceMessage: Message = {
          id: 'user-voice-' + Date.now(),
          author: MessageAuthor.USER,
          text: '🎤 Voice Message',
          timestamp: getTimestamp(),
          isVoice: true,
          audioUrl: audioUrl,
          status: 'sent',
      };
  
      setMessages(prev => [...prev, voiceMessage]);
      
      try {
          const base64Audio = await blobToBase64(audioBlob);
          const transcribedText = await geminiService.transcribeAudio({
              base64Audio,
              mimeType: audioBlob.type,
          });
          
          // Update the message with the transcription
          setMessages(prev => prev.map(msg => msg.id === voiceMessage.id ? { ...msg, text: transcribedText, status: 'delivered' } : msg));
  
          // Now send the transcribed text to the bot for a response
          await handleSendMessage(transcribedText, null);
  
      } catch (error) {
          console.error("Voice transcription error:", error);
          setMessages(prev => prev.map(msg => 
              msg.id === voiceMessage.id 
              ? { ...msg, text: 'Error: Could not transcribe audio.', status: 'delivered' } 
              : msg
          ));
      }
    };

    const handleCloseSearchPanel = () => {
        setAiSearchResult(null);
    };

    const displayedMessages = messages.filter(msg => 
    searchQuery ? msg.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );
  
  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800 relative w-full flex-shrink-0">
      <audio ref={audioRef} />
      <AiSearchResultPanel 
        isSearching={isSearching}
        searchResult={aiSearchResult}
        onClose={handleCloseSearchPanel}
      />
      <Header 
        currentMode={chatMode} 
        onModeChange={setChatMode} 
        onClearChat={handleClearChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />
      <div 
        className="flex-grow p-4 overflow-y-auto bg-[#E5DDD5] dark:bg-[#0b141a] transition-all duration-300" 
        style={{
          paddingTop: (isSearching || aiSearchResult) ? '8rem' : '1rem',
          backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAIRlWElmTU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAACQAAAAAQAAAJAAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAABigAwAEAAAAAQAAABgAAAAA8A2fuQAAAAlwSFlzAAALEwAACxMBAJqcGAAAA6RpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDYuMC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KbQSg6gAAAnxJREFUWAmtl0tPE1EUx+fM7JSWjqFFpVV5gQiiRh+AxV565a0X8V/wgEdeeuuNF/8EoqI3IYIAgfgh0NLu4bSZnZkYc+6MM20zNYmU1eS95CR/zvl/zplzQkI4G30tBsVAMBACwUAwEAwEw5B2z/c8x318d24/3P6/e187f5n28T9y9/zKjE6DkU7y4B70+Pz1846sn1a2xS1VdWB2z/c8x1M397H7d/uA3d/uB/c/vB/ch/sP6j9+N+z+c/up/c/up/fP+A/u/3B/fP3B/eP6A/ev7B6j/AP1H8A/Vf5D59w8T8b89YhGMyUoPN6DHePjy8vL6+vqi0+m02+1kMhkOh+PxeLvdvru7+2g0Ojs7+7W1tQAYGxv76urqhYWFbW1tAQD8/v5+bW3t0tLS5uZmoVDIFhYWAJjP5/d3d/+7u7v5fP7u7u4+Pj4ODw8BYHp6en5+XigUIpFItVrd3t6+s7NzZ2dne3s7AEy/3//s7Oz39/dCoZCfnx+LxQKBQIjFYqFQ6O3tBIClpaV1dXXz8/O5XC4ej3d+fj4yMtLLywsAAoGAw+G4nU5BEKRSKZ/PFwgEgUgkEolEXl4eAIDf7++vrw+FQt4/3B8fH5/b29v5+fmzszMAfH5+vrOzMxgMLi0tAQD4/f3d2tqKRqMvnx/d3d29vLwMCAh4fn7e3t4+Pz+/t7cHANze3jY2NhYVFdXW1gIAvP779f39/fPzMycnJ0AwEAwEw01w3/d2S4uL/f/48A3+c/tL+5/tL+4f9B/c/+B+dP+A/d/9r+7/9B82Y8c4wM9T/gAAAABJRU5ErkJggg==")`,
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="space-y-4">
          {displayedMessages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              searchQuery={searchQuery}
              onCancelOrder={handleCancelOrder}
              contactPhone={contactPhone}
              audioPlayerState={audioPlayerState}
              onAudioPlayRequest={handleAudioPlayRequest}
              onAudioScrub={handleAudioScrub}
              onAudioVolumeChange={handleAudioVolumeChange}
              onConfirmUpload={handleConfirmUpload}
              onCancelUpload={handleCancelUpload}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <MessageInput
        onSendMessage={handleSendMessage}
        onSendVoiceMessage={handleSendVoiceMessage}
        isLoading={isLoading}
        chatMode={chatMode}
        isRecording={isRecording}
        onStartVoice={() => { setIsRecording(true); startVoiceChat(); }}
        onStopVoice={() => stopVoiceChat(true)}
        isBotSpeaking={isBotSpeaking}
      />
    </div>
  );
};

export default ChatInterface;