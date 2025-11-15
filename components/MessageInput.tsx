import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, PaperclipIcon, MicrophoneIcon, StopIcon, SpeakerIcon, TrashIcon } from './icons';
import { ChatMode } from '../types';

interface MessageInputProps {
  onSendMessage: (text: string, imageFile: File | null) => void;
  onSendVoiceMessage: (audioBlob: Blob) => void;
  isLoading: boolean;
  chatMode?: ChatMode;
  isRecording?: boolean;
  onStartVoice?: () => void;
  onStopVoice?: () => void;
  isBotSpeaking?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  onSendVoiceMessage,
  isLoading, 
  chatMode, 
  isRecording: isLiveRecording, // Renaming to avoid conflict
  onStartVoice, 
  onStopVoice,
  isBotSpeaking,
}) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSendVoiceMessage(audioBlob);
        // Clean up stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not start recording. Please ensure microphone permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };
  
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        // Stop without triggering onstop's sending logic
        mediaRecorderRef.current.onstop = () => {
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
        }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
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
                onClick={isLiveRecording ? onStopVoice : onStartVoice}
                disabled={isBotSpeaking}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isLiveRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500 hover:bg-green-600'} disabled:bg-gray-400 disabled:cursor-not-allowed`}
                aria-label={isLiveRecording ? 'Stop voice session' : 'Start voice session'}
            >
                {isLiveRecording ? <StopIcon className="w-8 h-8 text-white" /> : <MicrophoneIcon className="w-8 h-8 text-white" />}
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
        {isRecording ? (
          <div className="flex-grow flex items-center px-3">
             <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
             <span className="ml-2 font-mono text-sm text-gray-700 dark:text-gray-200">{formatTime(recordingTime)}</span>
             <div className="flex-grow text-center text-sm text-gray-500 dark:text-gray-400">Recording...</div>
             <button onClick={cancelRecording} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                <TrashIcon className="w-5 h-5" />
             </button>
          </div>
        ) : (
          <>
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
          </>
        )}
        
        <button
          onClick={text.trim() || imageFile ? handleSend : (isRecording ? stopRecording : startRecording)}
          disabled={isLoading || (!text.trim() && !imageFile && !isRecording)}
          className="p-2 rounded-full bg-green-500 text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {text.trim() || imageFile ? (
            <SendIcon className="w-6 h-6" />
          ) : isRecording ? (
            <SendIcon className="w-6 h-6" />
          ) : (
            <MicrophoneIcon className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;