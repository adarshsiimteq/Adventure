import React, { useState } from 'react';
import { Product } from '../../stripe-config';
import { CreditCard, Loader2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onPurchase: (product: Product) => Promise<void>;
}

export default function ProductCard({ product, onPurchase }: ProductCardProps) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await onPurchase(product);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
          <p className="text-gray-600 mt-2">{product.description}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary-600">
            $10.00
          </div>
          <span className="text-sm text-gray-500 capitalize">
            {product.mode === 'payment' ? 'One-time' : 'Subscription'}
          </span>
        </div>
        
        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              <span>Purchase Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}