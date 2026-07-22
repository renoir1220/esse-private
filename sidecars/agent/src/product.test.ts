import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import product from '../product.json';

describe('desktop product profile', () => {
  it('starts the independent Esse release line at 1.0.0', async () => {
    const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8')) as { name: string; private: boolean; productName: string; version: string };
    expect(product.edition).toBe('esse');
    expect(packageJson.name).toBe('@esse/desktop');
    expect(packageJson.private).toBe(true);
    expect(packageJson.productName).toBe(product.displayName);
    expect(packageJson.version).toBe('1.0.0');
  });

  it('keeps the Esse installer and runtime identities isolated', () => {
    expect(product.windowsSquirrelAppId).not.toBe(product.userDataDirectory);
    expect(product.macosAppBundleId).toMatch(/^com\.renoir\.esse\./);
    expect(product.releasePrefix).toBe('esse');
  });
});
