export function parseMapToOptions<T extends Record<string, string>>(map: T) {
  return Object.entries(map).map(([key, value]) => ({
    label: value,
    value: key,
  }))
}
