import type { PolicyReasonCode } from '../../dist/policy/policy.types.js';

export const POLICY_REASON_COPY: Readonly<Record<PolicyReasonCode, string>> = {
  choice_auto_threshold_met:
    'All typed choices meet the automatic action threshold.',
  choice_review_threshold_met:
    'Typed choices meet the review threshold but need a maintainer glance.',
  choice_below_review_threshold:
    'At least one typed choice is below the review threshold.',
  critical_priority_manual_review:
    'Critical priority always requires a human decision.',
  security_probability_manual_review:
    'Security P(YES) reached the manual review threshold; this is not a confirmed vulnerability.',
  human_review_probability_manual_review:
    'Needs-human-review P(YES) reached the manual review threshold.',
  security_probability_caution: 'Security P(YES) reached the caution range.',
  human_review_probability_caution:
    'Needs-human-review P(YES) reached the caution range.',
  input_truncated_review_suggested:
    'Some issue input was truncated before analysis.',
};
