import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { message, userName, companyName } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Store feedback in Supabase (best-effort — don't fail if DB insert errors)
    try {
      await supabase.from('feedback').insert({
        message: message.trim(),
        user_name: userName || 'Unknown',
        company_name: companyName || 'Unknown',
      });
    } catch (dbErr) {
      console.error('Feedback DB insert failed:', dbErr);
    }

    // Send email via Resend SDK (same pattern as all other transactional emails)
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — skipping feedback email');
      return NextResponse.json({ success: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const FROM_EMAIL = process.env.EMAIL_FROM || 'SellerCFO <hello@sellercfo.com>';

    const { error: resendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ['support@sellercfo.com'],
      subject: `SellerCFO Bug Report from ${userName || 'a user'}${companyName ? ` at ${companyName}` : ''}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="color:#06b6d4;font-size:22px;font-weight:bold;">Medical</span><span style="color:#e8e8f0;font-size:22px;font-weight:bold;">CFO</span>
      <div style="color:#8888a0;font-size:12px;margin-top:4px;">Bug Report</div>
    </div>
    <div style="background:#12121a;border:1px solid #1e1e2e;border-radius:12px;padding:28px;">
      <h2 style="color:#f59e0b;font-size:18px;margin:0 0 20px;">🐛 New Bug Report</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="color:#8888a0;font-size:13px;padding:4px 0;width:110px;">From</td>
          <td style="color:#e8e8f0;font-size:13px;padding:4px 0;">${userName || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="color:#8888a0;font-size:13px;padding:4px 0;">Company</td>
          <td style="color:#e8e8f0;font-size:13px;padding:4px 0;">${companyName || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="color:#8888a0;font-size:13px;padding:4px 0;">Submitted</td>
          <td style="color:#e8e8f0;font-size:13px;padding:4px 0;">${new Date().toLocaleString('en-US', { timeZone: 'America/Denver' })} MT</td>
        </tr>
      </table>
      <div style="background:#0a0a0f;border:1px solid #2a2a3d;border-radius:8px;padding:16px;">
        <div style="color:#8888a0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Message</div>
        <p style="color:#e8e8f0;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${message.trim()}</p>
      </div>
    </div>
    <p style="color:#555;font-size:11px;text-align:center;margin-top:16px;">
      SellerCFO Financial Dashboard for E-commerce
    </p>
  </div>
</body>
</html>`,
    });

    if (resendError) {
      console.error('Resend error sending feedback email:', resendError);
      // Still return success since we stored the feedback in DB
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to send feedback' }, { status: 500 });
  }
}
