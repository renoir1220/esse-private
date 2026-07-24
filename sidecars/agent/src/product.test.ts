import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { sanitizeProviderError } from './api-client';
import product from '../product.json';

describe('desktop product profile', () => {
  it('keeps the independent Esse release line and product identity aligned', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8')) as { name: string; private: boolean; productName: string; version: string };
    expect(product.edition).toBe('esse');
    expect(packageJson.name).toBe('@esse/desktop');
    expect(packageJson.private).toBe(true);
    expect(packageJson.productName).toBe(product.displayName);
    expect(packageJson.version).toBe('1.0.3');
  });

  it('keeps the Esse installer and runtime identities isolated', () => {
    expect(product.windowsSquirrelAppId).not.toBe(product.userDataDirectory);
    expect(product.macosAppBundleId).toMatch(/^com\.renoir\.esse\./);
    expect(product.releasePrefix).toBe('esse');
  });

  it('allows fully unsigned releases but rejects partial signing configuration', async () => {
    const workflow = await readFile(path.resolve('../..', '.github/workflows/release.yml'), 'utf8');
    expect(workflow).toContain("steps.windows-signing.outputs.enabled == 'true'");
    expect(workflow).toContain("steps.windows-signing.outputs.enabled == 'false'");
    expect(workflow).toContain('Windows signing secrets must be configured together or all omitted.');
    expect(workflow).toContain("steps.macos-signing.outputs.enabled == 'true'");
    expect(workflow).toContain("steps.macos-signing.outputs.enabled == 'false'");
    expect(workflow).toContain('macOS signing and notarization secrets must be configured together or all omitted.');
    expect(workflow).toContain('esse-private-windows-x64');
    expect(workflow).toContain('esse-private-macos-arm64');
    expect(workflow).toContain("inputs.runner_mode == 'hosted'");
    expect(workflow).toContain('Verify independent Esse tag on Windows');
    expect(workflow).toContain('Verify independent Esse tag on macOS');
    expect(workflow).toContain('shell: powershell');
  });

  it('hides upstream Provider identity from private error surfaces', () => {
    expect(product.errorAttribution.showProviderIdentity).toBe(false);
    expect(product.errorAttribution.redactProviderTerms).toEqual(expect.arrayContaining([
      'tuzi',
      'tu-zi',
      '兔子',
      'api.tu-zi.com',
    ]));
    expect(sanitizeProviderError(
      'Tuzi at https://api.tu-zi.com: low balance',
      { displayName: 'Tuzi', baseUrl: 'https://api.tu-zi.com' },
    )).toBe('上游服务 at 上游服务: low balance');
  });
});
