export function getCacheKey(request: Request): string | null {
  const pragma = request.headers.get("pragma");
  if (pragma === "no-cache") {
    return null;
  }

  const cacheControl = request.headers.get("cache-control");
  if (cacheControl) {
    const directives = new Set(cacheControl.split(",").map((s) => s.trim()));
    if (directives.has("no-store") || directives.has("no-cache")) {
      return null;
    }
  }

  return request.url;
}
