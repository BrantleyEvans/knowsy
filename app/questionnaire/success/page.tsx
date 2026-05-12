import Link from 'next/link';

export default function SuccessPage() {
  return (
    <main className="flex-1 px-6 py-20 flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">🥂</div>
        <h1 className="script text-5xl text-[#5C1A2F]">Submitted.</h1>
        <p className="mt-4 text-[#3A1525]/75">
          Thanks for sharing the goods. The host will use your answers to build the trivia game.
          You can close this tab — we got everything we need.
        </p>
        <Link href="/" className="inline-block mt-8 text-sm text-[#B76E79] font-semibold underline">
          What is this thing? →
        </Link>
      </div>
    </main>
  );
}
