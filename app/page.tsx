import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="px-6 py-20 sm:py-28 bg-[#FFF8F0]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="uppercase tracking-[0.22em] text-xs sm:text-sm font-semibold text-[#E85D5D] mb-5">
            Personalized party trivia
          </p>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-[#1E1B3A] leading-[0.95]">
            Knowsy.
          </h1>
          <p className="mt-8 text-lg sm:text-2xl max-w-xl mx-auto text-[#1E1B3A]/80 leading-snug">
            AI-built trivia about the bride — written by the people who know her best.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/create"
              className="btn-primary text-base sm:text-lg"
            >
              Build your game
            </Link>
          </div>
          <p className="mt-4 text-sm text-[#1E1B3A]/60">Stripe stubbed for MVP. No card required.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-white border-y border-[#1E1B3A]/8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-[#1E1B3A]">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', t: 'Create the event', d: 'Tell us the bride, the partner, and the tone — wholesome, spicy, or wild.' },
              { n: '02', t: 'Send survey links', d: 'Bridesmaids, parents, friends — each gets a unique link to share their answers.' },
              { n: '03', t: 'Play the game', d: 'When the answers are in, AI builds the board. Project it, click through, crown a team.' },
            ].map((s) => (
              <div key={s.n} className="card">
                <div className="text-xs uppercase tracking-widest font-bold text-[#E85D5D]">Step {s.n}</div>
                <h3 className="font-bold text-xl mt-2 text-[#1E1B3A]">{s.t}</h3>
                <p className="text-[#1E1B3A]/70 mt-2 text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it's different */}
      <section className="px-6 py-16 bg-[#FFE5D9]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E1B3A]">
            The trivia game your friends write for you.
          </h2>
          <p className="mt-4 text-[#1E1B3A]/75 sm:text-lg leading-relaxed">
            Most party games are generic. Knowsy is the opposite. Every question
            is pulled from a real story your people told us about you.
            Inside jokes, embarrassing moments, the wagon-wheel karaoke phase —
            all in one board.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 bg-[#FFF8F0] text-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-[#1E1B3A]">Ready to make her cry-laugh?</h3>
        <Link
          href="/create"
          className="btn-primary mt-6 inline-block"
        >
          Start a game
        </Link>
        <p className="mt-8 text-xs text-[#1E1B3A]/50 max-w-md mx-auto">
          Trivia format inspired by classic quiz shows. Knowsy is an original product —
          not affiliated with any television trivia game.
        </p>
      </section>
    </main>
  );
}
