'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MAX_BODY_CODE_POINTS,
  MAX_TITLE_CODE_POINTS,
} from '../../dist/jev/state.js';
import {
  parsePublicApiResponse,
  PublicContractError,
  type PublicTriageView,
} from '@/lib/contracts';
import type { LiveDemoAvailability } from '@/lib/demo-guards';
import {
  consumeIssueHandoff,
  type ImportedIssueHandoff,
} from '@/lib/repositories/issue-handoff';
import {
  findMatchingPreview,
  PREVIEW_SCENARIOS,
  type PreviewScenario,
} from '@/lib/preview-fixtures';
import { ResultOverview } from './result-overview';

type AnalysisMode = 'preview' | 'live';
type RequestState = 'idle' | 'loading' | 'success' | 'error';

interface IssueFormProps {
  readonly availability: LiveDemoAvailability;
}

function codePointLength(value: string): number {
  return Array.from(value).length;
}

export function IssueForm({ availability }: IssueFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<AnalysisMode>('preview');
  const [result, setResult] = useState<PublicTriageView | null>(null);
  const [requestState, setRequestState] = useState<RequestState>('idle');
  const [feedback, setFeedback] = useState(
    'Select a synthetic example to begin an offline preview.',
  );
  const [importedIssue, setImportedIssue] =
    useState<ImportedIssueHandoff | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const imported = consumeIssueHandoff(window.sessionStorage);
    if (imported === null) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setImportedIssue(imported);
      setTitle(imported.title);
      setBody(imported.body);
      setMode(availability.liveEnabled ? 'live' : 'preview');
      setFeedback(
        availability.liveEnabled
          ? 'Public GitHub issue imported. Review the text, then choose whether to make one live Jev request.'
          : 'Public GitHub issue imported. Live Jev remains disabled until server access is explicitly configured.',
      );
    });
    return () => {
      cancelled = true;
    };
  }, [availability.liveEnabled]);

  const titleLength = codePointLength(title);
  const bodyLength = codePointLength(body);
  const validTitle =
    title.trim().length > 0 && titleLength <= MAX_TITLE_CODE_POINTS;
  const validBody = bodyLength <= MAX_BODY_CODE_POINTS;
  const loading = requestState === 'loading';
  const selectedScenario = findMatchingPreview(title, body);

  function selectScenario(scenario: PreviewScenario): void {
    setImportedIssue(null);
    setTitle(scenario.title);
    setBody(scenario.body);
    setResult(null);
    setRequestState('idle');
    setFeedback(`${scenario.category} loaded. Run the synthetic preview.`);
  }

  function reset(): void {
    setImportedIssue(null);
    setTitle('');
    setBody('');
    setResult(null);
    setRequestState('idle');
    setFeedback('Form reset. Select a synthetic example or enter an issue.');
  }

  function validateInput(): string | null {
    if (title.trim().length === 0) return 'Enter an issue title.';
    if (titleLength > MAX_TITLE_CODE_POINTS) {
      return `Title must be ${String(MAX_TITLE_CODE_POINTS)} characters or fewer.`;
    }
    if (bodyLength > MAX_BODY_CODE_POINTS) {
      return `Description must be ${String(MAX_BODY_CODE_POINTS)} characters or fewer.`;
    }
    return null;
  }

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (inFlight.current) return;
    const validationError = validateInput();
    if (validationError !== null) {
      setResult(null);
      setRequestState('error');
      setFeedback(validationError);
      return;
    }

    if (mode === 'preview') {
      const scenario = findMatchingPreview(title, body);
      if (scenario === undefined) {
        setResult(null);
        setRequestState('error');
        setFeedback(
          'Preview only supports unmodified sample scenarios. Choose a sample again, or use explicitly enabled live mode for custom input.',
        );
        return;
      }
      setResult(scenario.result);
      setRequestState('success');
      setFeedback(
        'Synthetic preview ready. No API or provider request was made.',
      );
      return;
    }

    if (!availability.liveEnabled) {
      setResult(null);
      setRequestState('error');
      setFeedback(availability.message);
      return;
    }

    inFlight.current = true;
    setRequestState('loading');
    setResult(null);
    setFeedback('Requesting one deliberate live Jev analysis…');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
        cache: 'no-store',
      });
      const parsed = parsePublicApiResponse((await response.json()) as unknown);
      if (!parsed.ok) {
        setRequestState('error');
        setFeedback(parsed.error.message);
        return;
      }
      if (!response.ok || parsed.result.source !== 'live_jev') {
        throw new PublicContractError();
      }
      setResult(parsed.result);
      setRequestState('success');
      setFeedback(
        'Live Jev analysis completed. Labels remain local proposals.',
      );
    } catch (error: unknown) {
      setRequestState('error');
      setFeedback(
        error instanceof PublicContractError
          ? error.message
          : 'The analysis request failed. Check the local server and try again deliberately.',
      );
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className="workbench">
      <section className="input-shell" aria-labelledby="issue-input-heading">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Issue input</p>
            <h2 id="issue-input-heading">Analyze a GitHub issue</h2>
          </div>
          <button className="text-button" type="button" onClick={reset}>
            Reset
          </button>
        </div>

        <div className="mode-switch" role="group" aria-label="Analysis mode">
          <button
            type="button"
            className={mode === 'preview' ? 'active' : ''}
            aria-pressed={mode === 'preview'}
            onClick={() => {
              setMode('preview');
              setResult(null);
              setFeedback(
                'Offline fixture mode selected. No API call will run.',
              );
            }}
          >
            <span>Preview Fixture</span>
            <small>Offline · free</small>
          </button>
          <button
            type="button"
            className={mode === 'live' ? 'active' : ''}
            aria-pressed={mode === 'live'}
            aria-disabled={!availability.liveEnabled}
            disabled={!availability.liveEnabled}
            onClick={() => {
              setMode('live');
              setResult(null);
              setFeedback('Live mode selected. Submit makes one Jev request.');
            }}
          >
            <span>Analyze with Jev</span>
            <small>
              {availability.liveEnabled ? 'Live · billable' : 'Disabled'}
            </small>
          </button>
        </div>

        <p className="availability-note">
          <span aria-hidden="true" />
          {availability.message}
        </p>

        {importedIssue ? (
          <div className="imported-issue-banner" role="status">
            <div>
              <strong>Imported from a public GitHub issue</strong>
              <span>
                {importedIssue.repository}#{importedIssue.number}
              </span>
            </div>
            <a href={importedIssue.htmlUrl} target="_blank" rel="noreferrer">
              View source
            </a>
          </div>
        ) : null}

        <div className="sample-section">
          <div className="sample-heading">
            <span>Synthetic examples</span>
            <small>Safe demo text</small>
          </div>
          <div className="sample-list">
            {PREVIEW_SCENARIOS.map((scenario, index) => (
              <button
                type="button"
                key={scenario.id}
                className={
                  selectedScenario?.id === scenario.id ? 'selected' : ''
                }
                aria-pressed={selectedScenario?.id === scenario.id}
                onClick={() => selectScenario(scenario)}
              >
                <span className="sample-number">0{index + 1}</span>
                <span>
                  <strong>{scenario.category}</strong>
                  <small>{scenario.title}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <form noValidate onSubmit={(event) => void submit(event)}>
          <div className="field-group">
            <div className="field-label">
              <label htmlFor="issue-title">Issue title</label>
              <span
                className={
                  titleLength > MAX_TITLE_CODE_POINTS ? 'over-limit' : ''
                }
              >
                {String(MAX_TITLE_CODE_POINTS - titleLength)} remaining
              </span>
            </div>
            <input
              id="issue-title"
              name="title"
              type="text"
              value={title}
              maxLength={MAX_TITLE_CODE_POINTS}
              required
              aria-invalid={!validTitle && titleLength > 0}
              onChange={(event) => {
                setTitle(event.target.value);
                setResult(null);
              }}
              placeholder="Describe the issue in one clear sentence"
            />
          </div>

          <div className="field-group">
            <div className="field-label">
              <label htmlFor="issue-body">Description</label>
              <span
                className={
                  bodyLength > MAX_BODY_CODE_POINTS ? 'over-limit' : ''
                }
              >
                {String(MAX_BODY_CODE_POINTS - bodyLength)} remaining
              </span>
            </div>
            <textarea
              id="issue-body"
              name="body"
              rows={8}
              value={body}
              maxLength={MAX_BODY_CODE_POINTS}
              aria-invalid={!validBody}
              onChange={(event) => {
                setBody(event.target.value);
                setResult(null);
              }}
              placeholder="Add symptoms, expected behavior, scope, or reproduction details"
            />
          </div>

          <button
            className="analyze-button"
            type="submit"
            disabled={
              loading ||
              !validTitle ||
              !validBody ||
              (importedIssue !== null &&
                !availability.liveEnabled &&
                mode === 'preview')
            }
          >
            <span
              className={loading ? 'button-spinner' : 'button-spark'}
              aria-hidden="true"
            >
              {loading ? '' : '✦'}
            </span>
            {importedIssue !== null &&
            !availability.liveEnabled &&
            mode === 'preview'
              ? 'Live Jev unavailable for imported issue'
              : loading
                ? 'Analyzing once…'
                : mode === 'preview'
                  ? 'Run synthetic preview'
                  : 'Analyze once with Jev'}
          </button>
        </form>

        <div
          className={`feedback feedback-${requestState}`}
          role={requestState === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {feedback}
        </div>
      </section>

      <ResultOverview result={result} />
    </div>
  );
}
