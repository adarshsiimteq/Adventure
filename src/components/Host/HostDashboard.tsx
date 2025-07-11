import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Booking } from '../../types';
import { Plus, Edit, Eye, Users, Calendar, DollarSign } from 'lucide-react';
import ProductCard from '../Stripe/ProductCard';
import SubscriptionStatus from '../Stripe/SubscriptionStatus';
import { products } from '../../stripe-config';
import { useStripe } from '../../hooks/useStripe';

export default function HostDashboard() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'bookings' | 'analytics' | 'products'>('packages');
  const [showPackageForm, setShowPackageForm] = useState(false);
  const { createCheckoutSession } = useStripe();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch host's packages
      const { data: packagesData } = await supabase
        .from('packages')
        .select('*')
        .eq('host_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch bookings for host's packages
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, package:packages(*), guest:users(*)')
        .in('package_id', packagesData?.map(p => p.id) || []);

      setPackages(packagesData || []);
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStats = () => {
    const stats = packages.reduce((acc, pkg) => {
      acc[pkg.status] = (acc[pkg.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      draft: stats.draft || 0,
      pending: stats.pending || 0,
      approved: stats.approved || 0,
      rejected: stats.rejected || 0,
    };
  };

  const getBookingStats = () => {
    const totalRevenue = bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + b.total_amount, 0);
    
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    
    return { totalRevenue, totalBookings, confirmedBookings };
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
      <Layout title="Host Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  const statusStats = getStatusStats();
  const bookingStats = getBookingStats();

  return (
    <Layout title="Host Dashboard">
      <div className="space-y-6">
        {/* Subscription Status */}
        <SubscriptionStatus />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Packages</p>
                <p className="text-2xl font-semibold text-gray-900">{packages.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{bookingStats.totalBookings}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-semibold text-gray-900">{bookingStats.confirmedBookings}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">₹{bookingStats.totalRevenue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'packages', label: 'My Packages' },
              { key: 'products', label: 'Products' },
              { key: 'bookings', label: 'Bookings' },
              { key: 'analytics', label: 'Analytics' },
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
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">My Adventure Packages</h2>
              <button
                onClick={() => setShowPackageForm(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Package</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} package={pkg} onUpdate={fetchData} />
              ))}
            </div>
            
            {packages.length === 0 && (
              <div className="text-center py-12">
                <Plus className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No packages yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first adventure package.</p>
              </div>
            )}
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

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} onUpdate={fetchData} />
            ))}
            {bookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
                <p className="mt-1 text-sm text-gray-500">Bookings will appear here once guests start booking your packages.</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Draft</span>
                    <span className="font-medium">{statusStats.draft}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Approval</span>
                    <span className="font-medium">{statusStats.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved</span>
                    <span className="font-medium text-green-600">{statusStats.approved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rejected</span>
                    <span className="font-medium text-red-600">{statusStats.rejected}</span>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-medium">₹{bookingStats.totalRevenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average per Booking</span>
                    <span className="font-medium">
                      ₹{bookingStats.totalBookings > 0 ? Math.round(bookingStats.totalRevenue / bookingStats.totalBookings) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPackageForm && (
        <PackageForm
          onClose={() => setShowPackageForm(false)}
          onSuccess={() => {
            setShowPackageForm(false);
            fetchData();
          }}
        />
      )}
    </Layout>
  );
}

function PackageCard({ package: pkg, onUpdate }: { package: Package; onUpdate: () => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const submitForApproval = async () => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status: 'pending' })
        .eq('id', pkg.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error submitting for approval:', error);
    }
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
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pkg.status)}`}>
            {pkg.status}
          </span>
        </div>
        
        <p className="text-sm text-gray-600">{pkg.description}</p>
        
        <div className="flex justify-between text-sm text-gray-500">
          <span>₹{pkg.price}/person/day</span>
          <span>Max {pkg.max_people} people</span>
        </div>
        
        <div className="flex space-x-2">
          {pkg.status === 'draft' && (
            <button
              onClick={submitForApproval}
              className="flex-1 btn-primary text-sm"
            >
              Submit for Approval
            </button>
          )}
          <button className="flex-1 btn-secondary text-sm flex items-center justify-center space-x-1">
            <Edit className="h-3 w-3" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onUpdate }: { booking: Booking; onUpdate: () => void }) {
  const updateBookingStatus = async (status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', booking.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{booking.package?.name}</h3>
          <p className="text-sm text-gray-600">Guest: {booking.guest?.full_name}</p>
          <p className="text-xs text-gray-500">Booking ID: {booking.id.slice(0, 8)}</p>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
          {booking.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <span className="text-gray-500">People:</span>
          <span className="ml-2 font-medium">{booking.people_count}</span>
        </div>
        <div>
          <span className="text-gray-500">Duration:</span>
          <span className="ml-2 font-medium">{booking.duration_days} days</span>
        </div>
        <div>
          <span className="text-gray-500">Amount:</span>
          <span className="ml-2 font-medium">₹{booking.total_amount}</span>
        </div>
        <div>
          <span className="text-gray-500">Payment:</span>
          <span className="ml-2 font-medium">{booking.payment_status}</span>
        </div>
      </div>
      
      {booking.status === 'pending' && (
        <div className="flex space-x-2">
          <button
            onClick={() => updateBookingStatus('confirmed')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg"
          >
            Confirm
          </button>
          <button
            onClick={() => updateBookingStatus('cancelled')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function PackageForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    max_people: '',
    duration_days: '',
    location: '',
    images: ['https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg'],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('packages')
        .insert({
          host_id: user?.id,
          name: formData.name,
          description: formData.description,
          price: parseInt(formData.price),
          max_people: parseInt(formData.max_people),
          duration_days: parseInt(formData.duration_days),
          location: formData.location,
          images: formData.images,
          status: 'draft',
        });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error creating package:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6">Create New Package</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹ per person/day)
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max People
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.max_people}
                onChange={(e) => setFormData({ ...formData, max_people: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? 'Creating...' : 'Create Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}