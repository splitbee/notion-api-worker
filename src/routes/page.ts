import { Params } from "tiny-request-router";
import { fetchPageById } from "../api/notion";
import { parsePageId } from "../api/utils";
import { createResponse } from "../response";

export async function pageRoute(params: Params, notionToken?: string) {
  const pageId = parsePageId(params.pageId);
  const res = await fetchPageById(pageId, notionToken);

  return createResponse(JSON.stringify(res.recordMap.block));
}
