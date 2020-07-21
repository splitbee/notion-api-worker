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
      ...headers,
    },
  });
};
