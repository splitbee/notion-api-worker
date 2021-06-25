import { fetchNotionAsset } from "../api/notion";
import { HandlerRequest } from "../api/types";
import { createResponse } from "../response";

export async function fileRoute(req: HandlerRequest) {

  let url = new URL(req.request.url)
  let fileUrl = url.searchParams.get('url')
  let blockId = url.searchParams.get('blockId')

  if (!fileUrl || !blockId)
    return createResponse(
      { error: 'Please supply a file URL and block ID: asset?url=[file-url]&blockId=[block ID]' },
      { "Content-Type": "application/json" },
      400
    );

  const asset:any = await fetchNotionAsset(fileUrl, blockId);

  if (asset && asset.signedUrls && asset.signedUrls[0])
    return Response.redirect(
      asset.signedUrls[0], 
      302
    );

  return createResponse(
    { error: 'File not found' },
    { "Content-Type": "application/json" },
    400
  );
}

