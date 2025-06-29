import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Electric Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-violet-500 to-transparent shadow-[0_0_15px_rgba(139,92,246,0.6)] opacity-60"></div>
          <div className="absolute bottom-1/3 right-1/4 w-px h-24 bg-gradient-to-b from-transparent via-red-500 to-transparent shadow-[0_0_10px_rgba(239,68,68,0.4)] opacity-40"></div>
          <div className="absolute top-1/2 left-1/2 w-0.5 h-40 bg-gradient-to-b from-transparent via-violet-400/30 to-transparent rotate-45 opacity-30"></div>
          
          {/* Electric Grid */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-8 py-24 z-10">
          <div className="space-y-16">
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="w-20 h-0.5 bg-gradient-to-r from-violet-500 via-purple-400 to-red-500 shadow-[0_0_15px_rgba(139,92,246,0.8)] opacity-80"></div>
                <div className="font-mono text-sm text-violet-400 tracking-[0.3em] uppercase font-medium">
                  VERIFIED CREATOR MARKETPLACE
                </div>
              </div>
              
              <h1 className="text-8xl font-black leading-none tracking-tighter">
                <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">FAN</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-300 via-purple-400 to-indigo-500 drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]">VAULT</span>
              </h1>
              
              <p className="text-2xl text-zinc-200 max-w-3xl leading-relaxed font-light">
                Own authentic items directly from your favorite creators. 
                <span className="text-violet-300 font-medium"> Every piece verified</span>, 
                every story preserved, every connection real.
              </p>
            </div>
            
            <div className="flex space-x-8 pt-8">
              <Link 
                href="/auctions"
                className="group relative inline-block bg-white text-black font-bold px-16 py-6 text-sm tracking-wider uppercase transition-all duration-300 hover:bg-violet-500 hover:text-white hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(139,92,246,0.3)] overflow-hidden"
              >
                <span className="relative z-10">EXPLORE AUCTIONS</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link 
                href="/auth/register?creator=true"
                className="group relative inline-block border border-zinc-600 text-white font-bold px-16 py-6 text-sm tracking-wider uppercase transition-all duration-300 hover:border-violet-400 hover:text-violet-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(139,92,246,0.2)] overflow-hidden"
              >
                <span className="relative z-10">JOIN AS CREATOR</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced How It Works */}
      <section className="py-40 bg-zinc-900/50 relative overflow-hidden">
        {/* Enhanced Electric Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent shadow-[0_0_20px_rgba(139,92,246,0.4)]"></div>
          <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.3)]"></div>
          <div className="absolute top-1/2 left-1/3 w-px h-32 bg-gradient-to-b from-transparent via-violet-400/30 to-transparent shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
          <div className="absolute top-1/3 right-1/3 w-px h-24 bg-gradient-to-b from-transparent via-red-400/30 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-8">
          <div className="space-y-32">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-24 h-0.5 bg-violet-500 mx-auto shadow-[0_0_20px_rgba(139,92,246,0.8)]"></div>
                <div className="font-mono text-sm text-violet-400 tracking-[0.3em] uppercase font-medium">TRUST & AUTHENTICITY</div>
              </div>
              <h2 className="text-7xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">HOW IT WORKS</h2>
              <p className="text-2xl text-zinc-200 max-w-4xl mx-auto font-light leading-relaxed">
                Three simple steps to connect creators with collectors through 
                <span className="text-violet-300 font-medium"> authenticated digital ownership</span>.
              </p>
            </div>

            {/* Enhanced Process Flow */}
            <div className="relative">
              {/* Flowing Connection Lines */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 transform -translate-y-1/2 hidden lg:block">
                <div className="w-full h-full bg-gradient-to-r from-violet-500/30 via-red-500/50 to-white/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]"></div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 relative">
                {/* Step 1 - Enhanced */}
                <div className="text-center space-y-8 group">
                  <div className="relative mx-auto w-32 h-32">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-md group-hover:bg-violet-500/30 transition-all duration-500"></div>
                    {/* Main circle */}
                    <div className="relative w-full h-full bg-zinc-800 border-4 border-violet-500 rounded-full flex items-center justify-center z-10 group-hover:border-violet-400 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] transition-all duration-500">
                      <div className="w-20 h-20 bg-gradient-to-br from-violet-400 via-violet-500 to-violet-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                        <span className="text-white font-mono font-black text-2xl">01</span>
                      </div>
                    </div>
                    {/* Electric pulse effect */}
                    <div className="absolute inset-0 bg-violet-500/10 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"></div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-3xl font-black text-white tracking-wide">
                      CREATOR <span className="text-violet-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]">VERIFIED</span>
                    </h3>
                    <p className="text-zinc-200 leading-relaxed text-xl font-light max-w-sm mx-auto">
                      Multi-factor verification confirms creator identity through platform APIs and content analysis.
                    </p>
                  </div>
                </div>

                {/* Step 2 - Enhanced */}
                <div className="text-center space-y-8 group">
                  <div className="relative mx-auto w-32 h-32">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md group-hover:bg-red-500/30 transition-all duration-500"></div>
                    {/* Main circle */}
                    <div className="relative w-full h-full bg-zinc-800 border-4 border-red-500 rounded-full flex items-center justify-center z-10 group-hover:border-red-400 group-hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] transition-all duration-500">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-400 via-red-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                        <span className="text-white font-mono font-black text-2xl">02</span>
                      </div>
                    </div>
                    {/* Electric pulse effect */}
                    <div className="absolute inset-0 bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"></div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-3xl font-black text-white tracking-wide">
                      ITEM <span className="text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]">CONNECTED</span>
                    </h3>
                    <p className="text-zinc-200 leading-relaxed text-xl font-light max-w-sm mx-auto">
                      Digital signatures link items to specific video timestamps, preserving authenticity forever.
                    </p>
                  </div>
                </div>

                {/* Step 3 - Enhanced */}
                <div className="text-center space-y-8 group">
                  <div className="relative mx-auto w-32 h-32">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:bg-white/30 transition-all duration-500"></div>
                    {/* Main circle */}
                    <div className="relative w-full h-full bg-zinc-800 border-4 border-white rounded-full flex items-center justify-center z-10 group-hover:border-zinc-300 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-500">
                      <div className="w-20 h-20 bg-gradient-to-br from-zinc-200 via-white to-zinc-100 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        <span className="text-black font-mono font-black text-2xl">03</span>
                      </div>
                    </div>
                    {/* Electric pulse effect */}
                    <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"></div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-3xl font-black text-white tracking-wide">
                      YOU <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">OWN IT</span>
                    </h3>
                    <p className="text-zinc-200 leading-relaxed text-xl font-light max-w-sm mx-auto">
                      Encrypted transactions create immutable ownership records with verified provenance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Benefits */}
      <section className="border-t border-zinc-800 py-32 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 w-px h-64 bg-gradient-to-b from-transparent via-red-500/50 to-transparent shadow-[0_0_10px_rgba(239,68,68,0.4)]"></div>
        
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="w-16 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
                <div className="font-mono text-sm text-red-400 tracking-[0.3em] uppercase font-medium">FOR CREATORS</div>
              </div>
              <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
                MONETIZE YOUR 
                <span className="text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"> MOMENTS</span>
              </h2>
              <p className="text-xl text-zinc-200 font-light leading-relaxed">
                Turn your content into collectibles. From costumes to props, gaming gear to signed prints—
                <span className="text-red-300 font-medium"> give your community a way to own a piece of your journey</span>.
              </p>
              <Link 
                href="/auth/register?creator=true"
                className="group relative inline-block bg-red-500 text-white font-bold px-12 py-4 text-sm tracking-wider uppercase transition-all duration-300 hover:bg-red-600 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(239,68,68,0.3)] overflow-hidden"
              >
                <span className="relative z-10">START SELLING</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
            
            <div className="space-y-8">
              <div className="group transition-all duration-300 hover:translate-x-2">
                <div className="relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-red-500 to-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)] opacity-60"></div>
                  <div className="pl-8">
                    <h4 className="text-white font-bold mb-2 text-lg tracking-wide">Set Your Own Prices</h4>
                    <p className="text-zinc-300 leading-relaxed">Full control over starting bids, reserves, and buy-now options.</p>
                  </div>
                </div>
              </div>
              
              <div className="group transition-all duration-300 hover:translate-x-2">
                <div className="relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-red-500 to-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)] opacity-60"></div>
                  <div className="pl-8">
                    <h4 className="text-white font-bold mb-2 text-lg tracking-wide">Keep <span className="text-red-400">90%</span> Revenue</h4>
                    <p className="text-zinc-300 leading-relaxed">Industry-leading creator split with transparent fee structure.</p>
                  </div>
                </div>
              </div>
              
              <div className="group transition-all duration-300 hover:translate-x-2">
                <div className="relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-red-500 to-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)] opacity-60"></div>
                  <div className="pl-8">
                    <h4 className="text-white font-bold mb-2 text-lg tracking-wide">Built-in Audience</h4>
                    <p className="text-zinc-300 leading-relaxed">Reach collectors actively looking for authentic creator items.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collector Benefits */}
      <section className="py-32 bg-zinc-900/30 relative overflow-hidden">
        <div className="absolute left-0 top-1/2 w-px h-64 bg-gradient-to-b from-transparent via-violet-500/50 to-transparent shadow-[0_0_10px_rgba(139,92,246,0.4)]"></div>
        
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <div className="group transition-all duration-300 hover:translate-x-2">
                <div className="relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-violet-500 to-violet-600 shadow-[0_0_8px_rgba(139,92,246,0.4)] opacity-60"></div>
                  <div className="pl-8">
                    <h4 className="text-white font-bold mb-2 text-lg tracking-wide">Authentic Provenance</h4>
                    <p className="text-zinc-300 leading-relaxed">Every item verified and linked to original content for authenticity.</p>
                  </div>
                </div>
              </div>
              
              <div className="group transition-all duration-300 hover:translate-x-2">
                <div className="relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-violet-500 to-violet-600 shadow-[0_0_8px_rgba(139,92,246,0.4)] opacity-60"></div>
                  <div className="pl-8">
                    <h4 className="text-white font-bold mb-2 text-lg tracking-wide"><span className="text-violet-400">Rare</span> & Exclusive</h4>
                    <p className="text-zinc-300 leading-relaxed">One-of-a-kind items you can&apos;t find anywhere else online.</p>
                  </div>
                </div>
              </div>
              
              <div className="group transition-all duration-300 hover:translate-x-2">
                <div className="relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-violet-500 to-violet-600 shadow-[0_0_8px_rgba(139,92,246,0.4)] opacity-60"></div>
                  <div className="pl-8">
                    <h4 className="text-white font-bold mb-2 text-lg tracking-wide">Direct Connection</h4>
                    <p className="text-zinc-300 leading-relaxed">Support creators directly while owning a piece of their story.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <div className="w-16 h-0.5 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]"></div>
                <div className="font-mono text-sm text-violet-400 tracking-[0.3em] uppercase font-medium">FOR COLLECTORS</div>
              </div>
              <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
                OWN THE
                <span className="text-violet-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.4)]"> STORY</span>
              </h2>
              <p className="text-xl text-zinc-200 font-light leading-relaxed">
                From viral moment props to personal gaming setups—
                <span className="text-violet-300 font-medium"> collect authentic pieces from the creators who shaped your favorite memories</span>.
              </p>
              <Link 
                href="/auctions"
                className="group relative inline-block bg-violet-500 text-white font-bold px-12 py-4 text-sm tracking-wider uppercase transition-all duration-300 hover:bg-violet-600 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(139,92,246,0.3)] overflow-hidden"
              >
                <span className="relative z-10">START COLLECTING</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-red-500/5"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-2xl"></div>
        
        <div className="relative max-w-4xl mx-auto px-8 text-center">
          <div className="space-y-16">
            <div className="space-y-8">
              <h2 className="text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] tracking-tight">JOIN FANVAULT</h2>
              <p className="text-xl text-zinc-200 max-w-2xl mx-auto font-light leading-relaxed">
                Be part of the authentic creator economy. Where 
                <span className="text-violet-300 font-medium"> fans become collectors </span>
                and creators connect directly with their community.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/auth/register"
                className="group relative inline-block bg-violet-500 text-white font-bold px-16 py-6 text-sm tracking-wider uppercase transition-all duration-300 hover:bg-violet-600 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(139,92,246,0.3)] overflow-hidden"
              >
                <span className="relative z-10">START COLLECTING</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link 
                href="/auth/register?creator=true"
                className="group relative inline-block border border-red-500 text-red-400 font-bold px-16 py-6 text-sm tracking-wider uppercase transition-all duration-300 hover:bg-red-500 hover:text-white hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(239,68,68,0.3)] overflow-hidden"
              >
                <span className="relative z-10">BECOME A CREATOR</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
