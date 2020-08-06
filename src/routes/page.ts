import { fetchPageById, fetchBlocks } from "../api/notion";
import { parsePageId } from "../api/utils";
import { createResponse } from "../response";
import { getCollectionData } from "./collection";
import { BlockType, HandlerRequest } from "../api/types";

export async function pageRoute(req: HandlerRequest) {
  const pageId = parsePageId(req.params.pageId);
  const page = await fetchPageById(pageId!, req.notionToken);

  const baseBlocks = page.recordMap.block;

  let allBlocks: { [id: string]: BlockType & { collection?: any } } = {
    ...baseBlocks,
  };
  let allBlockKeys;

  while (true) {
    allBlockKeys = Object.keys(allBlocks);

    const pendingBlocks = allBlockKeys.flatMap((blockId) => {
      const block = allBlocks[blockId];
      const content = block.value && block.value.content;

      return content && block.value.type !== "page"
        ? content.filter((id: string) => !allBlocks[id])
        : [];
    });

    if (!pendingBlocks.length) {
      break;
    }

    const newBlocks = await fetchBlocks(pendingBlocks).then(
      (res) => res.recordMap.block
    );

    allBlocks = { ...allBlocks, ...newBlocks };
  }

  const allCollectionInstances = allBlockKeys.flatMap((blockId) => {
    const block = allBlocks[blockId];

    return block.value.type === "collection_view"
      ? [
          {
            id: block.value.id,
            collectionId: block.value.collection_id as string,
            collectionViewId: block.value.view_ids[0],
          },
        ]
      : [];
  });

  for (const collectionInstance of allCollectionInstances) {
    const { id, collectionId, collectionViewId } = collectionInstance;
    const collection = page.recordMap.collection[collectionId];

    const { rows, schema } = await getCollectionData(
      collection,
      collectionViewId,
      req.notionToken,
      true
    );

    const viewIds = allBlocks[id].value.view_ids;

    allBlocks[id] = {
      ...allBlocks[id],
      collection: {
        title: collection.value.name,
        schema,
        views: viewIds
          .map((id) => {
            const col = page.recordMap.collection_view[id];
            return col ? col.value : undefined;
          })
          .filter(Boolean),
        data: rows,
      },
    };
  }

  return createResponse(allBlocks);
}
