import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCustomProviderDraft, createTuziProviderDraft, ESSE_MANAGED_PROVIDER_ID } from './provider-catalog';
import { ProviderSettingsStore } from './provider-settings';
import type { CredentialStore } from './credential-store';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  for (const directory of temporaryDirectories.splice(0)) await rm(directory, { recursive: true, force: true });
});

describe('Provider settings', () => {
  it('keeps API keys out of provider JSON and exposes configured offerings', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'esse-provider-settings-'));
    temporaryDirectories.push(directory);
    const credentials = new MemoryCredentials();
    const filePath = path.join(directory, 'providers.json');
    const store = new ProviderSettingsStore(filePath, credentials as unknown as CredentialStore);
    const draft = createTuziProviderDraft('tuzi-default');
    const saved = await store.saveProvider({ ...draft, apiKey: 'private-provider-key' });

    expect(saved.hasApiKey).toBe(true);
    expect(await store.getApiKey(saved.id)).toBe('private-provider-key');
    expect(await readFile(filePath, 'utf8')).not.toContain('private-provider-key');
    expect(await store.listOfferings()).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerName: 'Esse', providerType: 'esse-managed', tierName: '内置', configured: true, priceMicros: 35_000 }),
    ]));
    expect(await store.listCustomProfiles()).toEqual([]);
    expect(await store.hasEsseKey()).toBe(true);

    await store.deleteProvider(saved.id);
    expect(await store.listProfiles()).toEqual([]);
    await expect(store.getApiKey(saved.id)).rejects.toThrow(/没有可用的 Key/);
  });

  it('tests and provisions a single Esse Key without exposing the managed connection as a custom Provider', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'esse-managed-key-'));
    temporaryDirectories.push(directory);
    const credentials = new MemoryCredentials();
    const store = new ProviderSettingsStore(path.join(directory, 'providers.json'), credentials as unknown as CredentialStore);
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe('https://api.tu-zi.com/v1/models');
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer customer-esse-key');
      return new Response(JSON.stringify({ data: [{ id: 'gpt-image-2' }] }), { status: 200 });
    }) as unknown as typeof fetch;

    await expect(store.testEsseKey('customer-esse-key', fetchMock)).resolves.toMatchObject({ models: ['gpt-image-2'] });
    const saved = await store.saveEsseKey('customer-esse-key');

    expect(saved.id).toBe(ESSE_MANAGED_PROVIDER_ID);
    expect(saved.concurrency).toBe(10);
    expect(await store.getEsseConcurrency()).toBe(10);
    expect(await store.hasEsseKey()).toBe(true);
    expect(await store.listCustomProfiles()).toEqual([]);
    expect(await store.listOfferings()).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerName: 'Esse', providerType: 'esse-managed', configured: true }),
    ]));

    await expect(store.saveEsseConcurrency(7)).resolves.toBe(7);
    expect(await store.getEsseConcurrency()).toBe(7);
    expect(await store.listOfferings()).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerType: 'esse-managed', concurrency: 7 }),
    ]));
  });

  it('keeps a user-created Provider available only through advanced settings', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'esse-custom-provider-'));
    temporaryDirectories.push(directory);
    const store = new ProviderSettingsStore(path.join(directory, 'providers.json'), new MemoryCredentials() as unknown as CredentialStore);
    const draft = createCustomProviderDraft();
    draft.displayName = 'My Images';
    draft.tierName = 'Pro';
    draft.baseUrl = 'https://images.example';
    draft.offerings[0] = {
      ...draft.offerings[0],
      canonicalModelId: 'image-model',
      providerModelId: 'image-model',
      displayName: 'Image Model',
    };
    const saved = await store.saveProvider({ ...draft, apiKey: 'custom-key' });

    expect(await store.listCustomProfiles()).toEqual([expect.objectContaining({ id: saved.id, displayName: 'My Images' })]);
    expect(await store.hasEsseKey()).toBe(false);
  });

  it('migrates the old managed preset concurrency to 10 when its Key is reconnected', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'esse-managed-migration-'));
    temporaryDirectories.push(directory);
    const store = new ProviderSettingsStore(path.join(directory, 'providers.json'), new MemoryCredentials() as unknown as CredentialStore);
    const legacy = await store.saveProvider(createTuziProviderDraft('tuzi-default'));

    expect(legacy.concurrency).toBe(3);
    expect(await store.getEsseConcurrency()).toBe(10);
    expect(await store.listProfiles()).toEqual(expect.arrayContaining([expect.objectContaining({ id: legacy.id, concurrency: 10 })]));
    await expect(store.saveEsseKey('replacement-key')).resolves.toMatchObject({ id: legacy.id, concurrency: 10 });
    expect(await store.listOfferings()).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerType: 'esse-managed', concurrency: 10, configured: true }),
    ]));
  });

  it('requires HTTPS except for an explicit loopback Provider', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'esse-provider-url-'));
    temporaryDirectories.push(directory);
    const store = new ProviderSettingsStore(path.join(directory, 'providers.json'), new MemoryCredentials() as unknown as CredentialStore);
    const draft = createTuziProviderDraft('tuzi-default');
    await expect(store.saveProvider({ ...draft, baseUrl: 'http://provider.example', apiKey: 'key' })).rejects.toThrow(/HTTPS/);
    await expect(store.saveProvider({ ...draft, baseUrl: 'http://127.0.0.1:9999', apiKey: 'key' })).resolves.toMatchObject({ baseUrl: 'http://127.0.0.1:9999' });
  });
});

class MemoryCredentials {
  private readonly values = new Map<string, string>();
  async get(id: string) { return this.values.get(id); }
  async has(id: string) { return this.values.has(id); }
  async set(id: string, value: string) { this.values.set(id, value); }
  async delete(id: string) { this.values.delete(id); }
}
