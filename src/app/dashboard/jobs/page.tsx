'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Orders & Fulfillment</h1>
        <p className="text-[#8888a0]">Track orders, fulfillment status, and returns across all channels</p>
      </div>

      <Card className="p-12 text-center">
        <div className="flex justify-center mb-4">
          <ShoppingCart size={48} className="text-[#8b5cf6]" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Sales Channels Connected</h3>
        <p className="text-[#8888a0] mb-6 max-w-md mx-auto">
          Connect Shopify, Amazon, or another sales channel to track orders and fulfillment
        </p>
        <Link href="/dashboard/integrations">
          <Button variant="primary">Connect Sales Channel</Button>
        </Link>
      </Card>
    </div>
  );
}
