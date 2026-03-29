'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-950 text-slate-200">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-7xl font-bold mb-8 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 bg-clip-text text-transparent tracking-tighter">
          THE PREDATOR
        </h1>

        <p className="text-2xl text-slate-400 mb-12 max-w-2xl mx-auto font-light">
          Autonomous Trading Intelligence System. <br />
          <span className="text-blue-500 font-semibold tracking-widest text-sm uppercase">Hunt • Analyze • Compound</span>
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Link
            href="/news-gravity"
            className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:border-blue-500/50"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🌌</div>
            <h3 className="text-xl font-bold mb-2 text-white">News Gravity</h3>
            <p className="text-sm text-slate-400">
              Analyze narrative arcs and sentiment distribution across institutional benchmarks
            </p>
          </Link>

          <Link
            href="/split-screen"
            className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/50"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
            <h3 className="text-xl font-bold mb-2 text-white">Advanced Split Mode</h3>
            <p className="text-sm text-slate-400">
              Dual-pillar situational awareness integrating catalysts with raw price action
            </p>
          </Link>

          <Link
            href="/trade-reviews"
            className="group p-8 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 hover:border-amber-500/50"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📔</div>
            <h3 className="text-xl font-bold mb-2 text-white">Evolution Journal</h3>
            <p className="text-sm text-slate-400">
              Compound knowledge by reviewing historical patterns and strategy refinements
            </p>
          </Link>
        </div>

        <div className="bg-slate-900/30 rounded-3xl p-10 border border-slate-800/50 backdrop-blur-sm">
          <h2 className="text-3xl font-bold mb-8 text-white">The 5-Pillar Model</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            <div>
              <h3 className="font-bold text-blue-400 mb-2 uppercase tracking-wider text-xs">Technical</h3>
              <p className="text-sm text-slate-400">
                Multi-timeframe internals and volatility compression analysis
              </p>
            </div>
            <div>
              <h3 className="font-bold text-purple-400 mb-2 uppercase tracking-wider text-xs">Sentiment</h3>
              <p className="text-sm text-slate-400">
                Institutional narrative arcs and retail expectation shocks
              </p>
            </div>
            <div>
              <h3 className="font-bold text-red-400 mb-2 uppercase tracking-wider text-xs">Flow</h3>
              <p className="text-sm text-slate-400">
                Real-time options premium and institutional positioning tracks
              </p>
            </div>
            <div>
              <h3 className="font-bold text-green-400 mb-2 uppercase tracking-wider text-xs">Macro</h3>
              <p className="text-sm text-slate-400">
                Global regime detection and divergence exploitation logic
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-xs text-slate-600 uppercase tracking-[0.2em] font-medium">
          <p>The Predator Intelligence System • Owned Power Architecture</p>
        </div>
      </div>
    </main>
  );
}
