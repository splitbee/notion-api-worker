import { Params } from "tiny-request-router";
import { fetchPageById, fetchBlocks } from "../api/notion";
import { parsePageId } from "../api/utils";
import { createResponse } from "../response";
import { getTableData } from "./table";
import { CollectionType, BlockType } from "../api/types";

export async function pageRoute(params: Params, notionToken?: string) {
  const pageId = parsePageId(params.pageId);
  const page = await fetchPageById(pageId, notionToken);

  const baseBlocks = page.recordMap.block;
  const baseBlockKeys = Object.keys(baseBlocks);

  const pendingBlocks = baseBlockKeys.flatMap((blockId) => {
    const block = baseBlocks[blockId];
    const content = block.value.content;

    return content ? content.filter((id: string) => !baseBlocks[id]) : [];
  });

  const additionalBlocks = await fetchBlocks(pendingBlocks).then(
    (res) => res.recordMap.block
  );

  const allBlocks: { [id: string]: BlockType & { data?: any } } = {
    ...baseBlocks,
    ...additionalBlocks
  };

  const collection = page.recordMap.collection
    ? page.recordMap.collection[Object.keys(page.recordMap.collection)[0]]
    : null;

  const collectionView: {
    value: { id: CollectionType["value"]["id"] };
  } = page.recordMap.collection_view
    ? page.recordMap.collection_view[
        Object.keys(page.recordMap.collection_view)[0]
      ]
    : null;

  if (collection && collectionView) {
    const pendingCollections = baseBlockKeys.flatMap((blockId) => {
      const block = baseBlocks[blockId];

      return block.value.type === "collection_view" ? [block.value.id] : [];
    });

    for (let b of pendingCollections) {
      const data = await getTableData(
        collection,
        collectionView.value.id,
        notionToken
      );

      allBlocks[b] = {
        ...allBlocks[b],
        data
      };
    }
  }

  return createResponse(allBlocks);
}
