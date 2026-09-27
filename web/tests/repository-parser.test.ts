import { describe, expect, it } from 'vitest';
import {
  parseRepositoryInput,
  RepositoryInputError,
} from '@/lib/github/parse-repository-input';

describe('public repository input parser', () => {
  it.each([
    ['owner/repo', 'owner/repo'],
    ['https://github.com/owner/repo', 'owner/repo'],
    ['https://github.com/Owner/Repo/', 'Owner/Repo'],
    ['Owner/Repo.git', 'Owner/Repo'],
    ['https://GITHUB.com/Owner/Repo.git', 'Owner/Repo'],
  ])('normalizes %s', (input, fullName) => {
    expect(parseRepositoryInput(input)).toMatchObject({
      fullName,
      url: `https://github.com/${fullName}`,
    });
  });

  it.each([
    '',
    'https://github.example/owner/repo',
    'http://github.com/owner/repo',
    'https://github.com:443/owner/repo',
    'https://user@github.com/owner/repo',
    'https://github.com/owner/repo/issues/5',
    'https://github.com/owner/repo?tab=issues',
    'https://github.com/owner/repo#readme',
    'owner/repo/extra',
    '../owner/repo',
    'owner%2Frepo/name',
    'owner\\repo',
    'owner/repo.git.git',
    `owner/${'r'.repeat(101)}`,
    `${'o'.repeat(40)}/repo`,
    'owner/repo\nnext',
  ])('rejects unsafe input %s', (input) => {
    expect(() => parseRepositoryInput(input)).toThrow(RepositoryInputError);
  });
});
