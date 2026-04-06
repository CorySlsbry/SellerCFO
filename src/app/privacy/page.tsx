import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | MedicalCFO',
  description: 'MedicalCFO privacy policy — how we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#0a0a0f] text-[#e8e8f0] min-h-screen">
      <nav className="fixed top-0 w-full bg-[#0a0a0f]/80 backdrop-blur border-b border-[#1e1e2e] z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="font-bold text-lg tracking-tight">
            <span className="text-[#06b6d4]">Medical</span><span className="text-[#e8e8f0]">CFO</span>
          </Link>
          <Link href="/" className="text-sm text-[#8888a0] hover:text-[#e8e8f0] transition">
            &larr; Back to Home
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-[#8888a0] mb-8">Last updated: April 3, 2026</p>

          <div className="space-y-6 text-[#b0b0c8] text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">1. Information We Collect</h2>
              <p>When you create an account, we collect your name, email address, company name, and payment information (processed securely by Stripe). When you connect integrations such as QuickBooks Online, NextGen, or athenahealth, we access financial and project data from those services in read-only mode to populate your dashboard.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">2. How We Use Your Information</h2>
              <p>We use your information to provide the MedicalCFO dashboard service, including financial reporting, revenue cycle analytics, claims tracking, and AI-powered analysis. We also use your email to send account-related communications such as billing receipts, service updates, and support responses. We do not sell your personal information to third parties.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">3. Data Security</h2>
              <p>All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Our database is hosted on Supabase with row-level security policies. Payment processing is handled by Stripe, which is PCI DSS Level 1 compliant. QuickBooks and other integration connections are read-only — MedicalCFO cannot create, modify, or delete data in your connected accounts.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">4. Third-Party Services</h2>
              <p>We use the following third-party services: Stripe for payment processing, Supabase for database hosting and authentication, Vercel for application hosting, and Google Tag Manager for analytics. Each of these services has their own privacy policies governing their handling of data.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">5. Data Retention</h2>
              <p>We retain your account data and synced financial data for as long as your account is active. If you cancel your subscription, your data is retained for 30 days to allow for reactivation. After 30 days, your data is permanently deleted. You may request immediate deletion of your data at any time by contacting us.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">6. Cookies</h2>
              <p>We use essential cookies for authentication and session management. We use Google Tag Manager for analytics, which may set additional cookies. You can disable non-essential cookies in your browser settings.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">7. Your Rights</h2>
              <p>You have the right to access, correct, or delete your personal data. You may also request a copy of the data we hold about you. To exercise any of these rights, contact us at support@medicalcfo.com.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">8. Contact</h2>
              <p>If you have questions about this privacy policy, contact us at <a href="mailto:support@medicalcfo.com" className="text-[#06b6d4] hover:text-[#22d3ee] transition">support@medicalcfo.com</a>.</p>
            </section>

            <section>
              <p className="text-[#8888a0]">MedicalCFO is a product of MedicalCFO LLC.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
