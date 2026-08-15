import { describe, expect, it } from 'vitest';
import { runAppDataLoaderModule } from '../os/appDataLoaderReady';
import { selectAppDataLoaders } from '../os/data/selectAppDataLoaders';

describe('app data loader readiness protocol', () => {
  it('runs preload, hydrateStore, then waitReady in order', async () => {
    const calls: string[] = [];

    await runAppDataLoaderModule({
      preload: async () => { calls.push('preload'); },
      hydrateStore: async () => { calls.push('hydrateStore'); },
      waitReady: async () => { calls.push('waitReady'); },
    });

    expect(calls).toEqual(['preload', 'hydrateStore', 'waitReady']);
  });
});

describe('app data loader selection', () => {
  const loaders = new Map([
    ['settings', async () => ({})],
    ['redbook', async () => ({})],
  ]);

  it('loads every registered app only when app ids are omitted', () => {
    expect(selectAppDataLoaders(loaders, undefined).map(([id]) => id)).toEqual([
      'settings',
      'redbook',
    ]);
  });

  it('loads no apps for an explicit empty list', () => {
    expect(selectAppDataLoaders(loaders, [])).toEqual([]);
  });

  it('loads only explicitly requested apps', () => {
    expect(selectAppDataLoaders(loaders, ['redbook']).map(([id]) => id)).toEqual([
      'redbook',
    ]);
  });
});
