import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DesktopSettingsStore } from './desktop-settings';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  for (const directory of temporaryDirectories.splice(0)) await rm(directory, { recursive: true, force: true });
});

describe('Desktop settings', () => {
  it('persists onboarding dismissal without changing the default model', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'esse-desktop-settings-'));
    temporaryDirectories.push(directory);
    const filePath = path.join(directory, 'settings.json');
    const store = new DesktopSettingsStore(filePath);

    await store.setDefaultOfferingId('model-1');
    await store.setOnboardingDismissed(true);

    const reloaded = new DesktopSettingsStore(filePath);
    await expect(reloaded.getDefaultOfferingId()).resolves.toBe('model-1');
    await expect(reloaded.getOnboardingDismissed()).resolves.toBe(true);
  });
});
