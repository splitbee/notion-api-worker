import { Params } from "tiny-request-router";
import { fetchNotionUsers } from "../api/notion";
import { createResponse } from "../response";

export async function userRoute(params: Params, notionToken?: string) {
  const users = await fetchNotionUsers([params.userId], notionToken);

  return createResponse(users[0]);
}
