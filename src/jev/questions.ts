import { choice, noul } from '@typesafe-ai/sdk';

import {
  type EngineeringArea,
  type IssuePriority,
  type IssueType,
} from '../domain/constants.js';

export const ISSUE_TYPE_CRITERIA = {
  bug: 'A reported defect or failure in existing behavior.',
  feature: 'A request for a new capability or behavior.',
  documentation: 'A change to documentation, examples, or setup text.',
  question: 'A request for explanation, support, or discussion.',
  maintenance:
    'Routine upkeep, dependency updates, versioning, or refactoring.',
} as const satisfies Record<IssueType, string>;

export const ENGINEERING_AREA_CRITERIA = {
  frontend: 'User interface, browser behavior, or client presentation.',
  backend: 'Server, API, service, or business logic.',
  database: 'Data persistence, queries, schema, or migrations.',
  devops: 'Continuous integration, deployment, or infrastructure.',
  ai: 'Models, inference, retrieval, prompts, or AI integrations.',
  security:
    'Authorization, information exposure, credentials, or security controls.',
  general: 'Cross-cutting or unclear ownership among the listed areas.',
} as const satisfies Record<EngineeringArea, string>;

export const PRIORITY_CRITERIA = {
  critical:
    'Major outage, high-impact exposure, data loss, or urgent severe impact.',
  high: 'Serious functionality or business impact requiring prompt attention.',
  medium: 'Material but noncritical impairment.',
  low: 'Minor, cosmetic, or optional improvement.',
} as const satisfies Record<IssuePriority, string>;

export const JEV_QUESTIONS = {
  issueType: choice(
    'Classify the issue by its primary request or reported problem.',
    ISSUE_TYPE_CRITERIA,
  ),
  engineeringArea: choice(
    'Select the engineering area that most directly owns the issue.',
    ENGINEERING_AREA_CRITERIA,
  ),
  priority: choice(
    'Suggest the issue priority from its described impact. This is a classification suggestion, not proof of severity.',
    PRIORITY_CRITERIA,
  ),
  securitySensitive: noul(
    'Does the issue credibly relate to security or privacy concerns?',
    {
      true: 'Abuse, authentication, authorization, confidentiality, privacy, exposed credentials, or a similar concern is plausibly involved.',
      false:
        'The issue has no credible security or privacy relevance in the supplied evidence.',
    },
  ),
  needsHumanReview: noul(
    'Does this issue require human judgment before automated action?',
    {
      true: 'The issue is ambiguous, lacks evidence, is consequential, is plausibly security-sensitive, or otherwise needs manual judgment.',
      false:
        'The issue is sufficiently clear and low-risk for later deterministic policy evaluation.',
    },
  ),
} as const;

export type JevQuestions = typeof JEV_QUESTIONS;
