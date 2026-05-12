import Link from 'next/link';

function FluteIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className} aria-hidden="true">
      <path
        d="M8 2 H16 L15 14 a3 3 0 0 1 -6 0 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M12 17 V28" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 28 H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10.5" cy="6" r="0.7" fill="currentColor" opacity="0.6" />
      <circle cx="13.5" cy="9" r="0.5" fill="currentColor" opacity="0.45" />
      <circle cx="11" cy="11" r="0.4" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="px-6 py-20 sm:py-28 bg-[#FFF8F0] relative overflow-hidden">
        {/* Soft blush blob behind hero */}
        <div
          aria-hidden
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full bg-[#F8D7DC] opacity-50 blur-3xl"
        />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="ornament-divider mx-auto max-w-xs mb-6">
            <FluteIcon className="w-5 h-7 text-[#B76E79]" />
          </div>
          <p className="uppercase tracking-[0.28em] text-[10px] sm:text-xs font-semibold text-[#B76E79] mb-3">
            Personalized Bachelorette Trivia
          </p>
          <h1 className="script text-7xl sm:text-9xl text-[#5C1A2F]">
            Knowsy
          </h1>
          <p className="mt-6 text-lg sm:text-2xl max-w-xl mx-auto text-[#5C1A2F]/85 leading-snug font-medium">
            Custom trivia about the bride — written by her crew.
          </p>
          <p className="mt-3 text-sm sm:text-base max-w-lg mx-auto text-[#3A1525]/65">
            Your bridesmaids fill out a 15-question survey. We turn their inside jokes and stories
            into a board you play live at the bach.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/create" className="btn-primary text-base sm:text-lg">
              Plan her party
            </Link>
          </div>
          <p className="mt-4 text-xs text-[#3A1525]/55">Stripe stubbed for MVP. No card required today.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-white border-y border-[#B76E79]/15">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-2 text-[#5C1A2F]">
            How it works
          </h2>
          <p className="text-center text-[#3A1525]/65 mb-12 text-sm sm:text-base">
            Three steps. The hardest part is choosing a tone.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', t: 'Set up the bach', d: 'Tell us the bride, the partner, and the vibe — wholesome, spicy, or wild.' },
              { n: '02', t: 'Text the crew', d: 'Bridesmaids, parents, college friends — each gets her own link to share the goods.' },
              { n: '03', t: 'Play the game', d: 'AI builds the board from their answers. Cast it to the TV, crown a team, cry-laugh.' },
            ].map((s) => (
              <div key={s.n} className="card">
                <div className="text-xs uppercase tracking-widest font-bold text-[#B76E79]">Step {s.n}</div>
                <h3 className="font-bold text-xl mt-2 text-[#5C1A2F]">{s.t}</h3>
                <p className="text-[#3A1525]/70 mt-2 text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it's different */}
      <section className="px-6 py-20 bg-[#F8D7DC]">
        <div className="max-w-3xl mx-auto text-center">
          <FluteIcon className="w-7 h-9 text-[#B76E79] mx-auto mb-6 opacity-90" />
          <h2 className="script text-5xl sm:text-7xl text-[#5C1A2F] mb-4">
            For the bride who has stories.
          </h2>
          <p className="mt-4 text-[#3A1525]/85 sm:text-lg leading-relaxed">
            Most party games are generic. Knowsy is the opposite. Every question is pulled
            from a real story her people told us — inside jokes, the karaoke phase,
            the dorm-room era, the moment she met him. All in one board, made just for her.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-[#FFF8F0] text-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-[#5C1A2F]">
          Ready to make her cry-laugh on the dance floor?
        </h3>
        <Link href="/create" className="btn-primary mt-8 inline-block">
          Start a game
        </Link>
        <p className="mt-10 text-xs text-[#3A1525]/45 max-w-md mx-auto">
          Trivia format inspired by classic quiz shows. Knowsy is an original product —
          not affiliated with any television trivia game.
        </p>
      </section>
    </main>
  );
}
