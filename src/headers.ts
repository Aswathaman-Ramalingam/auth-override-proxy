const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export function removeHopByHopHeaders(headers: Headers): Headers {
  const result = new Headers(headers);

  const connectionHeader = result.get("connection");

  if (connectionHeader) {
    for (const headerName of connectionHeader.split(",")) {
      result.delete(headerName.trim());
    }
  }

  for (const headerName of HOP_BY_HOP_HEADERS) {
    result.delete(headerName);
  }

  return result;
}

export function createUpstreamHeaders(
  requestHeaders: Headers,
  basicAuthorization: string,
): Headers {
  const headers = removeHopByHopHeaders(requestHeaders);

  // Destination host must be generated for the actual upstream.
  headers.delete("host");

  // Client authentication is intentionally override here.
  headers.set("authorization", basicAuthorization);

  return headers;
}
