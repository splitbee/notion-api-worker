import { fetchBlocks } from "../api/notion";
import { parsePageId } from "../api/utils";
import { HandlerRequest } from "../api/types";
import { createResponse } from "../response";

export async function blockRoute(req: HandlerRequest) {
  const blockId = parsePageId(req.params.blockId);

  if (!blockId)
    return createResponse(
      { error: 'Please supply a block ID: block?blockId=[block ID]' },
      { "Content-Type": "application/json" },
      400
    );

  const block = await fetchBlocks([blockId], req.notionToken).then(
    (res) => res.recordMap.block
  );

  return createResponse(block);
}

