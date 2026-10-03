/**
 * Minimal, on-brand route loader. Shown while a page's server work resolves,
 * a calm centered wordmark with a soft pulse so navigation never flashes blank.
 */
export default function Loading() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-cream px-6">
      <div className="animate-pulse text-center">
        <p className="font-serif text-5xl italic font-medium text-ink">BORROW</p>
      </div>
    </main>
  );
}
