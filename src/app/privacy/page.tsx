import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Party Mate",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen max-w-2xl mx-auto p-6 flex flex-col gap-4">
      <header className="flex items-center justify-between pop-in">
        <Link href="/" className="text-white/60 text-sm hover:text-white">← Back</Link>
        <span className="chip border-white/15 text-white/60">Legal</span>
      </header>

      <h1 className="title text-4xl font-black holo-text">Privacy Policy</h1>
      <p className="text-white/50 text-xs uppercase tracking-widest">Last updated · 2026-04-20</p>

      <section className="card text-white/85 text-sm leading-relaxed flex flex-col gap-4">
        <div>
          <h2 className="title font-bold text-white mb-1">1. What we collect</h2>
          <p>When you sign up we store your email, a chosen display name, and your
          birthdate. If you sign in with Google we also store the basic profile Google
          shares (email + name). While you're in a game room we store your chosen
          display name, a random player ID, and whether you're online.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">2. How we use it</h2>
          <p>Your email and password let you sign in. Your birthdate determines
          which version of the app you see: under-18 accounts get a teen-safe
          subset (Mild content, curated games) while 18+ accounts unlock all
          tiers and games. Your display name shows in rooms you join. That's it
          — we don't profile you or sell anything to advertisers.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">3. Where it lives</h2>
          <p>All data is stored in <b>Supabase</b>, a managed Postgres + auth provider.
          Supabase is our infrastructure — they process data on our behalf and are
          bound by their own privacy commitments. We don't sync your data to any other
          third party except as required below.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">4. Google sign-in</h2>
          <p>If you use "Continue with Google" we exchange an OAuth code with Google
          to identify your email. We don't see your Google password. You can revoke our
          access any time from your Google account settings.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">5. Game content</h2>
          <p>We don't store game-round content (votes, confessions, your Fictionary
          bluffs, etc.) beyond the lifetime of the room. Rooms auto-delete after
          two hours of inactivity. Once a room is gone, its content is gone.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">6. Cookies & storage</h2>
          <p>We use browser localStorage to keep you signed in and to remember your
          current party code so you can rejoin after a disconnect. No advertising or
          tracking cookies.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">7. Your rights</h2>
          <p>You can delete your account from the profile menu at any time. That
          removes your profile and signs you out. Room rows you created are auto-cleaned
          when the room expires.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">8. Minors</h2>
          <p>Party Mate accepts accounts from age 13 upward. Under-18 accounts
          are automatically served a teen-safe experience — adult games and
          adult-tier content are hidden from them entirely. We do not knowingly
          collect data from users under 13. If you believe a user is under 13,
          contact us and we'll remove the account.</p>
        </div>

        <div>
          <h2 className="title font-bold text-white mb-1">9. Changes</h2>
          <p>We may update this policy. Material changes will be surfaced in-app.
          Continued use means you accept the new version.</p>
        </div>
      </section>

      <footer className="text-center text-white/40 text-xs uppercase tracking-widest mt-auto pt-6">
        <Link href="/terms" className="hover:text-white mr-3">Terms</Link>
        <Link href="/" className="hover:text-white">Home</Link>
      </footer>
    </main>
  );
}
