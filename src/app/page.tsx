import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-8 py-24">
          <div className="grid grid-cols-12 gap-12 items-center min-h-[70vh]">
            <div className="col-span-8">
              <div className="space-y-8">
                <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-coral-500"></div>
                
                <h1 className="text-6xl font-black leading-tight tracking-tight text-white">
                  VERIFIED CREATOR
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-coral-300">
                    MARKETPLACE
                  </span>
                </h1>
                
                <p className="text-xl text-zinc-200 max-w-lg leading-relaxed font-medium">
                  Authenticated items from content creators. Each piece verified through cryptographic proof of origin.
                </p>
                
                <div className="flex space-x-6 pt-6">
                  <Link 
                    href="/auctions"
                    className="bg-white text-black font-bold px-8 py-4 hover:bg-purple-500 hover:text-white transition-all duration-300 text-sm tracking-wide"
                  >
                    EXPLORE AUCTIONS
                  </Link>
                  <Link 
                    href="/auth/register?creator=true"
                    className="border-2 border-zinc-600 text-white font-bold px-8 py-4 hover:border-purple-400 hover:text-purple-300 transition-all duration-300 text-sm tracking-wide"
                  >
                    JOIN AS CREATOR
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="col-span-4">
              <div className="w-64 h-64 border-2 border-zinc-700 relative">
                <div className="absolute top-4 right-4 w-4 h-4 bg-purple-400"></div>
                <div className="absolute bottom-4 left-4 w-4 h-4 bg-coral-400"></div>
                <div className="absolute inset-8 border border-zinc-600"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-zinc-700">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="grid grid-cols-3 gap-16">
            <div>
              <div className="text-4xl font-black text-purple-300 mb-2">2,847</div>
              <div className="text-sm font-mono text-zinc-300 uppercase tracking-wider font-semibold">Items Verified</div>
            </div>
            <div>
              <div className="text-4xl font-black text-coral-300 mb-2">163</div>
              <div className="text-sm font-mono text-zinc-300 uppercase tracking-wider font-semibold">Active Creators</div>
            </div>
            <div>
              <div className="text-4xl font-black text-white mb-2">99.7%</div>
              <div className="text-sm font-mono text-zinc-300 uppercase tracking-wider font-semibold">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="space-y-16">
            <div>
              <div className="w-12 h-1 bg-gradient-to-r from-coral-400 to-purple-400 mb-6"></div>
              <h2 className="text-4xl font-black mb-4 text-white">VERIFICATION PROCESS</h2>
              <p className="text-zinc-200 text-lg max-w-2xl font-medium leading-relaxed">
                Three-step authentication ensures every item has verifiable provenance from creator to collector.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-purple-400 text-black font-mono font-black flex items-center justify-center text-lg">1</div>
                <h3 className="text-xl font-bold text-white">DIGITAL PROOF</h3>
                <p className="text-zinc-200 leading-relaxed">
                  Cryptographic signatures link items to specific video content and timestamps.
                </p>
              </div>

              <div className="space-y-6">
                <div className="w-12 h-12 bg-coral-400 text-black font-mono font-black flex items-center justify-center text-lg">2</div>
                <h3 className="text-xl font-bold text-white">CREATOR AUTH</h3>
                <p className="text-zinc-200 leading-relaxed">
                  Multi-factor verification confirms creator identity through platform APIs.
                </p>
              </div>

              <div className="space-y-6">
                <div className="w-12 h-12 bg-white text-black font-mono font-black flex items-center justify-center text-lg">3</div>
                <h3 className="text-xl font-bold text-white">SECURE TRANSFER</h3>
                <p className="text-zinc-200 leading-relaxed">
                  Encrypted transactions with immutable ownership records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-700 py-24">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-black mb-6 text-white">START YOUR COLLECTION</h2>
          <p className="text-xl text-zinc-200 mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
            Join the authenticated marketplace for creator artifacts. Verify, collect, own.
          </p>
          <Link 
            href="/auth/register"
            className="bg-gradient-to-r from-purple-500 to-coral-500 text-white font-bold px-12 py-4 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-sm tracking-wide"
          >
            GET STARTED NOW
          </Link>
        </div>
      </section>
    </div>
  );
}
