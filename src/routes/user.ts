import { fetchNotionUsers } from "../api/notion";
import { HandlerRequest } from "../api/types";
import { createResponse } from "../response";

export async function userRoute(req: HandlerRequest) {
  const users = await fetchNotionUsers([req.params.userId], req.notionToken);

  return createResponse(users[0]);
}
