import { describe, expect, it } from 'vitest';
import { AUTH_COPY } from './authCopy';

describe('authentication copy', () => {
  it('contains English-only user-facing text', () => {
    const copy = Object.values(AUTH_COPY).join(' ');
    expect(copy).not.toMatch(/[\u3400-\u9fff]/u);
    expect(AUTH_COPY.guestAction).toBe('Continue as guest');
    expect(AUTH_COPY.signOut).toBe('Sign out');
  });
});
