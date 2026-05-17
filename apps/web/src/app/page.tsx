import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 md:px-6 py-4 max-w-6xl mx-auto">
        <span className="text-2xl font-bold text-brand-600">GermanUp</span>
        <div className="flex gap-2 md:gap-3">
          <Link
            href="/login"
            className="px-3 md:px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-3 md:px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-16 md:py-24 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
          Master German Grammar —<br className="hidden sm:block" />
          <span className="text-brand-600">One Rule at a Time.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Grammar exercises, vocabulary flashcards, and verb conjugations — all in one place.
          Track your streak. Go Pro for AI correction.
        </p>
        <Link
          href="/register"
          className="inline-block px-8 py-4 text-lg font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-lg"
        >
          Start for Free →
        </Link>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16 md:py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              icon: '🗂️',
              title: 'Flashcards',
              desc: 'Import your vocabulary, practice with smart spaced repetition that remembers your weak spots.',
            },
            {
              icon: '🤖',
              title: 'AI Correction',
              desc: 'Write a sentence, get instant feedback on grammar and vocabulary. Pro feature.',
            },
            {
              icon: '📊',
              title: 'Progress Tracking',
              desc: 'Daily streak, exercise goals, topic-by-topic accuracy — stay motivated every day.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Simple pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-gray-200 rounded-2xl p-8">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <div className="text-3xl font-bold mb-6">€0</div>
            <ul className="space-y-2 text-sm text-gray-600">
              {['A1 theory (all topics)', '10 exercises / day', '20 flashcards / day', 'Basic progress tracking'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {item}
                  </li>
                ),
              )}
            </ul>
            <Link href="/register" className="mt-8 block text-center px-6 py-3 border border-brand-600 text-brand-600 rounded-xl hover:bg-brand-50 font-medium">
              Get started
            </Link>
          </div>
          <div className="border-2 border-brand-600 rounded-2xl p-8 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-3 py-1 rounded-full">
              Most popular
            </span>
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <div className="text-3xl font-bold mb-6">€7<span className="text-lg font-normal text-gray-500">/mo</span></div>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                'Everything in Free',
                'Unlimited exercises + flashcards',
                'A2 & A3 content',
                'AI correction (translation + free write)',
                'Vocabulary & verb import with AI',
                'Full progress dashboard',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link href="/register" className="mt-8 block text-center px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium">
              Start Pro trial
            </Link>
          </div>
        </div>
      </section>

      <footer className="text-center py-8 text-gray-400 text-sm border-t">
        © {new Date().getFullYear()} GermanUp
      </footer>
    </main>
  );
}
