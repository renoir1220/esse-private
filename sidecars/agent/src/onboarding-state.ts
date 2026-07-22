import type { EsseServiceStatus, OnboardingStatus } from './types';

export function shouldShowOnboarding(state: { esseService: EsseServiceStatus; onboarding: OnboardingStatus; providers: readonly unknown[] }): boolean {
  return !state.onboarding.dismissed && !state.esseService.configured && state.providers.length === 0;
}
