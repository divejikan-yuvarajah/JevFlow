import { IssueForm } from '@/components/issue-form';
import { getLiveDemoAvailability } from '@/lib/demo-guards';

export const dynamic = 'force-dynamic';

export default function PlaygroundPage() {
  const availability = getLiveDemoAvailability();
  return (
    <main id="main-content" className="page-container">
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            Typed decisions. Explicit confidence.
          </span>
          <h1>
            Turn issue noise into
            <span> reviewable decisions.</span>
          </h1>
          <p>
            Jev produces structured triage choices. JevFlow’s deterministic
            policy decides when confidence is strong enough to propose action
            and when a human should take over.
          </p>
        </div>
        <div className="hero-rail" aria-label="JevFlow principles">
          <div>
            <strong>05</strong>
            <span>typed decisions</span>
          </div>
          <div>
            <strong>02</strong>
            <span>confidence layers</span>
          </div>
          <div>
            <strong>00</strong>
            <span>GitHub writes here</span>
          </div>
        </div>
      </section>
      <IssueForm availability={availability} />
      <footer className="site-footer">
        <span>JevFlow · Local developer playground</span>
        <span>TypeSafe AI Jev is the inference provider</span>
      </footer>
    </main>
  );
}
