import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from './auth-store';

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
}

export interface Message {
  id: string;
  body: string;
  roomId: string;
  authorId: string;
  createdAt: string;
  author: { id: string; name: string; profileImage: string | null };
  reactions?: Reaction[];
}

export interface ChatRoom {
  id: string;
  name: string | null;
  type: 'DIRECT' | 'GROUP' | 'PROJECT';
  participants: any[];
  messages: Message[]; 
}

interface ChatState {
  socket: Socket | null;
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: Message[];
  isConnected: boolean;
  onlineUsers: string[]; 
  
  connectSocket: () => void;
  disconnectSocket: () => void;
  fetchRooms: () => Promise<void>;
  setActiveRoom: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string) => void;
  addMessage: (message: Message) => void;
  toggleReaction: (roomId: string, messageId: string, emoji: string) => void; 
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  rooms: [],
  activeRoomId: null,
  messages: [],
  isConnected: false,
  onlineUsers: [],

  connectSocket: () => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken || get().socket) return;

    const socket = io('http://localhost:3001', {
        auth: { token: accessToken },
    });

    socket.on('connect', () => set({ isConnected: true }));
    socket.on('disconnect', () => set({ isConnected: false, onlineUsers: [] }));
    
    socket.on('online-users-list', (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    socket.on('user-online', ({ userId }: { userId: string }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.includes(userId) 
          ? state.onlineUsers 
          : [...state.onlineUsers, userId]
      }));
    });

    socket.on('user-offline', ({ userId }: { userId: string }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.filter(id => id !== userId)
      }));
    });

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

    socket.on('message-updated', (updatedMessage: Message) => {
      console.log('3. FRONTEND RECEIVED UPDATE:', updatedMessage);
      
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === updatedMessage.id ? updatedMessage : msg
        )
      }));
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, onlineUsers: [] });
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
  
  toggleReaction: (roomId: string, messageId: string, emoji: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('toggle-reaction', { roomId, messageId, emoji });
    }
  },
  
  addMessage: (message: Message) => {
     set((state) => ({ messages: [...state.messages, message] }));
  }
}));