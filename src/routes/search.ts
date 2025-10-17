import { fetchNotionSearch } from "../notion-api/notion";
import { HandlerRequest } from "../notion-api/types";
import { parsePageId } from "../notion-api/utils";
import { getNotionToken } from "../utils";
import { createResponse } from "../utils/response";

export async function searchRoute(c: HandlerRequest) {
  const notionToken = getNotionToken(c);

  const ancestorId = parsePageId(c.req.query("ancestorId") || "");
  const query = c.req.query("query") || "";
  const limit = Number(c.req.query("limit") || 20);

  if (!ancestorId) {
    return createResponse(
      { error: 'missing required "ancestorId"' },
      {
        headers: { "Content-Type": "application/json" },
        statusCode: 400,
        request: c,
      }
    );
  }

  const results = await fetchNotionSearch(
    {
      ancestorId,
      query,
      limit,
    },
    notionToken
  );

  return createResponse(results, {
    request: c,
  });
}
