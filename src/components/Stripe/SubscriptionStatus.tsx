import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { products } from '../../stripe-config';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
}

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <div className="card">
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-600">Subscription Status</p>
            <p className="text-gray-900">No active subscription</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'past_due':
      case 'unpaid':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'canceled':
      case 'incomplete_expired':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'past_due':
      case 'unpaid':
        return 'text-yellow-600';
      case 'canceled':
      case 'incomplete_expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProductName = (priceId: string | null) => {
    if (!priceId) return 'Unknown Plan';
    const product = products.find(p => p.priceId === priceId);
    return product?.name || 'Unknown Plan';
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="card">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon(subscription.subscription_status)}
          <div>
            <p className="text-sm font-medium text-gray-600">Subscription Status</p>
            <p className={`font-semibold capitalize ${getStatusColor(subscription.subscription_status)}`}>
              {subscription.subscription_status.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm font-medium text-gray-600">Plan</p>
            <p className="text-gray-900">{getProductName(subscription.price_id)}</p>
          </div>
          
          {subscription.current_period_end && (
            <div>
              <p className="text-sm font-medium text-gray-600">
                {subscription.cancel_at_period_end ? 'Expires' : 'Renews'}
              </p>
              <p className="text-gray-900">{formatDate(subscription.current_period_end)}</p>
            </div>
          )}
        </div>

        {subscription.cancel_at_period_end && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Your subscription will not renew and will expire on {formatDate(subscription.current_period_end)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}