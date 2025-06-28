'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Transaction {
  id: string;
  auction_item_id: string;
  final_price: string;
  payment_status: string;
  shipping_status: string;
  created_at: string;
  auction_title: string;
  auction_images: string[];
  seller_username: string;
  seller_email: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/transactions/by-session?session_id=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setTransaction(data.transaction);
        }
      } catch (error) {
        console.error('Failed to fetch transaction:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Transaction Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn&apos;t find the transaction details.</p>
          <Link href="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600">
            Congratulations! You&apos;ve successfully won the auction.
          </p>
        </div>

        {/* Transaction Details */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction Details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-sm">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Item:</span>
              <span className="font-semibold">{transaction.auction_title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold text-green-600">${parseFloat(transaction.final_price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Seller:</span>
              <span>@{transaction.seller_username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span className="status-active">{transaction.payment_status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping Status:</span>
              <span className="capitalize">{transaction.shipping_status}</span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What happens next?</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-600 text-sm font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Seller Notification</h3>
                <p className="text-gray-600 text-sm">The seller has been notified of your purchase and will prepare your item for shipping.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-600 text-sm font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Shipping Information</h3>
                <p className="text-gray-600 text-sm">You&apos;ll receive tracking information once the item is shipped.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-600 text-sm font-semibold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delivery</h3>
                <p className="text-gray-600 text-sm">Your authentic item will be delivered to your address.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard" className="btn-primary flex-1 text-center">
            View in Dashboard
          </Link>
          <Link href="/auctions" className="btn-secondary flex-1 text-center">
            Browse More Auctions
          </Link>
        </div>
      </div>
    </div>
  );
} 
