/**
 * Email Service via Resend
 * Handles all transactional emails for MedicalCFO
 */

import { Resend } from 'resend';

// Lazy-initialize Resend so the module can be imported at build time
// even when RESEND_API_KEY is not yet set in the environment.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || '');
  }
  return _resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'MedicalCFO <hello@topmedicalcfo.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://topmedicalcfo.com';

// ── Email Templates ─────────────────────────────────────

function welcomeEmailHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <span style="color:#06b6d4;font-size:24px;font-weight:bold;">Medical</span><span style="color:#e8e8f0;font-size:24px;font-weight:bold;">CFO</span>
    </div>
    <div style="background:#12121a;border:1px solid #1e1e2e;border-radius:12px;padding:32px;">
      <h1 style="color:#e8e8f0;font-size:22px;margin:0 0 12px;">Your dashboard is ready, ${name}.</h1>
      <p style="color:#b0b0c8;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Welcome to MedicalCFO. Connect your QuickBooks to see your real numbers — claim costs, Claims Pending, cash flow, and AR/AP — in one place. It takes about 2 minutes.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${APP_URL}/dashboard/integrations" style="display:inline-block;background:#06b6d4;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
          Connect QuickBooks Now
        </a>
      </div>
      <p style="color:#8888a0;font-size:13px;line-height:1.6;margin:20px 0 0;">
        Need help? Reply to this email or message us at support@medicalcfo.com — we'll set it up for you at no extra charge.
      </p>
      <hr style="border:none;border-top:1px solid #1e1e2e;margin:24px 0;" />
      <p style="color:#8888a0;font-size:12px;margin:0;">
        We're constantly improving MedicalCFO based on practice feedback. If there's something you'd like to see, just reply — we take every suggestion seriously.
      </p>
    </div>
    <p style="color:#555;font-size:11px;text-align:center;margin-top:20px;">
      MedicalCFO Financial Dashboard for Healthcare · <a href="${APP_URL}" style="color:#06b6d4;">topmedicalcfo.com</a>
    </p>
  </div>
</body>
</html>`;
}

function nudgeQuickBooksHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <span style="color:#06b6d4;font-size:24px;font-weight:bold;">Medical</span><span style="color:#e8e8f0;font-size:24px;font-weight:bold;">CFO</span>
    </div>
    <div style="background:#12121a;border:1px solid #1e1e2e;border-radius:12px;padding:32px;">
      <h1 style="color:#e8e8f0;font-size:22px;margin:0 0 12px;">Your dashboard is waiting, ${name}.</h1>
      <p style="color:#b0b0c8;font-size:14px;line-height:1.6;margin:0 0 20px;">
        You signed up for MedicalCFO but haven't connected QuickBooks yet. Without it, your dashboard can't show your real numbers.
      </p>
      <p style="color:#b0b0c8;font-size:14px;line-height:1.6;margin:0 0 20px;">
        The connection is read-only (we can't touch your books), encrypted, and takes under 2 minutes.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${APP_URL}/dashboard/integrations" style="display:inline-block;background:#06b6d4;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
          Connect QuickBooks — See Your Real Numbers
        </a>
      </div>
      <p style="color:#8888a0;font-size:13px;line-height:1.6;margin:20px 0 0;">
        Want us to do it for you? Reply to this email and we'll walk you through it — or do the whole setup ourselves.
      </p>
    </div>
    <p style="color:#555;font-size:11px;text-align:center;margin-top:20px;">
      MedicalCFO Financial Dashboard for Healthcare · <a href="${APP_URL}" style="color:#06b6d4;">topmedicalcfo.com</a>
    </p>
  </div>
</body>
</html>`;
}

function weekOneValueHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <span style="color:#06b6d4;font-size:24px;font-weight:bold;">Medical</span><span style="color:#e8e8f0;font-size:24px;font-weight:bold;">CFO</span>
    </div>
    <div style="background:#12121a;border:1px solid #1e1e2e;border-radius:12px;padding:32px;">
      <h1 style="color:#e8e8f0;font-size:22px;margin:0 0 12px;">Here's what MedicalCFO catches in the first week.</h1>
      <p style="color:#b0b0c8;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hey ${name}, here's what practices typically find in their first 7 days on MedicalCFO:
      </p>
      <div style="background:#0a0a0f;border:1px solid #2a2a3d;border-radius:8px;padding:16px;margin:0 0 20px;">
        <p style="color:#06b6d4;font-size:15px;font-weight:bold;margin:0 0 8px;">$140K in over-billing caught before job close</p>
        <p style="color:#b0b0c8;font-size:13px;margin:0 0 12px;">Two jobs. Both would have been cash bombs at closeout.</p>
        <p style="color:#06b6d4;font-size:15px;font-weight:bold;margin:0 0 8px;">$34K in forgotten patient balance recovered</p>
        <p style="color:#b0b0c8;font-size:13px;margin:0 0 12px;">Money the GC owed but nobody was tracking.</p>
        <p style="color:#06b6d4;font-size:15px;font-weight:bold;margin:0 0 8px;">$8K in unbilled claim adjustments found</p>
        <p style="color:#b0b0c8;font-size:13px;margin:0;">Work done, scope added, but never invoiced.</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#06b6d4;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
          Check Your Dashboard
        </a>
      </div>
    </div>
    <p style="color:#555;font-size:11px;text-align:center;margin-top:20px;">
      MedicalCFO Financial Dashboard for Healthcare · <a href="${APP_URL}" style="color:#06b6d4;">topmedicalcfo.com</a>
    </p>
  </div>
</body>
</html>`;
}

function trialEndingHtml(name: string, daysLeft: number): string {
  const urgency = daysLeft <= 1 ? 'Your free trial ends today.' : `Your free trial ends in ${daysLeft} days.`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <span style="color:#06b6d4;font-size:24px;font-weight:bold;">Medical</span><span style="color:#e8e8f0;font-size:24px;font-weight:bold;">CFO</span>
    </div>
    <div style="background:#12121a;border:1px solid #1e1e2e;border-radius:12px;padding:32px;">
      <h1 style="color:#e8e8f0;font-size:22px;margin:0 0 12px;">${urgency}</h1>
      <p style="color:#b0b0c8;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hey ${name}, your MedicalCFO trial ${daysLeft <= 1 ? 'ends today' : `ends in ${daysLeft} days`}. After that, you'll lose access to:
      </p>
      <div style="background:#0a0a0f;border:1px solid #2a2a3d;border-radius:8px;padding:16px;margin:0 0 20px;">
        <p style="color:#e8e8f0;font-size:13px;margin:0 0 8px;">✓ Real-time claims tracking & Claims Pending tracking</p>
        <p style="color:#e8e8f0;font-size:13px;margin:0 0 8px;">✓ Cash flow forecasting (30/60/90 day)</p>
        <p style="color:#e8e8f0;font-size:13px;margin:0 0 8px;">✓ AR/AP aging by job</p>
        <p style="color:#e8e8f0;font-size:13px;margin:0 0 8px;">✓ AI CFO Advisor</p>
        <p style="color:#e8e8f0;font-size:13px;margin:0;">✓ All integration syncs</p>
      </div>
      <p style="color:#b0b0c8;font-size:14px;line-height:1.6;margin:0 0 20px;">
        No action needed to continue — your subscription starts automatically. If you want to cancel, you can do so anytime from Settings.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#06b6d4;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
          Open Your Dashboard
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #1e1e2e;margin:24px 0;" />
      <p style="color:#8888a0;font-size:12px;margin:0;">
        Questions? Reply to this email or reach us at support@medicalcfo.com. Remember: 30-day money-back guarantee on every plan.
      </p>
    </div>
    <p style="color:#555;font-size:11px;text-align:center;margin-top:20px;">
      MedicalCFO Financial Dashboard for Healthcare · <a href="${APP_URL}" style="color:#06b6d4;">topmedicalcfo.com</a>
    </p>
  </div>
</body>
</html>`;
}

// ── Send Functions ─────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Your MedicalCFO dashboard is ready.',
      html: welcomeEmailHtml(name),
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}

export async function sendNudgeQuickBooks(to: string, name: string) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Your dashboard is waiting — connect QuickBooks to see your real numbers',
      html: nudgeQuickBooksHtml(name),
    });
  } catch (err) {
    console.error('Failed to send QBO nudge email:', err);
  }
}

export async function sendWeekOneValue(to: string, name: string) {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Here's what MedicalCFO catches in the first week for most practices",
      html: weekOneValueHtml(name),
    });
  } catch (err) {
    console.error('Failed to send week one value email:', err);
  }
}

export async function sendTrialEnding(to: string, name: string, daysLeft: number) {
  try {
    const subject = daysLeft <= 1
      ? 'Your MedicalCFO trial ends today'
      : `Your free trial ends in ${daysLeft} days — here's what you'll lose access to`;
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: trialEndingHtml(name, daysLeft),
    });
  } catch (err) {
    console.error('Failed to send trial ending email:', err);
  }
}
