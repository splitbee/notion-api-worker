import { Params } from "tiny-request-router";
import { fetchNotionUsers } from "../api/notion";
import { createResponse } from "../response";

export async function userRoute(params: Params) {
  const users = await fetchNotionUsers([params.userId]);

  return createResponse(JSON.stringify(users[0]));
}
