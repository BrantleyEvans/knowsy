import Link from 'next/link';

export default function SuccessPage() {
  return (
    <main className="flex-1 px-6 py-20 flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">✨</div>
        <h1 className="text-3xl font-extrabold text-[#1E1B3A]">Submitted!</h1>
        <p className="mt-3 text-[#1E1B3A]/70">
          Thanks for sharing the goods. The host will see your answers and use them to
          build the trivia game. You can close this tab — we got everything we need.
        </p>
        <Link href="/" className="inline-block mt-8 text-sm text-[#E85D5D] font-semibold underline">
          What is this thing? →
        </Link>
      </div>
    </main>
  );
}
