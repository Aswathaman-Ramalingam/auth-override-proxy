import http, {
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { Readable } from "node:stream";

import { createProxyHandler } from "./proxy";
import { createBasicAuthorization } from "./upstream";
import type { AppOptions, ProxyConfig } from "./type";

function toWebRequest(request: IncomingMessage): Request {
  const protocol = (request.socket as import("node:tls").TLSSocket).encrypted
    ? "https"
    : "http";

  const host = request.headers.host ?? "localhost";
  const url = new URL(request.url ?? "/", `${protocol}://${host}`);

  const method = request.method ?? "GET";
  const mayHaveBody = method !== "GET" && method !== "HEAD";

  return new Request(url, {
    method,
    headers: request.headers as HeadersInit,
    body: mayHaveBody ? Readable.toWeb(request) : undefined,
    duplex: mayHaveBody ? "half" : undefined,
  } as RequestInit);
}

async function writeWebResponse(
  nodeResponse: ServerResponse,
  webResponse: Response,
): Promise<void> {
  nodeResponse.statusCode = webResponse.status;
  nodeResponse.statusMessage = webResponse.statusText;

  for (const [name, value] of webResponse.headers.entries()) {
    nodeResponse.setHeader(name, value);
  }

  if (!webResponse.body) {
    nodeResponse.end();
    return;
  }

  const body = Readable.fromWeb(
    webResponse.body as unknown as import("node:stream/web").ReadableStream,
  );

  await new Promise<void>((resolve, reject) => {
    body.on("error", reject);
    nodeResponse.on("error", reject);
    nodeResponse.on("finish", resolve);

    body.pipe(nodeResponse);
  });
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  proxyHandler: (request: Request) => Promise<Response>,
): Promise<void> {
  try {
    const webRequest = toWebRequest(request);
    const webResponse = await proxyHandler(webRequest);

    await writeWebResponse(response, webResponse);
  } catch (error) {
    console.error("Proxy request failed:", error);

    if (!response.headersSent) {
      response.writeHead(500, {
        "content-type": "application/json; charset=utf-8",
      });
    }

    response.end(
      JSON.stringify({
        error: "Internal Server Error",
        message: "The proxy could not process this request.",
      }),
    );
  }
}

export function startServer(config: ProxyConfig, options: AppOptions): Server {
  const basicAuthorization = createBasicAuthorization(config);
  const proxyHandler = createProxyHandler(config, basicAuthorization);

  const server = http.createServer((request, response) => {
    void handleRequest(request, response, proxyHandler);
  });

  server.listen(options.port, options.host, () => {
    console.log(
      `auth-override-proxy listening on http://${options.host}:${options.port}`,
    );
    console.log(`Forwarding to: ${config.upstream}`);
  });

  return server;
}
