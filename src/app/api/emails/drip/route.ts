/**
 * Drip Email Endpoint
 * POST /api/emails/drip
 * Called by cron (Vercel cron or n8n) to send onboarding drip emails
 *
 * Day 2:  Nudge to connect QuickBooks (if no integrations)
 * Day 7:  Week one value proof
 * Day 11: Trial ending in 3 days
 * Day 14: Trial ending today
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendNudgeQuickBooks, sendWeekOneValue, sendTrialEnding } from '@/lib/email';

/** Shared handler — Vercel crons send GET, n8n/manual sends POST */
async function handleDrip(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    // Get all organizations with their profiles
    const { data: orgs } = await (supabase
      .from('organizations') as any)
      .select('id, name, created_at, subscription_plan, stripe_subscription_id')
      .order('created_at', { ascending: false });

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No organizations found' });
    }

    let sent = 0;

    for (const org of orgs) {
      const createdAt = new Date(org.created_at);
      const now = new Date();
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Get owner profile
      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('email, full_name')
        .eq('organization_id', org.id)
        .eq('role', 'owner')
        .single();

      if (!profile) continue;

      const { email, full_name: name } = profile;

      // Day 2: Nudge to connect QuickBooks
      if (daysSinceSignup === 2) {
        // Check if they have integrations
        const { data: connections } = await (supabase
          .from('integration_connections') as any)
          .select('status')
          .eq('organization_id', org.id)
          .eq('status', 'connected');

        if (!connections || connections.length === 0) {
          await sendNudgeQuickBooks(email, name || 'there');
          sent++;
        }
      }

      // Day 7: Week one value proof
      if (daysSinceSignup === 7) {
        await sendWeekOneValue(email, name || 'there');
        sent++;
      }

      // Day 11: Trial ending in 3 days
      if (daysSinceSignup === 11) {
        await sendTrialEnding(email, name || 'there', 3);
        sent++;
      }

      // Day 14: Trial ending today
      if (daysSinceSignup === 14) {
        await sendTrialEnding(email, name || 'there', 0);
        sent++;
      }
    }

    return NextResponse.json({ sent, message: `Sent ${sent} drip emails` });
  } catch (err) {
    console.error('Drip email error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Vercel crons send GET requests
export async function GET(request: NextRequest) {
  return handleDrip(request);
}

// n8n / manual triggers send POST
export async function POST(request: NextRequest) {
  return handleDrip(request);
}
