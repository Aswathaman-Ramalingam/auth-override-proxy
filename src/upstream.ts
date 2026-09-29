import type { ProxyConfig } from "./type";

export function createBasicAuthorization(config: ProxyConfig): string {
  const credentials = `${config.username}:${config.password}`;
  return `Basic ${btoa(credentials)}`;
}

export function buildUpstreamUrl(
  request: Request,
  upstreamBaseUrl: string,
): URL {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(upstreamBaseUrl);

  const basePath = upstreamUrl.pathname.replace(/\/$/, "");
  const requestPath = incomingUrl.pathname.replace(/^\//, "");

  upstreamUrl.pathname = [basePath, requestPath]
    .filter(Boolean)
    .join("/")
    .replace(/^([^/])/, "/$1");

  upstreamUrl.search = incomingUrl.search;

  return upstreamUrl;
}

export function requestCanHaveBody(method: string): boolean {
  return method !== "GET" && method !== "HEAD";
}
