import { fetchNotionUsers } from "../notion-api/notion.js";
import { HandlerRequest } from "../notion-api/types.js";
import { getNotionToken } from "../utils/index.js";
import { createResponse } from "../utils/response.js";

export async function userRoute(c: HandlerRequest) {
  const users = await fetchNotionUsers(
    [c.req.param("userId")],
    getNotionToken(c)
  );

  return createResponse(users[0], { request: c });
}
