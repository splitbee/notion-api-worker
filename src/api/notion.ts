import { resolve } from "dns";

const NOTION_API = "https://www.notion.so/api/v3";

type JSONData =
  | null
  | boolean
  | number
  | string
  | JSONData[]
  | { [prop: string]: JSONData };

type INotionParams = {
  resource: string;
  body: JSONData;
};

const loadPageChunkBody = {
  limit: 999,
  cursor: { stack: [] },
  chunkNumber: 0,
  verticalColumns: false,
};

const fetchNotionData = async ({ resource, body }: INotionParams) => {
  const res = await fetch(`${NOTION_API}/${resource}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    //cf: {}
  });

  return res.json();
};

export const fetchPageById = async (pageId: string) => {
  const res = await fetchNotionData({
    resource: "loadPageChunk",
    body: {
      pageId,
      ...loadPageChunkBody,
    },
  });

  return res;
};

const queryCollectionBody = {
  query: { aggregations: [{ property: "title", aggregator: "count" }] },
  loader: {
    type: "table",
    limit: 999,
    searchQuery: "",
    userTimeZone: "Europe/Vienna",
    userLocale: "en",
    loadContentCover: true,
  },
};

export const fetchTableData = async (
  collectionId: string,
  collectionViewId: string
) => {
  const table = await fetchNotionData({
    resource: "queryCollection",
    body: {
      collectionId,
      collectionViewId,
      ...queryCollectionBody,
    },
  });
  return table;
};

export const fetchNotionUser = async (
  userIds: string[]
): Promise<{ id: string; full_name: string }[]> => {
  const users = await fetchNotionData({
    resource: "getRecordValues",
    body: {
      requests: userIds.map((id) => ({ id, table: "notion_user" })),
    },
  });

  return users.results.map((u: any) => {
    const user = {
      id: u.value.id,
      full_name: u.value.given_name + " " + u.value.family_name,
    };
    return user;
  });
};
