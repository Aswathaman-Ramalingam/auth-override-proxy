import { createUpstreamHeaders, removeHopByHopHeaders } from "./headers";
import { buildUpstreamUrl, requestCanHaveBody } from "./upstream";
import type { ProxyConfig } from "./type";

export function createProxyHandler(
  config: ProxyConfig,
  basicAuthorization: string,
): (request: Request) => Promise<Response> {
  return async function proxyHandler(request: Request): Promise<Response> {
    const upstreamUrl = buildUpstreamUrl(request, config.upstream);
    const headers = createUpstreamHeaders(request.headers, basicAuthorization);

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers,
        body: requestCanHaveBody(request.method) ? request.body : undefined,
        redirect: "manual",
        duplex: requestCanHaveBody(request.method) ? "half" : undefined,
      } as RequestInit);

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: removeHopByHopHeaders(upstreamResponse.headers),
      });
    } catch (error) {
      console.error(
        `Unable to proxy ${request.method} ${upstreamUrl.toString()}:`,
        error,
      );

      return Response.json(
        {
          error: "Bad Gateway",
          message: "The proxy could not connect to the upstream service.",
        },
        { status: 502 },
      );
    }
  };
}
