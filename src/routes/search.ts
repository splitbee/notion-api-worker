import { fetchNotionSearch } from "../notion-api/notion.js";
import { HandlerRequest } from "../notion-api/types.js";
import { parsePageId } from "../notion-api/utils.js";
import { getNotionToken } from "../utils/index.js";
import { createResponse } from "../utils/response.js";

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
