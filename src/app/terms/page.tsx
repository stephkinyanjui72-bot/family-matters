import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Party Mate",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen max-w-2xl mx-auto p-6 flex flex-col gap-4">
      <header className="flex items-center justify-between pop-in">
        <Link href="/" className="text-white/60 text-sm hover:text-white">← Back</Link>
        <span className="chip border-white/15 text-white/60">Legal</span>
      </header>

      <h1 className="title text-4xl font-black holo-text">Terms of Service</h1>
      <p className="text-white/50 text-xs uppercase tracking-widest">Last updated · 2026-04-20</p>

      <section className="card text-white/85 text-sm leading-relaxed flex flex-col gap-4">
        <div>
          <h2 className="title font-bold text-white mb-1">1. Who we are</h2>
          <p>Party Mate is an adult party-game app for friends on a night in.
          By using the app you confirm you've read and accept these Terms and the
          <Link href="/privacy" className="text-flame hover:underline mx-1">Privacy Policy</Link>.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">2. Who can use it</h2>
          <p>You must be at least <b>18 years old</b> to create an account and host a game.
          The Chaos tier is restricted to accounts aged <b>23+</b>.
          You are responsible for confirming that everyone in the room you host is old
          enough for the content you pick. Don't invite minors to adult-tier games.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">3. Content & conduct</h2>
          <p>Party Mate includes flirty, explicit, and sexually themed prompts.
          No prompt forces anyone to do anything — players can always pass, skip,
          or leave. You are responsible for your own choices and behaviour during play.
          Don't use the app to harass, coerce, or endanger anyone.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">4. Your account</h2>
          <p>You're responsible for keeping your login secure. Don't share your
          password. If you think your account has been compromised, reset your
          password immediately.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">5. Rooms and sessions</h2>
          <p>Rooms you host are temporary. They auto-expire after two hours of
          inactivity. We don't record the contents of play (votes, answers, confessions)
          beyond what's needed to sync the active round — nothing persists after the
          room ends.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">6. No warranty</h2>
          <p>Party Mate is provided "as is". We do our best to keep it online and working,
          but we don't guarantee uninterrupted service, and we're not liable for any
          fallout from gameplay (hangovers, awkward mornings, relationships ended over
          a bad truth, etc.). Drink responsibly.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">7. Termination</h2>
          <p>We may suspend or delete accounts that abuse the service, spam, or
          violate these Terms. You can delete your own account at any time from the
          profile menu.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">8. Changes</h2>
          <p>We may update these Terms. Material changes will be surfaced in-app.
          Continued use means you accept the new Terms.</p>
        </div>
      </section>

      <footer className="text-center text-white/40 text-xs uppercase tracking-widest mt-auto pt-6">
        <Link href="/privacy" className="hover:text-white mr-3">Privacy</Link>
        <Link href="/" className="hover:text-white">Home</Link>
      </footer>
    </main>
  );
}
