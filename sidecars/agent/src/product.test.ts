import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import product from '../product.json';

describe('desktop product profile', () => {
  it('keeps the independent Esse release line and product identity aligned', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8')) as { name: string; private: boolean; productName: string; version: string };
    expect(product.edition).toBe('esse');
    expect(packageJson.name).toBe('@esse/desktop');
    expect(packageJson.private).toBe(true);
    expect(packageJson.productName).toBe(product.displayName);
    expect(packageJson.version).toBe('1.0.1');
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
  });
});
