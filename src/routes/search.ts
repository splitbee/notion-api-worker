import { fetchNotionSearch } from "../api/notion";
import { createResponse } from "../response";
import { HandlerRequest } from "../api/types";

export async function searchRoute(req: HandlerRequest) {
  const ancestorId = req.searchParams.get("ancestorId");
  const query = req.searchParams.get("query") || "";
  const limit = req.searchParams.get("limit") || 20;

  if (!ancestorId) {
    return createResponse(
      { error: 'missing required "ancestorId"' },
      { "Content-Type": "application/json" },
      400
    );
  }

  const results = await fetchNotionSearch(
    {
      ancestorId,
      query,
      limit,
    },
    req.notionToken
  );

  return createResponse(results);
}
