'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#06b6d4]">
            <span className="text-2xl font-bold text-white">BC</span>
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-[#e8e8f0]">MedicalCFO</h1>

        <p className="mb-8 max-w-md text-lg text-[#a0a0a8]">
          You're offline. Please check your internet connection and try again.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-lg bg-[#06b6d4] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5] active:bg-[#4338ca]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
