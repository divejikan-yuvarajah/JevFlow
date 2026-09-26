import 'dotenv/config';

import { analyzeIssue } from '../src/triage/analyzeIssue.js';
import { TriageError } from '../src/triage/triage.types.js';

if (!process.env.TYPESAFE_API_KEY?.trim()) {
  console.error(
    'TYPESAFE_API_KEY is not configured. Add it to an ignored local .env file before explicitly running the live smoke test.',
  );
  process.exitCode = 1;
} else {
  try {
    const result = await analyzeIssue({
      title: 'Exported report button does not download a file',
      body: 'The export button finishes loading, but no file is downloaded in the browser.',
      repository: 'example/jevflow-smoke',
    });

    console.log('LIVE Jev smoke test succeeded');
    console.log(
      JSON.stringify(
        {
          issueType: result.issueType,
          engineeringArea: result.engineeringArea,
          priority: result.priority,
          securitySensitiveProbabilityYes:
            result.securitySensitive.probabilityYes,
          needsHumanReviewProbabilityYes:
            result.needsHumanReview.probabilityYes,
          meta: result.meta,
        },
        null,
        2,
      ),
    );
  } catch (error: unknown) {
    const message =
      error instanceof TriageError
        ? `${error.code}: ${error.message}`
        : 'unexpected_error: The live Jev smoke test failed.';
    console.error(message);
    process.exitCode = 1;
  }
}
