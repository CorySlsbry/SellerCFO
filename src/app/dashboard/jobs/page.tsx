'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Claims & Billing</h1>
        <p className="text-[#8888a0]">Track claims, denials, collections, and payer performance</p>
      </div>

      <Card className="p-12 text-center">
        <div className="flex justify-center mb-4">
          <Briefcase size={48} className="text-[#06b6d4]" />
        </div>
        <h3 className="text-lg font-semibold mb-2">EHR Not Connected</h3>
        <p className="text-[#8888a0] mb-6 max-w-md mx-auto">
          Connect athenahealth or NextGen to track claims, denials, and payer performance
        </p>
        <Link href="/dashboard/integrations">
          <Button variant="primary">Connect Integration</Button>
        </Link>
      </Card>
    </div>
  );
}
