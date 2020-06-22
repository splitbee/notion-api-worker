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

  let allBlocks: { [id: string]: BlockType & { data?: any } } = {
    ...baseBlocks,
  };
  let allBlockKeys;

  while (true) {
    allBlockKeys = Object.keys(allBlocks);

    const pendingBlocks = allBlockKeys.flatMap((blockId) => {
      const block = allBlocks[blockId];
      const content = block.value.content;

      return content ? content.filter((id: string) => !allBlocks[id]) : [];
    });

    if (!pendingBlocks.length) {
      break;
    }

    const newBlocks = await fetchBlocks(pendingBlocks).then(
      (res) => res.recordMap.block
    );

    allBlocks = { ...allBlocks, ...newBlocks };
  }

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
    const pendingCollections = allBlockKeys.flatMap((blockId) => {
      const block = allBlocks[blockId];

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
        data,
      };
    }
  }

  return createResponse(allBlocks);
}
