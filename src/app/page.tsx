import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-violet-500/30 to-transparent"></div>
          <div className="absolute bottom-1/3 right-1/4 w-px h-24 bg-gradient-to-b from-transparent via-red-500/20 to-transparent"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-8 py-24 z-10">
          <div className="space-y-16">
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="w-20 h-1 bg-gradient-to-r from-violet-500 to-red-500"></div>
                <div className="font-mono text-sm text-violet-400 tracking-widest uppercase">AUTHENTICATED MARKETPLACE</div>
              </div>
              
              <h1 className="text-8xl font-black leading-none tracking-tighter">
                <span className="text-white">FAN</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-300 via-purple-400 to-indigo-500 drop-shadow-lg">VAULT</span>
              </h1>
              
              <p className="text-2xl text-zinc-200 max-w-3xl leading-relaxed font-light">
                Own authentic pieces from your favorite creators. Every item cryptographically verified 
                and linked to original content.
              </p>
            </div>
            
            <div className="flex space-x-8 pt-8">
              <Link 
                href="/auctions"
                className="inline-block bg-white text-black font-bold px-16 py-6 text-sm tracking-wider uppercase transition-all duration-300 hover:bg-violet-500 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/25"
              >
                EXPLORE VAULT
              </Link>
              <Link 
                href="/auth/register?creator=true"
                className="inline-block border-2 border-zinc-600 text-white font-bold px-16 py-6 text-sm tracking-wider uppercase transition-all duration-300 hover:border-violet-400 hover:text-violet-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-400/15"
              >
                CREATOR ACCESS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-8 py-24">
          <div className="grid grid-cols-3 gap-20 text-center">
            <div className="space-y-4">
              <div className="text-6xl font-black text-violet-400">2,847</div>
              <div className="text-sm font-mono text-zinc-300 uppercase tracking-widest">Items Verified</div>
            </div>
            <div className="space-y-4">
              <div className="text-6xl font-black text-red-400">163</div>
              <div className="text-sm font-mono text-zinc-300 uppercase tracking-widest">Active Creators</div>
            </div>
            <div className="space-y-4">
              <div className="text-6xl font-black text-white">99.7%</div>
              <div className="text-sm font-mono text-zinc-300 uppercase tracking-widest">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-32 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-8">
          <div className="space-y-24">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-1 bg-violet-500 mx-auto"></div>
                <div className="font-mono text-sm text-violet-400 tracking-widest uppercase">VERIFICATION PROTOCOL</div>
              </div>
              <h2 className="text-6xl font-black text-white">HOW IT WORKS</h2>
              <p className="text-xl text-zinc-200 max-w-3xl mx-auto font-light leading-relaxed">
                Three-step authentication ensures every item has verifiable provenance from creator to collector.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-16">
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-violet-500 text-black font-mono font-black flex items-center justify-center text-3xl mx-auto">1</div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">DIGITAL PROOF</h3>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    Cryptographic signatures link items to specific video content and timestamps.
                  </p>
                </div>
              </div>

              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-red-500 text-white font-mono font-black flex items-center justify-center text-3xl mx-auto">2</div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">CREATOR AUTH</h3>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    Multi-factor verification confirms creator identity through platform APIs.
                  </p>
                </div>
              </div>

              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-white text-black font-mono font-black flex items-center justify-center text-3xl mx-auto">3</div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">SECURE TRANSFER</h3>
                  <p className="text-zinc-200 leading-relaxed text-lg">
                    Encrypted transactions with immutable ownership records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 py-32">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className="space-y-16">
            <div className="space-y-8">
              <h2 className="text-6xl font-black text-white">ENTER THE VAULT</h2>
              <p className="text-xl text-zinc-200 max-w-2xl mx-auto font-light leading-relaxed">
                Join thousands of collectors in the authenticated creator marketplace.
              </p>
            </div>
            <Link 
              href="/auth/register"
              className="inline-block bg-violet-500 text-white font-bold px-20 py-6 text-sm tracking-wider uppercase transition-all duration-300 hover:bg-violet-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/25"
            >
              GET ACCESS NOW
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
