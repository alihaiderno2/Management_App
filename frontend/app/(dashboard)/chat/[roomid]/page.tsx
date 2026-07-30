'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Avatar } from '@/app/componenets/ui/Avatar';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { Badge } from '@/app/componenets/ui/Badge';

const QUICK_EMOJIS = ['😀', '😂', '❤️', '👍', '🔥', '🎉', '👀', '🙌', '✨', '💯', '🚀', '✅'];

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params.roomid as string;

  const { messages, setActiveRoom, sendMessage, rooms, onlineUsers} = useChatStore();
  const { user } = useAuthStore();

  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);

  useEffect(() => {
    if (roomId) {
      setActiveRoom(roomId);
    }
  }, [roomId, setActiveRoom]);

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessageCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessage(roomId, messageText);
    setMessageText('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    sendMessage(roomId, emoji);
    setShowEmojiPicker(false);
  };

  const currentRoom = rooms.find(r => r.id === roomId);
  let roomName = currentRoom?.name || 'Loading...';
  let isDirectOnline = false; 

  if (currentRoom?.type === 'DIRECT') {
    const otherParticipant = currentRoom.participants?.find((p: any) => p.userId !== user?.id);
    if (otherParticipant?.user?.name) {
      roomName = otherParticipant.user.name;
      isDirectOnline = onlineUsers.includes(otherParticipant.user.id); 
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] bg-white border border-[#E4E4E1] rounded-2xl overflow-hidden shadow-sm">

      <div className="h-16 flex items-center px-6 border-b border-[#E4E4E1] justify-between flex-shrink-0 bg-white shadow-sm z-10">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-[#1B1D1F] text-lg truncate">
            {currentRoom?.type === 'GROUP' ? <span className="text-[#9A9CA3] font-light mr-1">#</span> : null}
            {roomName}
          </h3>
          {currentRoom?.type === 'DIRECT' && (
            <Badge variant={isDirectOnline ? 'accent' : 'default'}>
              {isDirectOnline ? 'Online' : 'Offline'}
            </Badge>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
        {messages.map((msg) => {
          const groupedReactions = msg.reactions?.reduce((acc, rx) => {
            if (!acc[rx.emoji]) acc[rx.emoji] = [];
            acc[rx.emoji].push(rx);
            return acc;
          }, {} as Record<string, typeof msg.reactions>) || {};

          return (
            <div key={msg.id} className="flex gap-4 group relative hover:bg-[#F9FAFB] -mx-4 px-4 py-2 rounded-xl transition-colors">
              <div className="flex-shrink-0 mt-1">
                <Avatar name={msg.author?.name || 'Unknown'} size="sm" userId={msg.authorId} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold text-[#1B1D1F] text-base">{msg.author?.name}</span>
                  <span className="text-xs font-medium text-[#9A9CA3]">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className={`text-[#1B1D1F] leading-relaxed whitespace-pre-wrap mb-1 ${
                  QUICK_EMOJIS.includes(msg.body.trim()) && msg.body.trim().length <= 2 
                    ? 'text-4xl py-1' 
                    : 'text-[15px]'
                }`}>
                  {msg.body}
                </div>

                {/* Render the Reaction Badges */}
                {Object.keys(groupedReactions).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {Object.entries(groupedReactions).map(([emoji, reactions]) => {
                      const hasMyReaction = reactions.some(r => r.userId === user?.id);

                      return (
                        <button
                          key={emoji}
                          onClick={() => useChatStore.getState().toggleReaction(roomId, msg.id, emoji)}
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                            hasMyReaction 
                              ? 'bg-[#EAF5F3] border-[#0F7B6C] text-[#0F7B6C]' 
                              : 'bg-[#F9FAFB] border-[#E4E4E1] text-[#6B6F76] hover:bg-[#F5F5F4]'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{reactions.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="absolute top-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-[#E4E4E1] shadow-sm rounded-lg flex items-center overflow-hidden">
                <button 
                  className="p-1.5 text-[#6B6F76] hover:bg-[#F5F5F4] hover:text-[#1B1D1F] transition-colors" 
                  title="Like"
                  onClick={() => useChatStore.getState().toggleReaction(roomId, msg.id, '👍')}
                >
                  <span className="text-sm leading-none">👍</span>
                </button>
                <div className="w-[1px] h-4 bg-[#E4E4E1]"></div>
                <button 
                  className="p-1.5 text-[#6B6F76] hover:bg-[#F5F5F4] hover:text-[#1B1D1F] transition-colors" 
                  title="Fire"
                  onClick={() => useChatStore.getState().toggleReaction(roomId, msg.id, '🔥')}
                >
                  <span className="text-sm leading-none">🔥</span>
                </button>
                <button 
                  className="p-1.5 text-[#6B6F76] hover:bg-[#F5F5F4] hover:text-[#1B1D1F] transition-colors" 
                  title="Laugh"
                  onClick={() => useChatStore.getState().toggleReaction(roomId, msg.id, '😂')}
                >
                  <span className="text-sm leading-none">😂</span>
                </button>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-[#E4E4E1] relative">

        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-[88px] left-6 bg-white border border-[#E4E4E1] shadow-lg rounded-xl p-3 w-64 z-20">
            <div className="text-xs font-bold text-[#9A9CA3] uppercase tracking-wider mb-2">Quick Send</div>
            <div className="grid grid-cols-6 gap-2">
              {QUICK_EMOJIS.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-xl hover:bg-[#F5F5F4] p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border border-[#E4E4E1] rounded-xl overflow-hidden focus-within:border-[#0F7B6C] focus-within:ring-1 focus-within:ring-[#0F7B6C] transition-all bg-[#F9FAFB]">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Message ${roomName}`}
            className="w-full max-h-40 min-h-[44px] p-3 bg-transparent resize-none focus:outline-none text-[15px] text-[#1B1D1F]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          <div className="flex items-center justify-between px-2 pb-2 bg-[#F9FAFB]">
            <div className="flex gap-1 text-[#6B6F76]">
              <button className="p-1.5 hover:bg-[#E4E4E1] hover:text-[#1B1D1F] rounded-md transition-colors" title="Attach file">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-1.5 rounded-md transition-colors ${showEmojiPicker ? 'bg-[#E4E4E1] text-[#1B1D1F]' : 'hover:bg-[#E4E4E1] hover:text-[#1B1D1F]'}`} 
                title="Quick Emoji"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
              </button>
            </div>
            
            <button 
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className="p-1.5 px-3 bg-[#0F7B6C] text-white rounded-md hover:bg-[#0B5C51] transition-colors disabled:opacity-50 disabled:bg-gray-300 flex items-center gap-2 font-medium"
            >
              <span className="text-sm hidden sm:inline">Send</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
        <div className="text-center mt-2">
          <span className="text-[11px] text-[#9A9CA3]">
            <strong>Return</strong> to send, <strong>Shift + Return</strong> to add a new line
          </span>
        </div>
      </div>
    </div>
  );
}