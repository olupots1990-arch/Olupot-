
import React, { useState, useEffect, useRef, useCallback } from 'react';
// Fix: Removed non-exported 'LiveSession' type.
import { GoogleGenAI, Chat, Modality, LiveServerMessage, Blob } from '@google/genai';
import { Message, MessageAuthor, ChatMode, DeliveryOrder, OrderItem, Product } from '../types';
import Header from './Header';
import MessageInput from './MessageInput';
import ChatMessage from './ChatMessage';
import * as geminiService from '../services/geminiService';
import { fileToBase64 } from '../utils/image';
import { decode, decodeAudioData, encode } from '../utils/audio';

const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

interface ChatInterfaceProps {
  systemInstruction: string;
  onNewOrderPlaced: () => void;
  onOrderChange: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ systemInstruction, onNewOrderPlaced, onOrderChange }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(ChatMode.STANDARD);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);

  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fix: Replaced 'LiveSession' with 'any' as it is not an exported type.
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
  
  const stopVoiceChat = useCallback(async (shouldSetState: boolean) => {
    if (sessionPromiseRef.current) {
        const session = await sessionPromiseRef.current;
        session.close();
        sessionPromiseRef.current = null;
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
        inputAudioContextRef.current.close();
    }
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    setIsBotSpeaking(false);
    
    if (shouldSetState) {
        setIsRecording(false);
    }
  }, []);

  const initializeChat = useCallback(() => {
    try {
      chatSessionRef.current = geminiService.initChat(chatMode, systemInstruction);
      const modeMessage = {
        [ChatMode.STANDARD]: "Standard mode activated.",
        [ChatMode.THINKING]: "Thinking mode activated for complex queries.",
        [ChatMode.LOW_LATENCY]: "Low-latency mode activated for quick responses."
      }[chatMode];

      setMessages([{
        id: 'system-intro-' + Date.now(),
        author: MessageAuthor.BOT,
        text: `Welcome to Stanley Restaurant! ${modeMessage}`,
        timestamp: getTimestamp(),
      }]);
    } catch (error) {
      console.error("Failed to initialize Gemini:", error);
      setMessages([{
        id: 'error-intro',
        author: MessageAuthor.BOT,
        text: "Error: Could not initialize AI model. Please check your API key and refresh.",
        timestamp: getTimestamp(),
      }]);
    }
  }, [chatMode, systemInstruction]);

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
        initializeChat();
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

    setIsLoading(true);

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      author: MessageAuthor.USER,
      text: text,
      image: imageFile ? URL.createObjectURL(imageFile) : undefined,
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

      if (imageFile) {
        const base64Image = await fileToBase64(imageFile);
        const mimeType = imageFile.type;
        const botResponseText = await geminiService.analyzeImage(text, { base64Image, mimeType });
        responseMessages.push({
          id: 'bot-' + Date.now(),
          author: MessageAuthor.BOT,
          text: botResponseText,
          timestamp: getTimestamp(),
        });
      } else {
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
                      text: `Placing order from Stanley Restaurant...`,
                      timestamp: getTimestamp(),
                  });

                  const orderItems: OrderItem[] = items.map(item => ({
                    name: item,
                    quantity: 1, 
                    price: parseFloat((Math.random() * (25 - 5) + 5).toFixed(2)),
                  }));
                  
                  const newOrder: DeliveryOrder = {
                    id: `order-${Date.now()}`,
                    restaurantName: "Stanley Restaurant",
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

                  responseMessages.push({
                      id: `system-delivery-update-${newOrder.id}`,
                      author: MessageAuthor.SYSTEM,
                      text: `Your order from Stanley Restaurant is awaiting approval.`,
                      timestamp: getTimestamp(),
                      orderId: newOrder.id,
                      cancellable: true,
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
      }
      
      setMessages(prev => {
        const newMessages = prev.slice(0, -1);
        // Fix: Added a type assertion to prevent TypeScript from widening the literal type 'delivered' to 'string'.
        const updatedMessages = newMessages.map(m => 
            m.id === userMessage.id ? { ...m, status: 'delivered' as 'delivered' } : m
        );
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
  
  const handleClearChat = () => {
    initializeChat();
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
            msg.orderId === orderId ? { ...msg, cancellable: false } : msg
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

  const handlePlayAudio = async (messageId: string, text: string) => {
    if (playingMessageId === messageId) return;
    setPlayingMessageId(messageId);
    try {
      await geminiService.playTextToSpeech(text);
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setPlayingMessageId(null);
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
                        const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                        
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

    const displayedMessages = messages.filter(msg => 
    searchQuery ? msg.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
      <Header 
        currentMode={chatMode} 
        onModeChange={setChatMode} 
        onClearChat={handleClearChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div 
        className="flex-grow p-4 overflow-y-auto bg-[#E5DDD5] dark:bg-[#0b141a]" 
        style={{
          backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAIRlWElmTU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAIAAIdpAAQAAAABAAAAWgAAAAAAAACQAAAAAQAAAJAAAAABAAOgAQADAAAAAQABAACgAgAEAAAAAQAAABigAwAEAAAAAQAAABgAAAAA8A2fuQAAAAlwSFlzAAALEwAACxMBAJqcGAAAA6RpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDYuMC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KbQSg6gAAAnxJREFUWAmtl0tPE1EUx+fM7JSWjqFFpVV5gQiiRh+AxV565a0X8V/wgEdeeuuNF/8EoqI3IYIAgfgh0NLu4bSZnZkYc+6MM20zNYmU1eS95CR/zvl/zplzQkI4G30tBsVAMBACwUAwEAwEw5B2z/c8x318d24/3P6/e187f5n28T9y9/zKjE6DkU7y4B70+Pz1846sn1a2xS1VdWB2z/c8x1M397H7d/uA3d/uB/c/vB/ch/sP6j9+N+z+c/up/c/up/fP+A/u/3B/fP3B/eP6A/ev7B6j/AP1H8A/Vf5D59w8T8b89YhGMyUoPN6DHePjy8vL6+vqi0+m02+1kMhkOh+PxeLvdvru7+2g0Ojs7+7W1tQAYGxv76urqhYWFbW1tAQD8/v5+bW3t0tLS5uZmoVDIFhYWAJjP5/d3d/+7u7v5fP7u7u4+Pj4ODw8BYHp6en5+XigUIpFItVrd3t6+s7NzZ2dne3s7AEy/3//s7Oz39/dCoZCfnx+LxQKBQIjFYqFQ6O3tBIClpaV1dXXz8/O5XC4ej3d+fj4yMtLLywsAAoGAw+G4nU5BEKRSKZ/PFwgEgUgkEolEXl4eAIDf7++vrw+FQt4/3B8fH5/b29v5+fmzszMAfH5+vrOzMxgMLi0tAQD4/f3d2tqKRqMvnx/d3d29vLwMCAh4fn7e3t4+Pz+/t7cHANze3jY2NhYVFdXW1gIAvP779f39/fPzMycnJ0AwEAwEw01w3/d2S4uL/f/48A3+c/tL+5/tL+4f9B/c/+B+dP+A/d/9r+7/9B82Y8c4wM9T/gAAAABJRU5ErkJggg==")`,
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="space-y-4">
          {displayedMessages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onPlayAudio={() => handlePlayAudio(msg.id, msg.text)}
              isAudioPlaying={playingMessageId === msg.id}
              searchQuery={searchQuery}
              onCancelOrder={handleCancelOrder}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <MessageInput
        onSendMessage={handleSendMessage}
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