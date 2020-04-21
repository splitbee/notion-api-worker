import { fetchPageById } from "../api/notion";
import { parsePageId } from "../api/utils";
import { createResponse } from "../response";

export async function pageRoute(params: { pageId: string }) {
  const pageId = parsePageId(params.pageId);
  const res = await fetchPageById(pageId);

  return createResponse(JSON.stringify(res.recordMap.block));
}
