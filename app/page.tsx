'use client';

import dynamic from 'next/dynamic';

// Dynamic Import is CRITICAL here.
// It stops Next.js from trying to run the emulator on the server (which would crash it).
const Emulator = dynamic(() => import('../components/Screen/Emulator'), {
  ssr: false,
  loading: () => <div className="text-white font-mono">Loading Hardware...</div>
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8">
      
      <h1 className="text-2xl font-bold text-white mb-4">My Web OS (Pintos)</h1>

      {/* This is the Monitor Frame */}
      <div className="relative w-[800px] h-[600px] border-4 border-gray-600 rounded-lg overflow-hidden shadow-2xl bg-black">
        <Emulator />
      </div>

      <div className="mt-4 text-gray-400 font-mono text-sm">
        System Status: Online | RAM: 32MB
      </div>

    </main>
  );
}