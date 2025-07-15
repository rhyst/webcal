export function proxyUrl(url: string): string {
  if (!url) {
    return "";
  }
  return `${window.location.origin}/proxy/${url}`;
}
