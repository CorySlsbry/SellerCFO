import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | SellerCFO',
  description: 'SellerCFO terms of service — the agreement between you and SellerCFO LLC.',
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-[#0a0a0f] text-[#e8e8f0] min-h-screen">
      <nav className="fixed top-0 w-full bg-[#0a0a0f]/80 backdrop-blur border-b border-[#1e1e2e] z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="font-bold text-lg tracking-tight">
            <span className="text-[#8b5cf6]">Seller</span><span className="text-[#e8e8f0]">CFO</span>
          </Link>
          <Link href="/" className="text-sm text-[#8888a0] hover:text-[#e8e8f0] transition">
            &larr; Back to Home
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-[#8888a0] mb-8">Last updated: April 3, 2026</p>

          <div className="space-y-6 text-[#b0b0c8] text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">1. Acceptance of Terms</h2>
              <p>By creating an account or using SellerCFO, you agree to these Terms of Service. SellerCFO is operated by SellerCFO LLC. If you do not agree to these terms, do not use the service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">2. Service Description</h2>
              <p>SellerCFO is a SaaS financial dashboard designed for e-commerce brands, e-commerce businesses, and DTC brands. It integrates with QuickBooks Online and field management tools to provide financial reporting, order tracking, revenue recognition, cash flow forecasting, and AI-powered analysis. The service is provided &quot;as is&quot; and we make no guarantees about uninterrupted availability.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">3. Accounts and Access</h2>
              <p>You are responsible for maintaining the security of your account credentials. Each account is for use by a single organization. You may not share account credentials with individuals outside your organization. We reserve the right to suspend accounts that violate these terms.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">4. Billing and Subscriptions</h2>
              <p>SellerCFO is offered on a monthly subscription basis. All plans include a 14-day free trial. After your trial, you will be billed monthly at the rate for your selected plan. You may upgrade, downgrade, or cancel your subscription at any time through your account settings. Cancellations take effect at the end of the current billing period.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">5. Money-Back Guarantee</h2>
              <p>All plans come with a 30-day money-back guarantee. If you are not satisfied with the service within your first 30 days as a paying subscriber, contact us for a full refund.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">6. Data and Integrations</h2>
              <p>When you connect third-party services (QuickBooks Online, Shopify, Amazon, etc.), you authorize SellerCFO to access your data on those platforms in read-only mode. SellerCFO does not modify data in your connected accounts. You retain ownership of all your data. See our Privacy Policy for details on data handling.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">7. AI Features Disclaimer</h2>
              <p>SellerCFO includes AI-powered financial analysis features. These features provide analysis and suggestions based on your data, but should not be considered professional financial, accounting, or legal advice. Always consult with a qualified professional for important financial decisions.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">8. Limitation of Liability</h2>
              <p>SellerCFO and SellerCFO LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. Our total liability for any claims related to the service is limited to the amount you have paid us in the 12 months preceding the claim.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">9. Changes to Terms</h2>
              <p>We may update these terms from time to time. We will notify you of material changes via email. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e8e8f0] mb-2">10. Contact</h2>
              <p>For questions about these terms, contact us at <a href="mailto:support@medicalcfo.com" className="text-[#06b6d4] hover:text-[#22d3ee] transition">support@medicalcfo.com</a>.</p>
            </section>

            <section>
              <p className="text-[#8888a0]">SellerCFO is a product of SellerCFO LLC.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
