
import React from 'react';
import { Message, MessageAuthor } from '../types';
import { SpeakerIcon, SpinnerIcon, CheckIcon, CheckDoubleIcon, DeliveryTruckIcon } from './icons';

interface HighlightedTextProps {
  text: string;
  highlight: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <>{text}</>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-300 dark:bg-yellow-500 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
};


interface ChatMessageProps {
  message: Message;
  onPlayAudio: () => void;
  isAudioPlaying: boolean;
  searchQuery: string;
  onCancelOrder: (orderId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onPlayAudio, isAudioPlaying, searchQuery, onCancelOrder }) => {
  const isUser = message.author === MessageAuthor.USER;
  const isBot = message.author === MessageAuthor.BOT;
  const isSystem = message.author === MessageAuthor.SYSTEM;

  if (isSystem) {
    return (
      <div className="flex justify-center items-center my-2" aria-live="polite">
        <div className="flex items-center space-x-2 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-full shadow">
          <DeliveryTruckIcon className="w-4 h-4" />
          <span className="font-medium"><HighlightedText text={message.text} highlight={searchQuery} /></span>
           {message.cancellable && message.orderId && (
              <button 
                  onClick={() => onCancelOrder(message.orderId!)}
                  className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
              >
                  Cancel
              </button>
          )}
        </div>
      </div>
    );
  }

  const containerClasses = isUser ? 'justify-end' : 'justify-start';
  const bubbleClasses = isUser
    ? 'bg-green-200 dark:bg-green-700 text-gray-800 dark:text-gray-100 rounded-br-none'
    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none';

  return (
    <div className={`flex ${containerClasses}`}>
      <div className={`max-w-md md:max-w-lg p-3 rounded-lg shadow ${bubbleClasses}`}>
        {message.image && (
          <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-h-60" />
        )}
        {message.text === '...' ? (
            <div className="flex items-center justify-center space-x-1 p-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
            </div>
        ) : (
          <div>
            <p className="text-sm whitespace-pre-wrap"><HighlightedText text={message.text} highlight={searchQuery} /></p>
            <div className="flex justify-end items-center gap-1 mt-1">
              {isBot && (
                <button
                  onClick={onPlayAudio}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  title="Play audio"
                  disabled={isAudioPlaying}
                >
                  {isAudioPlaying ? <SpinnerIcon className="w-4 h-4" /> : <SpeakerIcon className="w-4 h-4" />}
                </button>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400 select-none">{message.timestamp}</span>
              {isUser && message.status === 'sent' && <CheckIcon className="w-4 h-4 text-gray-500" />}
              {isUser && message.status === 'delivered' && <CheckDoubleIcon className="w-4 h-4 text-blue-500" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
