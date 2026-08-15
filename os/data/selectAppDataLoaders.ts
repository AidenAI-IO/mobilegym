export function selectAppDataLoaders<T>(
  loaders: ReadonlyMap<string, T>,
  appIds?: readonly string[],
): Array<[string, T]> {
  if (appIds === undefined) return Array.from(loaders.entries());

  const requested = new Set(appIds);
  return Array.from(loaders.entries()).filter(([appId]) => requested.has(appId));
}
