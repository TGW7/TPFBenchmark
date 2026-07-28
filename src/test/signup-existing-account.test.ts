import { describe, expect, it } from 'vitest';
import {
  isPreExistingAccount,
  STALE_ACCOUNT_THRESHOLD_MS,
} from '../lib/signup_existing_account';

const NOW = Date.parse('2026-07-28T12:00:00Z');
const justNow = new Date(NOW - 1_000).toISOString();
const longAgo = new Date(NOW - 400 * 24 * 60 * 60 * 1000).toISOString();

describe('isPreExistingAccount', () => {
  it('treats a missing user as not pre-existing', () => {
    expect(isPreExistingAccount(null, NOW)).toBe(false);
    expect(isPreExistingAccount(undefined, NOW)).toBe(false);
  });

  it('detects a confirmed existing account by its empty identities array', () => {
    expect(isPreExistingAccount({ identities: [], created_at: justNow }, NOW)).toBe(true);
  });

  it('detects an unconfirmed existing account by a stale created_at', () => {
    // identities looks exactly like a genuine signup here — only the age tells.
    expect(isPreExistingAccount({ identities: [{}], created_at: longAgo }, NOW)).toBe(true);
  });

  it('lets a genuine brand-new signup through', () => {
    expect(isPreExistingAccount({ identities: [{}], created_at: justNow }, NOW)).toBe(false);
  });

  it('tolerates clock skew up to the threshold', () => {
    const withinSkew = new Date(NOW - (STALE_ACCOUNT_THRESHOLD_MS - 5_000)).toISOString();
    expect(isPreExistingAccount({ identities: [{}], created_at: withinSkew }, NOW)).toBe(false);
  });

  it('ignores an unparseable created_at rather than guessing', () => {
    expect(isPreExistingAccount({ identities: [{}], created_at: 'not a date' }, NOW)).toBe(false);
  });
});
