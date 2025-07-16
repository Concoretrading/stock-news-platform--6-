export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          🚀 AI Breakout Analyzer
        </h1>
        
        <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-2 lg:text-left gap-8">
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              🔍 Polygon API Test
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Test live market data connection and API functionality.
            </p>
            <button 
              onClick={() => window.open('/api/polygon/test', '_blank')}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Test API Connection
            </button>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              📈 Breakout Analysis
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Comprehensive AI-powered breakout pattern detection.
            </p>
            <button 
              onClick={() => window.open('/api/breakout?ticker=AAPL', '_blank')}
              className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Analyze AAPL
            </button>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              💎 Options Premium
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Track premium structure and implied volatility patterns.
            </p>
            <button 
              disabled
              className="mt-4 bg-gray-400 text-white font-bold py-2 px-4 rounded cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>

          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              🧠 Pattern Learning
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              AI pattern recognition and momentum analysis.
            </p>
            <button 
              disabled
              className="mt-4 bg-gray-400 text-white font-bold py-2 px-4 rounded cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>

        <div className="mt-16 text-center text-sm text-gray-500">
          <p>Powered by Polygon API | Built with Next.js & TypeScript</p>
          <p className="mt-2">Completely separate from ConcoreNews platform</p>
        </div>
      </div>
    </main>
  );
} 