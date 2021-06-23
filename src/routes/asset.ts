import { fetchNotionAsset } from "../api/notion";
import { HandlerRequest } from "../api/types";
import { createResponse } from "../response";

export async function assetRoute(req: HandlerRequest) {

  let url = new URL(req.request.url)
  let fileUrl = url.searchParams.get('url')
  let blockId = url.searchParams.get('blockId')

  if (!fileUrl || !blockId)
    return createResponse(
      { error: 'Please supply a file URL and block ID: asset?url=[file-url]&blockId=[block ID]' },
      { "Content-Type": "application/json" },
      400
    );

  const asset = await fetchNotionAsset(fileUrl, blockId);

  return createResponse(asset);
}

