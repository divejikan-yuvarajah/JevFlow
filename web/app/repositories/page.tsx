import { ConnectedRepositoriesDashboard } from '@/components/repositories/connected-repositories-dashboard';

export const metadata = { title: 'Connected Repositories' };

export default function RepositoriesPage() {
  return (
    <main id="main-content" className="page-container repositories-page">
      <ConnectedRepositoriesDashboard />
      <footer className="site-footer">
        <span>JevFlow · Public GitHub reader</span>
        <span>Read-only links are stored in this browser</span>
      </footer>
    </main>
  );
}
