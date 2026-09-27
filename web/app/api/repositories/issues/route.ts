import { createPublicGitHubReader } from '@/lib/github/public-github-client';
import { handleListIssues } from '@/lib/github/repository-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request: Request): Promise<Response> {
  return handleListIssues(request, createPublicGitHubReader());
}
