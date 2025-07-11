import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Booking, Wishlist } from '../../types';
import { Calendar, Users, MapPin, Heart, CreditCard, Clock } from 'lucide-react';
import ProductCard from '../Stripe/ProductCard';
import SubscriptionStatus from '../Stripe/SubscriptionStatus';
import { products } from '../../stripe-config';
import { useStripe } from '../../hooks/useStripe';

export default function GuestDashboard() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings' | 'wishlist' | 'products'>('browse');
  const { createCheckoutSession } = useStripe();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch approved packages
      const { data: packagesData } = await supabase
        .from('packages')
        .select('*, host:users(*)')
        .eq('status', 'approved');

      // Fetch user's bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, package:packages(*)')
        .eq('guest_id', user?.id);

      // Fetch user's wishlist
      const { data: wishlistData } = await supabase
        .from('wishlist')
        .select('*, package:packages(*)')
        .eq('guest_id', user?.id);

      setPackages(packagesData || []);
      setBookings(bookingsData || []);
      setWishlist(wishlistData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (packageId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({
          guest_id: user?.id,
          package_id: packageId,
        });

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const removeFromWishlist = async (packageId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('guest_id', user?.id)
        .eq('package_id', packageId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const bookPackage = async (pkg: Package, peopleCount: number, durationDays: number) => {
    try {
      const totalAmount = pkg.price * peopleCount * durationDays;
      
      const { error } = await supabase
        .from('bookings')
        .insert({
          guest_id: user?.id,
          package_id: pkg.id,
          people_count: peopleCount,
          duration_days: durationDays,
          total_amount: totalAmount,
          booking_date: new Date().toISOString(),
          status: 'pending',
          payment_status: 'pending',
        });

      if (error) throw error;
      fetchData();
      alert('Booking created successfully! Please proceed with payment.');
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const isInWishlist = (packageId: string) => {
    return wishlist.some(item => item.package_id === packageId);
  };

  const handlePurchase = async (product: any) => {
    try {
      await createCheckoutSession(product);
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  if (loading) {
    return (
      <Layout title="Guest Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Guest Dashboard">
      <div className="space-y-6">
        {/* Subscription Status */}
        <SubscriptionStatus />

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'browse', label: 'Browse Adventures', count: packages.length },
              { key: 'products', label: 'Products', count: products.length },
              { key: 'bookings', label: 'My Bookings', count: bookings.length },
              { key: 'wishlist', label: 'Wishlist', count: wishlist.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Browse Adventures */}
        {activeTab === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                isInWishlist={isInWishlist(pkg.id)}
                onAddToWishlist={() => addToWishlist(pkg.id)}
                onRemoveFromWishlist={() => removeFromWishlist(pkg.id)}
                onBook={bookPackage}
              />
            ))}
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}

        {/* My Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
            {bookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
                <p className="mt-1 text-sm text-gray-500">Start exploring adventures to make your first booking!</p>
              </div>
            )}
          </div>
        )}

        {/* Wishlist */}
        {activeTab === 'wishlist' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <PackageCard
                key={item.id}
                package={item.package!}
                isInWishlist={true}
                onAddToWishlist={() => {}}
                onRemoveFromWishlist={() => removeFromWishlist(item.package_id)}
                onBook={bookPackage}
              />
            ))}
            {wishlist.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Heart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No items in wishlist</h3>
                <p className="mt-1 text-sm text-gray-500">Save adventures you're interested in for later!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function PackageCard({ 
  package: pkg, 
  isInWishlist, 
  onAddToWishlist, 
  onRemoveFromWishlist, 
  onBook 
}: {
  package: Package;
  isInWishlist: boolean;
  onAddToWishlist: () => void;
  onRemoveFromWishlist: () => void;
  onBook: (pkg: Package, peopleCount: number, durationDays: number) => void;
}) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [peopleCount, setPeopleCount] = useState(1);
  const [durationDays, setDurationDays] = useState(1);

  const handleBook = () => {
    onBook(pkg, peopleCount, durationDays);
    setShowBookingForm(false);
  };

  return (
    <div className="card">
      <div className="aspect-w-16 aspect-h-9 mb-4">
        <img
          src={pkg.images[0] || 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg'}
          alt={pkg.name}
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>
      
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
          <p className="text-sm text-gray-600">{pkg.description}</p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {pkg.location}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Max {pkg.max_people}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {pkg.duration_days} days
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600">₹{pkg.price}</span>
          <span className="text-sm text-gray-500">per person/day</span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowBookingForm(true)}
            className="flex-1 btn-primary"
          >
            Book Now
          </button>
          <button
            onClick={isInWishlist ? onRemoveFromWishlist : onAddToWishlist}
            className={`p-2 rounded-lg border ${
              isInWishlist 
                ? 'bg-red-50 border-red-200 text-red-600' 
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
      
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Book {pkg.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of People
                </label>
                <input
                  type="number"
                  min="1"
                  max={pkg.max_people}
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Price per person/day:</span>
                  <span>₹{pkg.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>People:</span>
                  <span>{peopleCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Days:</span>
                  <span>{durationDays}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{pkg.price * peopleCount * durationDays}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowBookingForm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                className="flex-1 btn-primary"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{booking.package?.name}</h3>
          <p className="text-sm text-gray-600">Booking ID: {booking.id.slice(0, 8)}</p>
        </div>
        <div className="text-right">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">People:</span>
          <span className="ml-2 font-medium">{booking.people_count}</span>
        </div>
        <div>
          <span className="text-gray-500">Duration:</span>
          <span className="ml-2 font-medium">{booking.duration_days} days</span>
        </div>
        <div>
          <span className="text-gray-500">Total Amount:</span>
          <span className="ml-2 font-medium">₹{booking.total_amount}</span>
        </div>
        <div>
          <span className="text-gray-500">Payment:</span>
          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
            {booking.payment_status}
          </span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">
          Booked on {new Date(booking.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}