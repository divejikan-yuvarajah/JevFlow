import type { SystemOneRequest, SystemOneResult } from '@typesafe-ai/sdk';

import type { JevQuestions } from './questions.js';

export type JevSystemOneRequest = SystemOneRequest<JevQuestions>;
export type JevSystemOneResponse = SystemOneResult<JevQuestions>;

export interface JevProvider {
  systemOne(request: JevSystemOneRequest): Promise<JevSystemOneResponse>;
}
