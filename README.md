# auth-override-proxy

A lightweight HTTP proxy that replaces a client’s `Authorization` header with HTTP Basic Authentication before forwarding requests to an upstream service.

```text
┌────────┐     Authorization: <any value>     ┌──────────────────────┐
│ Client │ ─────────────────────────────────▶ │ auth-override-proxy  │
└────────┘                                    └──────────┬───────────┘
                                                        │
                              Authorization: Basic ...  │
                                                        ▼
                                             ┌─────────────────┐
                                             │ Upstream Service │
                                             └─────────────────┘
```

## How It Works

1. The client sends a request with any `Authorization` header.
2. The proxy replaces it with Basic Authentication.
3. The request is forwarded to the configured upstream service.

## Configuration

Create a JSON configuration file:

```json
{
  "upstream": "https://api.example.com",
  "username": "my-username",
  "password": "my-password"
}
```

| Field      | Description                    |
| ---------- | ------------------------------ |
| `upstream` | The upstream service URL.      |
| `username` | Basic Authentication username. |
| `password` | Basic Authentication password. |

## Example

Client request:

```http
Authorization: Bearer <token>
```

Forwarded request:

```http
Authorization: Basic <base64(username:password)>
```

## Use Case

Use this proxy when a client uses one authentication mechanism, but the upstream service requires HTTP Basic Authentication.

## Security

> ⚠️ The configuration file contains sensitive credentials. Keep it private, restrict its file permissions, and never commit it to version control.
