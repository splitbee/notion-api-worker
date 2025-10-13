import {
  JSONData,
  NotionUserType,
  LoadPageChunkData,
  CollectionData,
  NotionSearchParamsType,
  NotionSearchResultsType,
  BlockType,
} from "./types";

const NOTION_API = "https://www.notion.so/api/v3";

interface INotionParams {
  resource: string;
  body: JSONData;
  notionToken?: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

const loadPageChunkBody = {
  limit: 100,
  cursor: { stack: [] },
  chunkNumber: 0,
  verticalColumns: false,
};

const fetchNotionData = async <T extends any>({
  resource,
  body,
  notionToken,
  baseUrl = NOTION_API,
  headers = {},
}: INotionParams): Promise<T> => {
  const url = `${baseUrl}/${resource}`;
  const requestHeaders: Record<string, string> = {
    "content-type": "application/json",
    ...(notionToken ? { cookie: `token_v2=${notionToken}` } : {}),
    ...headers,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  const status = response.status;
  const statusText = response.statusText;
  const responseHeaders = Object.fromEntries(response.headers.entries());
  const redactedRequestHeaders = {
    ...requestHeaders,
    ...(requestHeaders.cookie ? { cookie: "token_v2=[redacted]" } : {}),
  };

  // Always read as text first so we can log on parse errors
  const rawText = await response.text();

  if (!response.ok) {
    console.error(
      "Notion API HTTP error",
      JSON.stringify(
        {
          url,
          method: "POST",
          status,
          statusText,
          contentType,
          responseHeaders,
          requestHeaders: redactedRequestHeaders,
          requestBody: body,
          responseText: rawText?.slice(0, 1000),
        },
        null,
        2
      )
    );
    throw new Error(`Notion API error ${status} ${statusText}`);
  }

  if (!contentType.includes("application/json")) {
    console.error(
      "Notion API non-JSON response",
      JSON.stringify(
        {
          url,
          method: "POST",
          status,
          statusText,
          contentType,
          responseHeaders,
          requestHeaders: redactedRequestHeaders,
          requestBody: body,
          responseText: rawText?.slice(0, 1000),
        },
        null,
        2
      )
    );
    throw new Error(`Expected JSON but received ${contentType || "unknown content-type"}`);
  }

  try {
    return JSON.parse(rawText) as unknown as T;
  } catch (err: any) {
    console.error(
      "Notion API JSON parse error",
      JSON.stringify(
        {
          url,
          method: "POST",
          status,
          statusText,
          contentType,
          responseHeaders,
          requestHeaders: redactedRequestHeaders,
          requestBody: body,
          responseText: rawText?.slice(0, 1000),
          error: String(err && err.message ? err.message : err),
        },
        null,
        2
      )
    );
    throw new Error(`Failed to parse Notion API JSON response: ${status} ${statusText}`);
  }
};

export const fetchPageById = async (pageId: string, notionToken?: string) => {
  const res = await fetchNotionData<LoadPageChunkData>({
    resource: "loadPageChunk",
    body: {
      pageId,
      ...loadPageChunkBody,
    },
    notionToken,
  });

  return res;
};

const queryCollectionBody = {
  loader: {
    type: "reducer",
    reducers: {
      collection_group_results: {
        type: "results",
        limit: 999,
        loadContentCover: true,
      },
      "table:uncategorized:title:count": {
        type: "aggregation",
        aggregation: {
          property: "title",
          aggregator: "count",
        },
      },
    },
    searchQuery: "",
    userTimeZone: "Europe/Vienna",
  },
};

export const fetchTableData = async (
  collectionId: string,
  collectionViewId: string,
  notionToken?: string,
  blockData?: BlockType
): Promise<CollectionData> => {
  const spaceId = blockData?.value?.space_id;
  const siteId = blockData?.value?.format?.site_id;

  const apiBaseUrl = siteId
    ? `https://${siteId}.notion.site/api/v3`
    : NOTION_API;

  const requestBody: JSONData = {
    ...(spaceId ? {
      source: {
        type: "collection",
        blockId: collectionId,
        spaceId: spaceId,
      },
    } : {
      collection: {
        id: collectionId,
      },
    }),
    collectionView: {
      id: collectionViewId,
    },
    ...queryCollectionBody,
  };

  let table: CollectionData | undefined;
  let primaryError: unknown;
  try {
    table = await fetchNotionData<CollectionData>({
      resource: "queryCollection",
      body: requestBody,
      notionToken,
      baseUrl: apiBaseUrl,
      headers: spaceId ? { "x-notion-space-id": spaceId } : undefined,
    });
  } catch (err) {
    primaryError = err;
  }

  // Fallback: if response has no recordMap/block, retry against default NOTION_API with plain collection body
  const hasBlocks = Boolean(table && (table as any).recordMap && (table as any).recordMap.block && Object.keys((table as any).recordMap.block).length > 0);
  if (!hasBlocks) {
    const fallbackBody: JSONData = {
      collection: { id: collectionId },
      collectionView: { id: collectionViewId },
      ...queryCollectionBody,
    };

    console.warn(
      `Retrying queryCollection against default NOTION_API due to ${table ? "missing blocks" : "primary error"} at site base URL`,
      {
        siteBaseUrl: apiBaseUrl,
        hadPrimaryError: Boolean(primaryError),
      }
    );
    try {
      table = await fetchNotionData<CollectionData>({
        resource: "queryCollection",
        body: fallbackBody,
        notionToken,
        baseUrl: NOTION_API,
        headers: spaceId ? { "x-notion-space-id": spaceId } : undefined,
      });
    } catch (fallbackErr) {
      // If both fail, prefer the first error for context
      throw (primaryError || fallbackErr);
    }
  }

  // At this point ensure table is defined
  if (!table) {
    throw new Error("Failed to fetch Notion collection data");
  }
  return table;
};

export const fetchNotionUsers = async (
  userIds: string[],
  notionToken?: string
) => {
  const users = await fetchNotionData<{ results: NotionUserType[] }>({
    resource: "getRecordValues",
    body: {
      requests: userIds.map((id) => ({ id, table: "notion_user" })),
    },
    notionToken,
  });
  if (users && users.results) {
    return users.results.map((u) => {
      const user = {
        id: u.value.id,
        firstName: u.value.given_name,
        lastLame: u.value.family_name,
        fullName: u.value.given_name + " " + u.value.family_name,
        profilePhoto: u.value.profile_photo,
      };
      return user;
    });
  }
  return [];
};

export const fetchBlocks = async (
  blockList: string[],
  notionToken?: string
) => {
  return await fetchNotionData<LoadPageChunkData>({
    resource: "syncRecordValues",
    body: {
      requests: blockList.map((id) => ({
        id,
        table: "block",
        version: -1,
      })),
    },
    notionToken,
  });
};

export const fetchNotionSearch = async (
  params: NotionSearchParamsType,
  notionToken?: string
) => {
  // TODO: support other types of searches
  return fetchNotionData<{ results: NotionSearchResultsType }>({
    resource: "search",
    body: {
      type: "BlocksInAncestor",
      source: "quick_find_public",
      ancestorId: params.ancestorId,
      filters: {
        isDeletedOnly: false,
        excludeTemplates: true,
        isNavigableOnly: true,
        requireEditPermissions: false,
        ancestors: [],
        createdBy: [],
        editedBy: [],
        lastEditedTime: {},
        createdTime: {},
        ...params.filters,
      },
      sort: "Relevance",
      limit: params.limit || 20,
      query: params.query,
    },
    notionToken,
  });
};
