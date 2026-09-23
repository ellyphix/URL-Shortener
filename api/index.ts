import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../artifacts/api-server/src/app";

// Vercel may expose the rewritten destination rather than the public URL to
// the function. Restore the API path in that case before Express handles it.
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === "/api/index") {
    const path = url.searchParams.get("__vercel_api_path");
    if (path === null || /[?#\r\n]/.test(path)) {
      res.statusCode = 404;
      res.end();
      return;
    }
    url.searchParams.delete("__vercel_api_path");
    req.url = `/api/${path}${url.search}`;
  } else if (url.searchParams.has("__vercel_api_path")) {
    url.searchParams.delete("__vercel_api_path");
    req.url = `${url.pathname}${url.search}`;
  }
  app(req, res);
}