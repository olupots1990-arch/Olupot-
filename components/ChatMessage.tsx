import React from 'react';
import { Message, MessageAuthor, AudioPlayerState } from '../types';
import { SpinnerIcon, CheckIcon, CheckDoubleIcon, DeliveryTruckIcon, WhatsAppIcon, PlayIcon, PauseIcon, VolumeUpIcon, VolumeOffIcon, SendIcon } from './icons';

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

const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const AudioPlayer: React.FC<{
    state: AudioPlayerState;
    onPlayPause: () => void;
    onScrub: (progress: number) => void;
    onVolumeChange: (volume: number) => void;
}> = ({ state, onPlayPause, onScrub, onVolumeChange }) => {
    const { isPlaying, progress, duration, volume, error } = state;
    
    if (error) {
        return <div className="text-xs text-red-500 dark:text-red-400 p-2">{error}</div>
    }

    const currentTime = duration * progress;

    return (
        <div className="flex items-center gap-2 mt-2 w-full max-w-[250px] p-2 bg-black/10 dark:bg-black/20 rounded-lg">
            <button onClick={onPlayPause} className="p-1 text-gray-700 dark:text-gray-200" title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
            </button>
            <div className="flex-grow flex items-center gap-2">
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={progress}
                    onChange={(e) => onScrub(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-300 dark:bg-gray-500 rounded-lg appearance-none cursor-pointer"
                    style={{ backgroundSize: `${progress * 100}% 100%` }}
                />
                <span className="text-xs font-mono w-10 text-right">{formatTime(currentTime)}/{formatTime(duration)}</span>
            </div>
             <div className="flex items-center gap-1 group">
                <button onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}>
                    {volume > 0 ? <VolumeUpIcon className="w-5 h-5"/> : <VolumeOffIcon className="w-5 h-5"/>}
                </button>
                <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={e => onVolumeChange(parseFloat(e.target.value))}
                    className="w-0 group-hover:w-16 h-1 bg-gray-300 dark:bg-gray-500 rounded-lg appearance-none cursor-pointer transition-all duration-300"
                    style={{ backgroundSize: `${volume * 100}% 100%` }}
                />
            </div>
        </div>
    );
};


interface ChatMessageProps {
  message: Message;
  searchQuery: string;
  onCancelOrder: (orderId: string) => void;
  contactPhone: string;
  audioPlayerState: AudioPlayerState;
  onAudioPlayRequest: (messageId: string, text: string, audioUrl?: string) => void;
  onAudioScrub: (progress: number) => void;
  onAudioVolumeChange: (volume: number) => void;
  onConfirmUpload: (messageId: string) => void;
  onCancelUpload: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
    message, 
    searchQuery, 
    onCancelOrder, 
    contactPhone, 
    audioPlayerState, 
    onAudioPlayRequest, 
    onAudioScrub, 
    onAudioVolumeChange,
    onConfirmUpload,
    onCancelUpload,
}) => {
  const isUser = message.author === MessageAuthor.USER;
  const isBot = message.author === MessageAuthor.BOT;
  const isSystem = message.author === MessageAuthor.SYSTEM;
  const isCurrentAudioMessage = audioPlayerState.messageId === message.id;

  if (isSystem) {
    const shareLink = message.orderSummaryForShare 
      ? `https://wa.me/${contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message.orderSummaryForShare)}`
      : '';

    // Use a more structured "box" for system messages with actions
    if (message.cancellable || message.orderSummaryForShare) {
         return (
          <div className="flex justify-center items-center my-2" aria-live="polite">
            <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-lg shadow">
              <div className="flex items-center gap-2">
                <DeliveryTruckIcon className="w-5 h-5" />
                <span className="font-medium"><HighlightedText text={message.text} highlight={searchQuery} /></span>
              </div>
              
              <div className="flex items-center gap-2">
               {message.cancellable && message.orderId && (
                  <button 
                      onClick={() => onCancelOrder(message.orderId!)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
                  >
                      Cancel
                  </button>
              )}
              {message.orderSummaryForShare && (
                  <a 
                      href={shareLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 bg-[#25D366] text-white rounded-full text-sm font-bold hover:bg-[#128C7E] flex items-center gap-2 transition-colors shadow"
                      title="Send order for approval on WhatsApp"
                  >
                      <WhatsAppIcon className="w-5 h-5"/> Send for Approval
                  </a>
              )}
              </div>
            </div>
          </div>
        );
    }
    
    // Default simple pill for other system messages
    return (
      <div className="flex justify-center items-center my-2" aria-live="polite">
        <div className="flex items-center space-x-2 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-full shadow">
          <DeliveryTruckIcon className="w-4 h-4" />
          <span className="font-medium"><HighlightedText text={message.text} highlight={searchQuery} /></span>
        </div>
      </div>
    );
  }

  const containerClasses = isUser ? 'justify-end' : 'justify-start';
  const bubbleClasses = isUser
    ? 'bg-green-200 dark:bg-green-700 text-gray-800 dark:text-gray-100 rounded-br-none'
    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none';

  if (message.needsConfirmation) {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className={`max-w-md md:max-w-lg p-3 rounded-lg shadow ${bubbleClasses}`}>
          {message.image && (
            <img src={message.image} alt="Upload preview" className="rounded-lg mb-2 max-h-60" />
          )}
          {message.text && (
            <p className="text-sm whitespace-pre-wrap mb-3">{message.text}</p>
          )}
          <div className="border-t border-green-300 dark:border-green-600 pt-2 flex justify-end items-center gap-2">
            <p className="text-xs text-gray-600 dark:text-gray-300 mr-auto">Send this to the AI?</p>
            <button
                onClick={() => onCancelUpload(message.id)}
                className="px-3 py-1 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-md dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={() => onConfirmUpload(message.id)}
                className="px-4 py-1 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center gap-1.5 transition-colors"
            >
                <SendIcon className="w-4 h-4" />
                Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {isUser && message.isVoice && message.audioUrl && (
                <div className="mb-2">
                {isCurrentAudioMessage ? (
                    <AudioPlayer 
                        state={audioPlayerState}
                        onPlayPause={() => onAudioPlayRequest(message.id, message.text, message.audioUrl)}
                        onScrub={onAudioScrub}
                        onVolumeChange={onAudioVolumeChange}
                    />
                ) : (
                    <button
                        onClick={() => onAudioPlayRequest(message.id, message.text, message.audioUrl)}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        title="Play voice message"
                        disabled={audioPlayerState.isLoading}
                    >
                      {audioPlayerState.isLoading && isCurrentAudioMessage ? <SpinnerIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                )}
                </div>
            )}
            <p className="text-sm whitespace-pre-wrap"><HighlightedText text={message.text} highlight={searchQuery} /></p>
            {isBot && (
                isCurrentAudioMessage ? (
                    <AudioPlayer 
                        state={audioPlayerState}
                        onPlayPause={() => onAudioPlayRequest(message.id, message.text)}
                        onScrub={onAudioScrub}
                        onVolumeChange={onAudioVolumeChange}
                    />
                ) : (
                    <button
                        onClick={() => onAudioPlayRequest(message.id, message.text)}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mt-2"
                        title="Play audio"
                        disabled={audioPlayerState.isLoading}
                    >
                      {audioPlayerState.isLoading && isCurrentAudioMessage ? <SpinnerIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                )
            )}
            <div className="flex justify-end items-center gap-1 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 select-none">{message.timestamp}</span>
              {isUser && message.status === 'sent' && <CheckIcon className="w-4 h-4 text-gray-500"><title>Sent</title></CheckIcon>}
              {isUser && message.status === 'delivered' && <CheckDoubleIcon className="w-4 h-4 text-blue-500"><title>Delivered</title></CheckDoubleIcon>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;