import { describe, expect, it } from 'vitest';
import { createAdminCredentials, isOwner } from './auth';

describe('createAdminCredentials', () => {
  it('maps the visible admin username to the internal owner identity', () => {
    expect(createAdminCredentials('admin', 'example-password')).toEqual({
      email: 'superluckyyab@163.com',
      password: 'example-password',
    });
  });

  it('rejects any username other than admin without revealing account details', () => {
    expect(() => createAdminCredentials('someone', 'example-password')).toThrow(
      'Invalid username or password.',
    );
  });
});

describe('isOwner', () => {
  it('trusts only the owner role in app metadata', () => {
    expect(isOwner({ app_metadata: { role: 'owner' }, user_metadata: {} })).toBe(true);
    expect(isOwner({ app_metadata: {}, user_metadata: { role: 'owner' } })).toBe(false);
  });
});
