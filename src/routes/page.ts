import { Params } from "tiny-request-router";
import { fetchPageById, fetchBlocks } from "../api/notion";
import { parsePageId } from "../api/utils";
import { createResponse } from "../response";

export async function pageRoute(params: Params, notionToken?: string) {
  const pageId = parsePageId(params.pageId);
  const res = await fetchPageById(pageId, notionToken);

  const baseBlocks = res.recordMap.block;

  const pendingBlocks = Object.keys(baseBlocks).flatMap(blockId => {
    const block = baseBlocks[blockId];
    const contents = block.value.content;

    return contents ? contents.filter((id: string) => !baseBlocks[id]) : [];
  });

  const additionalBlocks = await fetchBlocks(pendingBlocks).then(
    res => res.recordMap.block
  );

  return createResponse({
    ...baseBlocks,
    ...additionalBlocks,
  });
}
