import { fetchNotionUsers } from "../notion-api/notion";
import { HandlerRequest } from "../notion-api/types";
import { getNotionToken } from "../utils";
import { createResponse } from "../utils/response";

export async function userRoute(c: HandlerRequest) {
  const users = await fetchNotionUsers(
    [c.req.param("userId")],
    getNotionToken(c)
  );

  return createResponse(users[0], { request: c });
}
