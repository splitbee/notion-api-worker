import { HandlerRequest, JSONData } from "../notion-api/types.js";

export const createResponse = (
  body: JSONData | any,
  {
    headers,
    statusCode,
    request,
  }: {
    request: HandlerRequest;
    headers?: { [key: string]: string };
    statusCode?: number;
  }
) => {
  // Check if client wants to bypass cache
  const pragma = request.req.header("pragma");
  const cacheControl = request.req.header("cache-control");

  let shouldBypassCache = false;

  if (pragma === "no-cache") {
    shouldBypassCache = true;
  }

  if (cacheControl) {
    const directives = new Set(cacheControl.split(",").map((s) => s.trim()));
    if (directives.has("no-store") || directives.has("no-cache")) {
      shouldBypassCache = true;
    }
  }

  return new Response(JSON.stringify(body), {
    status: statusCode || 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Content-Type": "application/json",
      "Cache-Control": shouldBypassCache
        ? "no-cache, no-store, must-revalidate"
        : "public, max-age=3600",
      ...headers,
    },
  });
};
