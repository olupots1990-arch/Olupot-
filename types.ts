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
  orderSummaryForShare?: string;
  needsConfirmation?: boolean;
  isVoice?: boolean;
  audioUrl?: string;
}

export enum ChatMode {
  STANDARD = 'standard',
  THINKING = 'thinking',
  LOW_LATENCY = 'low-latency',
  VOICE = 'voice',
}

export type AppView = 'home' | 'admin';
export type AdminPanelView = 'dashboard' | 'orders' | 'products' | 'menu' | 'sales' | 'agents' | 'performance' | 'submissions' | 'tasks' | 'attendance' | 'payroll' | 'expenses' | 'settings' | 'inventory' | 'leave';

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
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
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
  attendanceStatus?: 'clocked-in' | 'clocked-out';
  hourlyRate: number;
}

export interface FaqItem {
  id:string;
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

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  agentId: string;
  agentName: string;
  clockInTime: string;
  clockOutTime: string | null;
  status: 'clocked-in' | 'clocked-out';
  clockInPhoto?: string;
  clockOutPhoto?: string;
}

export interface PayrollRecord {
    id: string;
    agentId: string;
    agentName: string;
    periodStart: string;
    periodEnd: string;
    hoursWorked: number;
    hourlyRate: number;
    totalPay: number;
    status: 'pending' | 'paid';
    paidAt: string | null;
}

export type ExpenseCategory = 'Supplies' | 'Rent' | 'Utilities' | 'Marketing' | 'Other';

export interface ExpenseRecord {
    id: string;
    date: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
}

export interface AudioPlayerState {
  messageId: string | null;
  audioUrl: string | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error: string | null;
  isTransient?: boolean;
}

export type StockRecordType = 'stock-in' | 'sale' | 'adjustment';

export interface StockRecord {
    id: string;
    productId: string;
    productName: string;
    type: StockRecordType;
    quantityChange: number;
    newStockLevel: number;
    timestamp: string;
    orderId?: string;
    note?: string;
}

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  agentId: string;
  agentName: string;
  startDate: string; // ISO date string e.g., '2024-08-15'
  endDate: string;   // ISO date string e.g., '2024-08-17'
  reason: string;
  status: LeaveRequestStatus;
  requestedAt: string; // ISO datetime string
}


export type InitialAction = {
  type: 'approve';
  orderId: string;
} | null;