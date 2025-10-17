import { HandlerRequest } from "../notion-api/types";

export const getNotionToken = (c: HandlerRequest) => {
  return (
    process.env.NOTION_TOKEN ||
    (c.req.header("Authorization") || "").split("Bearer ")[1] ||
    undefined
  );
};
