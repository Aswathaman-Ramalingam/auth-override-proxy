import { existsSync, readFileSync } from "node:fs";
import type { AppOptions, ProxyConfig } from "./type";

export async function loadProxyConfig(): Promise<ProxyConfig> {
  const configPath = "./config.json";

  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const content = readFileSync(configPath, "utf8");
  const config = JSON.parse(content) as Partial<ProxyConfig>;

  if (!config.upstream || !config.username || !config.password) {
    throw new Error(
      "Invalid config: upstream, username, and password are required.",
    );
  }

  const upstream = new URL(config.upstream);

  if (upstream.protocol !== "http:" && upstream.protocol !== "https:") {
    throw new Error("Invalid config: upstream must use http or https.");
  }

  return {
    upstream: upstream.toString().replace(/\/$/, ""),
    username: config.username,
    password: config.password,
  };
}

export function loadAppOptions(): AppOptions {
  const port = Number(process.env.PORT ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return {
    host: process.env.HOST ?? "0.0.0.0",
    port,
  };
}
