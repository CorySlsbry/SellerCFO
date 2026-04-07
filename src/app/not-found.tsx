import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bg-[#0a0a0f] text-[#e8e8f0] min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="font-bold text-3xl tracking-tight mb-6">
          <span className="text-[#8b5cf6]">Seller</span>
          <span className="text-[#e8e8f0]">CFO</span>
        </div>

        <h1 className="text-6xl font-bold text-[#06b6d4] mb-4">404</h1>
        <p className="text-lg text-[#e8e8f0] mb-2">Page Not Found</p>
        <p className="text-sm text-[#8888a0] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg font-semibold text-[#e8e8f0] bg-[#1e1e2e] hover:bg-[#2a2a3d] transition text-sm"
          >
            Go to Homepage
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-lg font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] transition text-sm"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
