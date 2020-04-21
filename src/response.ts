export const createResponse = (
  body: string,
  headers?: { [key: string]: string }
) => {
  return new Response(body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      ...headers,
    },
  });
};
