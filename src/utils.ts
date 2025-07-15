const proxyURL =
  import.meta.env.VITE_PROXY_URL || `${window.location.origin}/proxy`;

export function proxyUrl(url: string): string {
  if (!url) {
    return "";
  }
  return `${proxyURL}/${url}`;
}

export function unmangleProxiedUrl(
  originalCalUrl: string,
  mangledEventUrl: string,
) {
  const ogUrl = new URL(originalCalUrl);
  const mangledUrl = new URL(mangledEventUrl);
  ogUrl.pathname = mangledUrl.pathname;
  ogUrl.search = mangledUrl.search;
  ogUrl.hash = mangledUrl.hash;
  return ogUrl.toString();
}
