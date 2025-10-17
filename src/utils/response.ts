import { HandlerRequest, JSONData } from "../notion-api/types.js";

export const createResponse = (
  body: JSONData | any,
  {
    headers,
    statusCode,
    request,
  }: {
    request: HandlerRequest;
    headers?: { [key: string]: string };
    statusCode?: number;
  }
) => {
  const cacheControl = request.req.header("Cache-Control");
  return new Response(JSON.stringify(body), {
    status: statusCode || 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Content-Type": "application/json",
      "Cache-Control": cacheControl || "public, max-age=3600",
      ...headers,
    },
  });
};
