import { fetchNotionUser } from "../api/notion";
import { createResponse } from "../response";

export async function userRoute(params: { userId: string }) {
  const users = await fetchNotionUser([params.userId]);

  return createResponse(JSON.stringify(users[0]));
}
