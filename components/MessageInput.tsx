
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, PaperclipIcon, MicrophoneIcon, StopIcon, SpeakerIcon } from './icons';
import { ChatMode } from '../types';

interface MessageInputProps {
  onSendMessage: (text: string, imageFile: File | null) => void;
  isLoading: boolean;
  chatMode?: ChatMode;
  isRecording?: boolean;
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  isBotSpeaking?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  chatMode, 
  isRecording, 
  onStartVoice, 
  onStopVoice,
  isBotSpeaking,
}) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if ((text.trim() || imageFile) && !isLoading) {
      onSendMessage(text, imageFile);
      setText('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (chatMode === ChatMode.VOICE) {
    return (
        <div className="p-4 bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex flex-col justify-center items-center h-[92px]">
            {isBotSpeaking && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2 animate-pulse">
                    <SpeakerIcon className="w-4 h-4" />
                    <span>Bot is speaking...</span>
                </div>
            )}
            <button
                onClick={isRecording ? onStopVoice : onStartVoice}
                disabled={isBotSpeaking}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500 hover:bg-green-600'} disabled:bg-gray-400 disabled:cursor-not-allowed`}
                aria-label={isRecording ? 'Stop voice session' : 'Start voice session'}
            >
                {isRecording ? <StopIcon className="w-8 h-8 text-white" /> : <MicrophoneIcon className="w-8 h-8 text-white" />}
            </button>
        </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
      {imagePreview && (
        <div className="relative mb-2 w-24">
          <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded" />
          <button
            onClick={() => {
              setImageFile(null);
              setImagePreview(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold"
          >
            &times;
          </button>
        </div>
      )}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400"
        >
          <PaperclipIcon className="w-6 h-6" />
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-grow bg-transparent focus:outline-none resize-none text-gray-800 dark:text-gray-100 px-3"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || (!text.trim() && !imageFile)}
          className="p-2 rounded-full bg-green-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
