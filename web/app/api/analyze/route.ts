import { handleAnalyzeRequest } from '@/lib/analyze-handler';
import { analyzeWithJevFlowCore } from '@/lib/core-adapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request: Request): Promise<Response> {
  return handleAnalyzeRequest(request, {
    analyze: analyzeWithJevFlowCore,
  });
}

export function POST(request: Request): Promise<Response> {
  return handleAnalyzeRequest(request, {
    analyze: analyzeWithJevFlowCore,
  });
}
