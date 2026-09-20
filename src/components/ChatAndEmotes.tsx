import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserAccount } from '../types';
import { StorageService } from '../services/storage';
import { soundManager } from '../services/sound';
import { Send, Smile, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';

interface ChatAndEmotesProps {
  currentUser: UserAccount;
  onSendEmote: (emote: string) => void;
  roomCode?: string;
  isDuelMode?: boolean;
}

export const EMOTE_LIST = ['🐍', '🔥', '💀', '👑', '😎', '😭', '⚡', '🍕', '🏆', '👀', '😡', '💖', '👋', '🎉'];

export const ChatAndEmotes: React.FC<ChatAndEmotesProps> = ({
  currentUser,
  onSendEmote,
  roomCode,
  isDuelMode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmotes, setShowEmotes] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(StorageService.getGlobalChat());
    const interval = setInterval(() => {
      setMessages(StorageService.getGlobalChat());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    soundManager.playClick();
    const updated = StorageService.sendGlobalChatMessage(currentUser.username, inputText);
    setMessages(updated);
    setInputText('');
  };

  const handleSelectEmote = (emote: string) => {
    soundManager.playClick();
    onSendEmote(emote);
    StorageService.sendGlobalChatMessage(currentUser.username, emote, emote);
    setMessages(StorageService.getGlobalChat());
    setShowEmotes(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-zinc-900 border-2 border-zinc-800 rounded-none overflow-hidden font-mono shadow-xl">
      {/* Top Bar / Expand toggle */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-950 border-b-2 border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-zinc-200">
            {isDuelMode && roomCode ? `Kênh Trò Chuyện Phòng [${roomCode}]` : 'Kênh Trò Chuyện Toàn Server'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowEmotes(!showEmotes)}
            className="px-2 py-1 rounded-none text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 transition-colors border border-zinc-700"
          >
            <Smile className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Emotes</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-none text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Emotes quick selector bar */}
      {showEmotes && (
        <div className="p-2.5 bg-zinc-950 border-b-2 border-zinc-800 flex flex-wrap gap-2 justify-center">
          {EMOTE_LIST.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => handleSelectEmote(em)}
              className="text-2xl p-1 rounded-none hover:bg-zinc-800 transition-colors"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Quick Emote Row always accessible in match */}
      <div className="px-3 py-1.5 bg-zinc-950 border-b-2 border-zinc-800 flex items-center justify-between gap-1 overflow-x-auto">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider hidden sm:inline">Bắn Emote:</span>
        <div className="flex items-center gap-1">
          {['🐍', '🔥', '👑', '💀', '😎', '⚡', '🏆'].map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => handleSelectEmote(em)}
              className="text-lg p-1 hover:bg-zinc-800 rounded-none transition-colors"
              title={`Bắn biểu cảm ${em}`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Chat Messages History */}
      {isExpanded && (
        <div ref={scrollRef} className="h-44 overflow-y-auto p-3 space-y-2 text-xs bg-zinc-950">
          {messages.map((msg) => (
            <div key={msg.id} className="leading-tight">
              {msg.type === 'system' ? (
                <div className="text-zinc-500 italic bg-zinc-900/50 p-1 rounded-none border border-zinc-800 text-[11px]">
                  [Hệ thống] {msg.text}
                </div>
              ) : (
                <div className="flex items-start gap-1.5">
                  <span
                    className={`font-bold shrink-0 ${
                      msg.senderName === currentUser.username
                        ? 'text-emerald-400'
                        : msg.senderName === 'Gdreed'
                        ? 'text-amber-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {msg.senderName}:
                  </span>
                  <span className="text-zinc-200 break-words">{msg.text}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat input bar */}
      <form onSubmit={handleSendMessage} className="p-2 bg-zinc-950 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Nhập tin nhắn giao lưu..."
          className="flex-1 px-3 py-1.5 bg-zinc-900 border-2 border-zinc-800 rounded-none text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-none border border-emerald-500 text-xs transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
