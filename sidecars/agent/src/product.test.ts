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
    expect(packageJson.version).toBe('1.0.5');
  });

  it('keeps the Esse installer and runtime identities isolated', () => {
    expect(product.windowsSquirrelAppId).not.toBe(product.userDataDirectory);
    expect(product.macosAppBundleId).toMatch(/^com\.renoir\.esse\./);
    expect(product.releasePrefix).toBe('esse');
  });

  it('allows unsigned Windows and ad-hoc macOS releases but rejects partial publisher signing configuration', async () => {
    const buildWorkflow = await readFile(path.resolve('../..', '.github/workflows/release.yml'), 'utf8');
    const publishWorkflow = await readFile(path.resolve('../..', '.github/workflows/release-publish.yml'), 'utf8');
    expect(buildWorkflow).toContain("steps.windows-signing.outputs.enabled == 'true'");
    expect(buildWorkflow).toContain("steps.windows-signing.outputs.enabled == 'false'");
    expect(buildWorkflow).toContain('Windows signing secrets must be configured together or all omitted.');
    expect(buildWorkflow).toContain("steps.macos-signing.outputs.enabled == 'true'");
    expect(buildWorkflow).toContain("steps.macos-signing.outputs.enabled == 'false'");
    expect(buildWorkflow).toContain('macOS signing and notarization secrets must be configured together or all omitted.');
    expect(buildWorkflow).toContain('Verify ad-hoc signed macOS package');
    expect(buildWorkflow).toContain('esse-private-windows-x64');
    expect(buildWorkflow).toContain('esse-private-macos-arm64');
    expect(buildWorkflow).toContain("inputs.runner_mode == 'hosted'");
    expect(buildWorkflow).toContain('Verify independent Esse tag on Windows');
    expect(buildWorkflow).toContain('Verify independent Esse tag on macOS');
    expect(buildWorkflow).toContain('shell: powershell');
    expect(buildWorkflow).toContain('shell: node {0}');
    expect(buildWorkflow).toContain('working-directory: ${{ github.workspace }}');
    expect(buildWorkflow).not.toContain('working-directory: ../..');
    expect(buildWorkflow).not.toContain('cache: npm');
    expect(buildWorkflow).not.toContain('macos-15-intel');
    expect(buildWorkflow).toContain('create-private-release-provenance.mjs');
    expect(publishWorkflow).toContain('workflow_run:');
    expect(publishWorkflow).toContain('actions/download-artifact');
    expect(publishWorkflow).toContain('verify-private-release-provenance.mjs');
    expect(publishWorkflow).toContain('node scripts/create-private-release-metadata.mjs $env:RELEASE_TAG');
    expect(publishWorkflow).toContain('publish-private-release.ps1');
    expect(buildWorkflow).not.toContain('publish-private-release.ps1');
    const metadataScript = await readFile(path.resolve('../..', 'scripts/create-private-release-metadata.mjs'), 'utf8');
    expect(metadataScript).toContain('metadata: "macosArm64"');
    expect(metadataScript).not.toContain('macosX64');
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
