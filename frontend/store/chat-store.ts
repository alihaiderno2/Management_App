import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from './auth-store';

export interface Message {
  id: string;
  body: string;
  roomId: string;
  authorId: string;
  createdAt: string;
  author: { id: string; name: string; profileImage: string | null };
}

export interface ChatRoom {
  id: string;
  name: string | null;
  type: 'DIRECT' | 'GROUP';
  participants: any[];
  messages: Message[]; 
}

interface ChatState {
  socket: Socket | null;
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: Message[];
  isConnected: boolean;
  
  connectSocket: () => void;
  disconnectSocket: () => void;
  fetchRooms: () => Promise<void>;
  setActiveRoom: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string) => void;
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  rooms: [],
  activeRoomId: null,
  messages: [],
  isConnected: false,

  connectSocket: () => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken || get().socket) return;

    const socket = io('http://localhost:3001', {
        auth: { token: accessToken },
        });

    socket.on('connect', () => set({ isConnected: true }));
    socket.on('disconnect', () => set({ isConnected: false }));

    socket.on('new-message', (message: Message) => {
      const { activeRoomId, messages, rooms } = get();
      
      if (message.roomId === activeRoomId) {
        set({ messages: [...messages, message] });
      }

      const updatedRooms = rooms.map(room => 
        room.id === message.roomId 
          ? { ...room, messages: [message] } 
          : room
      );
      set({ rooms: updatedRooms });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  fetchRooms: async () => {
    const { accessToken } = useAuthStore.getState();
    try {
      const res = await apiClient.get('/chat/rooms', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      set({ rooms: res.data });
    } catch (error) {
      console.error('Failed to fetch chat rooms', error);
    }
  },

  setActiveRoom: async (roomId: string) => {
    const { accessToken } = useAuthStore.getState();
    set({ activeRoomId: roomId, messages: [] });

    try {
      const res = await apiClient.get(`/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      set({ messages: res.data });
    } catch (error) {
      console.error('Failed to fetch room messages', error);
    }
  },

  sendMessage: (roomId: string, content: string) => {
    const { socket } = get();
    if (socket && content.trim()) {
      socket.emit('send-message', { roomId, content });
    }
  },
  
  addMessage: (message: Message) => {
     set((state) => ({ messages: [...state.messages, message] }));
  }
}));