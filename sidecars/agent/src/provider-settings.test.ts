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
      expect.objectContaining({ providerName: '兔子', providerType: 'tuzi-json-images', tierName: 'default', configured: true, priceMicros: 0, price: { mode: 'unknown', currency: 'CNY' } }),
      expect.objectContaining({ canonicalModelId: 'image2-v', providerModelId: 'gpt-image-2', displayName: 'image2-v' }),
      expect.objectContaining({ canonicalModelId: 'gemini-3-pro-image-preview-4k', providerModelId: 'gemini-3-pro-image-preview-4k' }),
    ]));
    expect(await store.listCustomProfiles()).toEqual([expect.objectContaining({ displayName: '兔子', tierName: 'default' })]);
    expect(await store.hasEsseKey()).toBe(true);

    await expect(store.saveProvider({ ...draft, id: saved.id, concurrency: 24 })).resolves.toMatchObject({ concurrency: 24 });
    await expect(store.saveProvider({ ...draft, id: saved.id, concurrency: 1.5 })).rejects.toThrow(/正整数/);
    await expect(store.saveProvider({ ...draft, id: saved.id, concurrency: 0 })).rejects.toThrow(/正整数/);

    await store.deleteProvider(saved.id);
    expect(await store.listProfiles()).toEqual([]);
    await expect(store.getApiKey(saved.id)).rejects.toThrow(/没有可用的 Key/);
  });

  it('tests and provisions a single Esse Key as the preconfigured Tuzi Provider', async () => {
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
    expect(await store.listCustomProfiles()).toEqual([expect.objectContaining({ id: ESSE_MANAGED_PROVIDER_ID, displayName: '兔子', tierName: 'default' })]);
    expect(await store.listOfferings()).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerName: '兔子', providerType: 'tuzi-json-images', tierName: 'default', configured: true }),
    ]));

    await expect(store.saveEsseConcurrency(7)).resolves.toBe(7);
    expect(await store.getEsseConcurrency()).toBe(7);
    expect(await store.listOfferings()).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerType: 'tuzi-json-images', concurrency: 7 }),
    ]));
    await expect(store.saveEsseConcurrency(24)).resolves.toBe(24);
    await expect(store.saveEsseConcurrency(1.5)).rejects.toThrow(/正整数/);
    await expect(store.saveEsseConcurrency(0)).rejects.toThrow(/正整数/);
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
      expect.objectContaining({ providerType: 'tuzi-json-images', concurrency: 10, configured: true }),
    ]));
  });

  it('preserves a managed Provider model list after the user disables a model', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'esse-managed-catalog-migration-'));
    temporaryDirectories.push(directory);
    const store = new ProviderSettingsStore(path.join(directory, 'providers.json'), new MemoryCredentials() as unknown as CredentialStore);
    const legacy = createTuziProviderDraft('tuzi-default');
    legacy.offerings = [{
      ...legacy.offerings[0],
      price: { mode: 'per_request', currency: 'CNY', amount: 0.035, note: 'legacy built-in price' },
    }];
    const saved = await store.saveProvider(legacy);

    const profile = await store.getProfile(saved.id);
    expect(profile.offerings).toHaveLength(1);
    expect(profile.offerings[0]).toEqual(expect.objectContaining({ displayName: 'GPT-Image 2', providerModelId: 'gpt-image-2', price: { mode: 'per_request', currency: 'CNY', amount: 0.035, note: 'legacy built-in price' } }));
  });

  it('renames the untouched legacy managed profile without restoring removed models', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'esse-managed-presentation-migration-'));
    temporaryDirectories.push(directory);
    const store = new ProviderSettingsStore(path.join(directory, 'providers.json'), new MemoryCredentials() as unknown as CredentialStore);
    const legacy = createTuziProviderDraft('tuzi-default');
    legacy.id = ESSE_MANAGED_PROVIDER_ID;
    legacy.displayName = 'Esse';
    legacy.tierName = '内置';
    legacy.offerings = [legacy.offerings[0]];

    await store.saveProvider(legacy);

    const profile = await store.getProfile(ESSE_MANAGED_PROVIDER_ID);
    expect(profile).toEqual(expect.objectContaining({ displayName: '兔子', tierName: 'default' }));
    expect(profile.offerings).toHaveLength(1);
  });

  it('publishes managed Provider URL and model edits through the live offering registry', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'esse-managed-live-offerings-'));
    temporaryDirectories.push(directory);
    const store = new ProviderSettingsStore(path.join(directory, 'providers.json'), new MemoryCredentials() as unknown as CredentialStore);
    const saved = await store.saveEsseKey('customer-key');
    const retained = saved.offerings[0];
    const added = {
      ...saved.offerings[1],
      id: '',
      canonicalModelId: 'new-image-model',
      providerModelId: 'new-image-model',
      displayName: 'New Image Model',
    };

    const edited = await store.saveProvider({
      id: saved.id,
      displayName: saved.displayName,
      tierName: saved.tierName,
      baseUrl: 'https://images.example',
      adapterId: saved.adapterId,
      concurrency: saved.concurrency,
      offerings: [retained, added],
    });

    expect(edited.offerings).toHaveLength(2);
    expect(await store.listOfferings()).toEqual([
      expect.objectContaining({ id: retained.id, providerName: '兔子', configured: true }),
      expect.objectContaining({ canonicalModelId: 'new-image-model', providerModelId: 'new-image-model', configured: true }),
    ]);
    await expect(store.resolveOffering(edited.offerings[1].id)).resolves.toMatchObject({
      profile: { baseUrl: 'https://images.example' },
      offering: { providerModelId: 'new-image-model' },
    });
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
