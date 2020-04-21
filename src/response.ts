export const createResponse = (
  body: string,
  headers?: { [key: string]: string },
  statusCode?: number
) => {
  return new Response(body, {
    status: statusCode || 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      ...headers,
    },
  });
};
