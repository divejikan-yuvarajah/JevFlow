import type { Metadata } from 'next';
import Link from 'next/link';
import { EvaluationSummary } from '@/components/evaluation-summary';
import { loadLatestEvaluationReport } from '@/lib/evaluation-report';

export const metadata: Metadata = {
  title: 'Evaluation',
};

export const dynamic = 'force-dynamic';

export default async function EvaluationPage() {
  const report = await loadLatestEvaluationReport();
  return (
    <main id="main-content" className="page-container evaluation-page">
      <section className="evaluation-heading">
        <div>
          <span className="hero-kicker">Measured artifacts only</span>
          <h1>Evaluation signal with provenance.</h1>
          <p>
            This view reads the latest valid Task 05 JSON artifact from the
            fixed local results directory and exposes only its safe summary.
          </p>
        </div>
        <Link className="back-link" href="/">
          ← Open playground
        </Link>
      </section>
      <EvaluationSummary report={report} />
      <footer className="site-footer">
        <span>No issue bodies or internal file paths are displayed</span>
        <span>Reports remain local and Git-ignored</span>
      </footer>
    </main>
  );
}
