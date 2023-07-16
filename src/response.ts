import { JSONData } from "./api/types";

export const createResponse = (
  body: JSONData | any,
  headers?: { [key: string]: string },
  statusCode?: number
) => {
  return new Response(JSON.stringify(body), {
    status: statusCode || 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Content-Type": "application/json",
      // "Cache-Control":`public, s-maxage=${30}, max-age=${60*60*0.1}, stale-while-revalidate=${60*4}`, 
      // "Cache-Control":`public, s-maxage=${10}, max-age=${10}, stale-while-revalidate=${10}`, 
      "Cache-Control": `public, s-maxage=${60}, max-age=${60}, stale-while-revalidate=${60 * 60}`, 
      ...headers,
    },
  });
};
