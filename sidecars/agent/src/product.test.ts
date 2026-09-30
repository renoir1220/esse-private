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
    expect(product.releaseVersionPolicy).toBe('independent-sidecar');
    expect(packageJson.version).toMatch(/^[1-9]\d*\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
    const packageLock = JSON.parse(await readFile(path.resolve('package-lock.json'), 'utf8')) as { version: string; packages: { '': { version: string } } };
    expect(packageLock.version).toBe(packageJson.version);
    expect(packageLock.packages[''].version).toBe(packageJson.version);
  });

  it('keeps the Esse installer and runtime identities isolated', () => {
    expect(product.windowsSquirrelAppId).not.toBe(product.userDataDirectory);
    expect(product.macosAppBundleId).toMatch(/^com\.renoir\.esse\./);
    expect(product.releasePrefix).toBe('esse');
  });

  it('publishes only hosted macOS ARM64 with verified signing and same-run provenance', async () => {
    const ciWorkflow = await readFile(path.resolve('../..', '.github/workflows/ci.yml'), 'utf8');
    const buildWorkflow = await readFile(path.resolve('../..', '.github/workflows/release.yml'), 'utf8');
    for (const workflow of [ciWorkflow, buildWorkflow]) {
      expect(workflow).toContain('runs-on: macos-15');
      expect(workflow).toContain('runs-on: ubuntu-24.04');
      expect(workflow).toContain('cache: npm');
      expect(workflow).toContain('retention-days: 1');
      expect(workflow).not.toMatch(/self-hosted|windows-latest|macos-15-intel|runner_mode/);
    }
    expect(buildWorkflow).toContain("steps.macos-signing.outputs.enabled == 'true'");
    expect(buildWorkflow).toContain("steps.macos-signing.outputs.enabled == 'false'");
    expect(buildWorkflow).toContain('macOS signing and notarization secrets must be configured together or all omitted.');
    expect(buildWorkflow).toContain('bash scripts/verify-macos-bundle.sh arm64 --require-signed');
    expect(buildWorkflow).toContain('bash scripts/verify-macos-bundle.sh arm64');
    expect(buildWorkflow).not.toContain('WINDOWS_CERTIFICATE');
    expect(buildWorkflow).toContain('git merge-base --is-ancestor');
    expect(buildWorkflow).toContain('prepare-private-release-notes.mjs');
    expect(buildWorkflow).not.toContain('release-notes-prefix.md');
    expect(buildWorkflow).toContain('working-directory: ${{ github.workspace }}');
    expect(buildWorkflow).toContain('create-private-release-provenance.mjs');
    expect(buildWorkflow).toContain('needs: package');
    expect(buildWorkflow).toContain('actions/download-artifact');
    expect(buildWorkflow).toContain('name: esse-release-macos-arm64-${{ needs.package.outputs.commit }}');
    expect(buildWorkflow).toContain('verify-private-release-provenance.mjs');
    expect(buildWorkflow).toContain('node scripts/create-private-release-metadata.mjs "$RELEASE_TAG"');
    expect(buildWorkflow).toContain('refusing to overwrite it');
    expect(buildWorkflow).not.toMatch(/workflow_run:|build_run_id|--clobber/);
    const metadataScript = await readFile(path.resolve('../..', 'scripts/create-private-release-metadata.mjs'), 'utf8');
    expect(metadataScript).toContain('metadata: "macosArm64"');
    expect(metadataScript).not.toMatch(/macosX64|windowsX64/);
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
