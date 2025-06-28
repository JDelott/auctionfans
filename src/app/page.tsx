import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="accent-bar w-16 mb-6"></div>
              <h1 className="text-display mb-6">
                Authentic Creator Collections
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
                A curated marketplace for verified items used by content creators. 
                Own authentic pieces from your favorite creators&lsquo; content.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/auctions"
                  className="btn-primary inline-flex items-center justify-center"
                >
                  Explore Auctions
                </Link>
                <Link 
                  href="/auth/register?creator=true"
                  className="btn-secondary inline-flex items-center justify-center"
                >
                  Join as Creator
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative">
                <div className="aspect-square bg-gradient-primary rounded-2xl flex items-center justify-center shadow-2xl">
                  <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-lg"></div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-secondary rounded-xl shadow-lg"></div>
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-accent rounded-lg shadow-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">1,247</div>
              <div className="text-caption text-gray-600">Items Sold</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-secondary bg-clip-text text-transparent mb-2">89</div>
              <div className="text-caption text-gray-600">Verified Creators</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent mb-2">4.9</div>
              <div className="text-caption text-gray-600">Trust Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="accent-bar w-16 mx-auto mb-6"></div>
            <h2 className="text-heading text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our comprehensive verification process ensures authenticity and provenance for every item.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card card-featured p-8 text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-xl mb-6 mx-auto flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded"></div>
              </div>
              <h3 className="text-subheading text-gray-900 mb-4">Video Verification</h3>
              <p className="text-body text-gray-600">
                Every item is linked to specific video content with timestamp verification and provenance tracking.
              </p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-secondary rounded-xl mb-6 mx-auto flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white rounded-full"></div>
              </div>
              <h3 className="text-subheading text-gray-900 mb-4">Creator Authentication</h3>
              <p className="text-body text-gray-600">
                Rigorous multi-step verification process for all content creators on the platform.
              </p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-accent rounded-xl mb-6 mx-auto flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded transform rotate-45"></div>
              </div>
              <h3 className="text-subheading text-gray-900 mb-4">Secure Transactions</h3>
              <p className="text-body text-gray-600">
                End-to-end secure payment processing with comprehensive buyer and seller protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-heading text-white mb-4">Start Your Collection Today</h2>
          <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto">
            Join thousands of collectors and creators in the authentic content marketplace.
          </p>
          <Link 
            href="/auth/register"
            className="btn-accent"
          >
            Get Started Now
          </Link>
        </div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full"></div>
      </section>
    </div>
  );
}
