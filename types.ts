export enum MessageAuthor {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

export interface Message {
  id: string;
  author: MessageAuthor;
  text: string;
  image?: string;
  timestamp: string;
  status?: 'sent' | 'delivered';
  orderId?: string;
  cancellable?: boolean;
}

export enum ChatMode {
  STANDARD = 'standard',
  THINKING = 'thinking',
  LOW_LATENCY = 'low-latency',
  VOICE = 'voice',
}

export type AppView = 'home' | 'customer' | 'admin';
export type AdminPanelView = 'dashboard' | 'orders' | 'products' | 'menu' | 'sales' | 'agents' | 'performance' | 'submissions';

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  stock: number;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface DeliveryOrder {
  id: string;
  restaurantName: string;
  items: OrderItem[];
  deliveryAddress: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'out-for-delivery' | 'delivered' | 'cancelled';
  customerName: string;
  phoneNumber: string;
  agentId?: string;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  status: 'available' | 'on-delivery';
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: string;
}
