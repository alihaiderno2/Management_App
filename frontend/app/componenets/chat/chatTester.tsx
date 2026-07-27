'use client';

import React, { useEffect, useState } from 'react';
import { useChatStore } from '@/store/chat-store';

export function ChatTester() {
  const { 
    isConnected, connectSocket, disconnectSocket, 
    fetchRooms, rooms, 
    setActiveRoom, activeRoomId, 
    messages, sendMessage 
  } = useChatStore();

  const [input, setInput] = useState('');

  // Auto-connect on mount
  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, [connectSocket, disconnectSocket]);

  return (
    <div className="fixed bottom-4 right-4 w-[400px] h-[500px] bg-black text-green-400 font-mono text-xs p-4 rounded-lg overflow-y-auto z-50 border border-green-500 shadow-2xl opacity-95">
      <h3 className="font-bold text-white mb-2 border-b border-green-800 pb-1">
        WebSocket Status: {isConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}
      </h3>

      <div className="flex gap-2 mb-4">
        <button onClick={fetchRooms} className="bg-green-900 text-white px-2 py-1 rounded">1. Fetch Rooms</button>
      </div>

      <div className="mb-4">
        <h4 className="font-bold text-white">2. Available Rooms:</h4>
        {rooms.length === 0 ? <p className="text-gray-500">No rooms yet. (Create one via DB or API)</p> : null}
        {rooms.map(room => (
          <div key={room.id} className="flex justify-between items-center bg-gray-900 p-1 mb-1 rounded">
            <span>{room.name || room.id.slice(0,8)}</span>
            <button 
              onClick={() => setActiveRoom(room.id)}
              className="bg-blue-800 text-white px-2 py-0.5 rounded"
            >
              Select
            </button>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h4 className="font-bold text-white">
          3. Messages {activeRoomId ? `(Room: ${activeRoomId.slice(0,6)}...)` : '(Select a room)'}
        </h4>
        <div className="h-32 bg-gray-900 p-2 overflow-y-auto mb-2 flex flex-col gap-1">
          {messages.map(msg => (
            <div key={msg.id}>
              <span className="text-blue-400">[{msg.author?.name || 'User'}]:</span> {msg.body}
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-gray-800 text-white px-2 py-1 rounded outline-none border border-gray-600"
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && activeRoomId) {
                sendMessage(activeRoomId, input);
                setInput('');
              }
            }}
          />
          <button 
            onClick={() => {
              if (activeRoomId) {
                sendMessage(activeRoomId, input);
                setInput('');
              }
            }}
            className="bg-green-700 text-white px-3 py-1 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}