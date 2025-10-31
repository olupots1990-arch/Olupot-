
import React, { useState, useEffect, useRef } from 'react';
import { ChatMode } from '../types';
import { BrainIcon, FlashIcon, BoltIcon, ThreeDotsIcon, SearchIcon, ArrowLeftIcon, CloseIcon, BotIcon, MicrophoneIcon } from './icons';

interface HeaderProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onClearChat: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentMode, onModeChange, onClearChat, searchQuery, onSearchChange }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  useEffect(() => {
    if (searchActive) {
      searchInputRef.current?.focus();
    } else {
        onSearchChange('');
    }
  }, [searchActive, onSearchChange]);

  const getModeButtonStyle = (mode: ChatMode) => {
    return currentMode === mode
      ? 'bg-green-500 text-white'
      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500';
  };
  
  const handleClear = () => {
    onClearChat();
    setMenuOpen(false);
  };
  
  const handleSearchExit = () => {
    setSearchActive(false);
  }

  return (
    <div className="flex items-center justify-between p-3 bg-green-600 dark:bg-green-800 text-white shadow-md transition-all duration-300">
      {searchActive ? (
        <div className="flex items-center w-full">
            <button onClick={handleSearchExit} className="p-2 rounded-full hover:bg-white/20"><ArrowLeftIcon className="w-6 h-6"/></button>
            <input 
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search messages..."
                className="w-full bg-transparent focus:outline-none px-3 text-lg"
            />
            {searchQuery && (
                <button onClick={() => onSearchChange('')} className="p-2 rounded-full hover:bg-white/20"><CloseIcon className="w-6 h-6"/></button>
            )}
        </div>
      ) : (
        <>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full mr-3 bg-white/25 flex items-center justify-center">
              <BotIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Restaurant Bot</h1>
              <p className="text-sm text-green-200">Online</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="hidden md:flex items-center space-x-2 p-1 bg-white/20 rounded-full">
              <button
                onClick={() => onModeChange(ChatMode.VOICE)}
                className={`p-2 rounded-full transition-colors duration-200 ${getModeButtonStyle(ChatMode.VOICE)}`}
                title="Voice Mode"
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onModeChange(ChatMode.LOW_LATENCY)}
                className={`p-2 rounded-full transition-colors duration-200 ${getModeButtonStyle(ChatMode.LOW_LATENCY)}`}
                title="Low Latency Mode"
              >
                <BoltIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onModeChange(ChatMode.STANDARD)}
                className={`p-2 rounded-full transition-colors duration-200 ${getModeButtonStyle(ChatMode.STANDARD)}`}
                title="Standard Mode"
              >
                <FlashIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onModeChange(ChatMode.THINKING)}
                className={`p-2 rounded-full transition-colors duration-200 ${getModeButtonStyle(ChatMode.THINKING)}`}
                title="Thinking Mode"
              >
                <BrainIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setSearchActive(true)}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/20"
                title="Search"
              >
                <SearchIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/20"
                title="More options"
              >
                <ThreeDotsIcon className="w-6 h-6" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10">
                   <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-600">Change Mode</div>
                  <button onClick={() => { onModeChange(ChatMode.VOICE); setMenuOpen(false); }} className="block w-full text-left md:hidden px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Voice Mode</button>
                  <button onClick={() => { onModeChange(ChatMode.LOW_LATENCY); setMenuOpen(false); }} className="block w-full text-left md:hidden px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Low Latency</button>
                  <button onClick={() => { onModeChange(ChatMode.STANDARD); setMenuOpen(false); }} className="block w-full text-left md:hidden px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Standard</button>
                  <button onClick={() => { onModeChange(ChatMode.THINKING); setMenuOpen(false); }} className="block w-full text-left md:hidden px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">Thinking</button>
                   <div className="border-t my-1 dark:border-gray-600"></div>
                  <button
                    onClick={handleClear}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Clear Chat
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Header;