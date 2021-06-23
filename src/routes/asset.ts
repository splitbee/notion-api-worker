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



// http://127.0.0.1:8787/v1/asset?url=https://s3-us-west-2.amazonaws.com/secure.notion-static.com/7b07bcc5-c445-4646-92e7-80778396bf0f/fmicb-11-00397_(1).pdf&blockId=6cc938f5-76fc-4069-8315-d776778afc71