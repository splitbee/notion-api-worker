import { fetchNotionSearch } from "../api/notion";
import { createResponse } from "../response";
import { HandlerRequest } from "../api/types";
import { parsePageId } from "../api/utils";

export async function searchRoute(req: HandlerRequest) {
  const ancestorId = parsePageId(req.searchParams.get("ancestorId") || "");
  const query = req.searchParams.get("query") || "";
  const limit = Number(req.searchParams.get("limit") || 20);

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
