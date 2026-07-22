import { describe, expect, it } from 'vitest';
import { shouldShowOnboarding } from './onboarding-state';

describe('Esse onboarding state', () => {
  it('opens only for a new user without an Esse Key or custom Provider', () => {
    expect(shouldShowOnboarding({ esseService: { configured: false, concurrency: 10 }, onboarding: { dismissed: false }, providers: [] })).toBe(true);
    expect(shouldShowOnboarding({ esseService: { configured: true, concurrency: 10 }, onboarding: { dismissed: false }, providers: [] })).toBe(false);
    expect(shouldShowOnboarding({ esseService: { configured: false, concurrency: 10 }, onboarding: { dismissed: true }, providers: [] })).toBe(false);
    expect(shouldShowOnboarding({
      esseService: { configured: false, concurrency: 10 },
      onboarding: { dismissed: false },
      providers: [{ id: 'custom' }],
    })).toBe(false);
  });
});
