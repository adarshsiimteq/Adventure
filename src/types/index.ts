import type { User } from '@/types';

const testUser: User = {
  id: '1',
  email: 'test@example.com',
  role: 'guest',
  full_name: 'Test User',
  created_at: new Date().toISOString(),
};
export type Package = {
  id: string;
  host_id: string;
  name: string;
  description: string;
  price: number;
  max_people: number;
  duration_days: number;
  location: string;
  images: string[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  host?: User;
};

export type Booking = {
  id: string;
  guest_id: string;
  package_id: string;
  people_count: number;
  duration_days: number;
  total_amount: number;
  booking_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  package?: Package;
  guest?: User;
};

export type Wishlist = {
  id: string;
  guest_id: string;
  package_id: string;
  created_at: string;
  package?: Package;
};