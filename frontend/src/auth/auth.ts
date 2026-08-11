const OWNER_EMAIL = 'superluckyyab@163.com';

interface UserClaims {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

export function createAdminCredentials(username: string, password: string) {
  if (username.trim().toLowerCase() !== 'admin' || !password) {
    throw new Error('Invalid username or password.');
  }

  return { email: OWNER_EMAIL, password };
}

export function isOwner(user: UserClaims | null | undefined): boolean {
  return user?.app_metadata?.role === 'owner';
}
