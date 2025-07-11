import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { supabase } from '../../lib/supabase';
import { Package, Booking, User } from '../../types';
import { Check, X, Eye, Users, Calendar, Package as PackageIcon, Shield } from 'lucide-react';
import ProductCard from '../Stripe/ProductCard';
import SubscriptionStatus from '../Stripe/SubscriptionStatus';
import { products } from '../../stripe-config';
import { useStripe } from '../../hooks/useStripe';

export default function SuperAdminDashboard() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'packages' | 'bookings' | 'users' | 'products'>('pending');
  const { createCheckoutSession } = useStripe();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all packages with host info
      const { data: packagesData } = await supabase
        .from('packages')
        .select('*, host:users(*)')
        .order('created_at', { ascending: false });

      // Fetch all bookings with package and guest info
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, package:packages(*), guest:users(*)')
        .order('created_at', { ascending: false });

      // Fetch all users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      setPackages(packagesData || []);
      setBookings(bookingsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePackageStatus = async (packageId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status })
        .eq('id', packageId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating package status:', error);
    }
  };

  const getOverallStats = () => {
    const totalUsers = users.length;
    const totalHosts = users.filter(u => u.role === 'host').length;
    const totalGuests = users.filter(u => u.role === 'guest').length;
    const totalPackages = packages.length;
    const pendingPackages = packages.filter(p => p.status === 'pending').length;
    const approvedPackages = packages.filter(p => p.status === 'approved').length;
    const totalBookings = bookings.length;
    const totalRevenue = bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + b.total_amount, 0);

    return {
      totalUsers,
      totalHosts,
      totalGuests,
      totalPackages,
      pendingPackages,
      approvedPackages,
      totalBookings,
      totalRevenue,
    };
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
      <Layout title="Super Admin Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  const stats = getOverallStats();
  const pendingPackages = packages.filter(p => p.status === 'pending');

  return (
    <Layout title="Super Admin Dashboard">
      <div className="space-y-6">
        {/* Subscription Status */}
        <SubscriptionStatus />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500">{stats.totalHosts} hosts, {stats.totalGuests} guests</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <PackageIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Packages</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPackages}</p>
                <p className="text-xs text-gray-500">{stats.approvedPackages} approved</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">₹{stats.totalRevenue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Alert */}
        {pendingPackages.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Pending Approvals
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You have {pendingPackages.length} package(s) waiting for approval.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'pending', label: 'Pending Approvals', count: pendingPackages.length },
              { key: 'packages', label: 'All Packages', count: packages.length },
              { key: 'products', label: 'Products', count: products.length },
              { key: 'bookings', label: 'All Bookings', count: bookings.length },
              { key: 'users', label: 'Users', count: users.length },
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

        {/* Pending Approvals */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingPackages.map((pkg) => (
              <PendingPackageCard
                key={pkg.id}
                package={pkg}
                onApprove={() => updatePackageStatus(pkg.id, 'approved')}
                onReject={() => updatePackageStatus(pkg.id, 'rejected')}
              />
            ))}
            {pendingPackages.length === 0 && (
              <div className="text-center py-12">
                <Check className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
                <p className="mt-1 text-sm text-gray-500">No packages pending approval.</p>
              </div>
            )}
          </div>
        )}

        {/* All Packages */}
        {activeTab === 'packages' && (
          <div className="space-y-4">
            {packages.map((pkg) => (
              <PackageOverviewCard key={pkg.id} package={pkg} />
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

        {/* All Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingOverviewCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function PendingPackageCard({ 
  package: pkg, 
  onApprove, 
  onReject 
}: { 
  package: Package; 
  onApprove: () => void; 
  onReject: () => void; 
}) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Host: {pkg.host?.full_name}</span>
            <span>₹{pkg.price}/person/day</span>
            <span>Max {pkg.max_people} people</span>
            <span>{pkg.location}</span>
          </div>
        </div>
        <div className="ml-4">
          <img
            src={pkg.images[0] || 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg'}
            alt={pkg.name}
            className="w-24 h-24 object-cover rounded-lg"
          />
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={onApprove}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
        >
          <Check className="h-4 w-4" />
          <span>Approve</span>
        </button>
        <button
          onClick={onReject}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
        >
          <X className="h-4 w-4" />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
}

function PackageOverviewCard({ package: pkg }: { package: Package }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pkg.status)}`}>
              {pkg.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Host: {pkg.host?.full_name}</span>
            <span>₹{pkg.price}/person/day</span>
            <span>Max {pkg.max_people} people</span>
            <span>{pkg.location}</span>
          </div>
        </div>
        <div className="ml-4">
          <img
            src={pkg.images[0] || 'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg'}
            alt={pkg.name}
            className="w-24 h-24 object-cover rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

function BookingOverviewCard({ booking }: { booking: Booking }) {
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
          <p className="text-sm text-gray-600">Guest: {booking.guest?.full_name}</p>
          <p className="text-xs text-gray-500">Booking ID: {booking.id.slice(0, 8)}</p>
        </div>
        <div className="text-right space-y-1">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
          <br />
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
            {booking.payment_status}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 text-sm">
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
          <span className="text-gray-500">Date:</span>
          <span className="ml-2 font-medium">{new Date(booking.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: User }) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-800';
      case 'host': return 'bg-blue-100 text-blue-800';
      case 'guest': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
          <p className="text-xs text-gray-500">Joined {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(user.role)}`}>
          {user.role}
        </span>
      </div>
    </div>
  );
}