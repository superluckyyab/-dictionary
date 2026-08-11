import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import TopTabs from '../components/TopTabs';
import { SignedOutView } from './AuthGate';

describe('authentication presentation', () => {
  it('keeps the original dictionary chrome visible behind the sign-in modal', () => {
    const html = renderToStaticMarkup(createElement(SignedOutView, {
      username: 'admin',
      password: '',
      submitting: false,
      error: '',
      configured: true,
      onUsernameChange: () => undefined,
      onPasswordChange: () => undefined,
      onAdminLogin: () => undefined,
      onGuestLogin: () => undefined,
    }));

    expect(html).toContain('English Dictionary');
    expect(html).toContain('CEFR A1–C2 vocabulary');
    expect(html).toContain('All');
    expect(html).toContain('Unknown');
    expect(html).toContain('Known');
    expect(html).toContain('Bookmarked');
    expect(html).toContain('Search a word');
    expect(html).toContain('fixed inset-0 bg-black/40');
    expect(html).toContain('Sign in');
    expect(html).not.toContain('min-h-screen bg-[#EAE3D2] grid place-items-center');
  });

  it('keeps the original owner action group free of authentication controls', () => {
    const html = renderToStaticMarkup(createElement(TopTabs, {
      activeTab: 'all',
      onTabChange: () => undefined,
      stats: { total: 96, known: 0, unknown: 96, bookmarked: 0, by_level: {} },
      onAddWord: () => undefined,
      onImport: () => undefined,
      owner: true,
    }));

    expect(html).toContain('>Add Word</button>');
    expect(html).toContain('>Import</button>');
    expect(html).not.toContain('Sign out');
  });
});
