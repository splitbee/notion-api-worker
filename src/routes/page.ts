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

  const pendingBlocks = Object.keys(baseBlocks).flatMap((blockId) => {
    const block = baseBlocks[blockId];
    const contents = block.value.content;

    return contents ? contents.filter((id: string) => !baseBlocks[id]) : [];
  });

  const additionalBlocks = await fetchBlocks(pendingBlocks).then(
    (res) => res.recordMap.block
  );

  let pendingCollections = Object.keys(baseBlocks).flatMap((blockId) => {
    const block = baseBlocks[blockId];

    return block.value.type === "collection_view" ? [block.value.id] : [];
  });

  let allBlocks: { [id: string]: BlockType & { data?: any } } = {
    ...baseBlocks,
    ...additionalBlocks,
  };

  const collection = Object.keys(page.recordMap.collection).map(
    (k) => page.recordMap.collection[k]
  )[0];

  const collectionView: {
    value: { id: CollectionType["value"]["id"] };
  } = Object.keys(page.recordMap.collection_view).map(
    (k) => page.recordMap.collection_view[k]
  )[0];

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

  return createResponse(allBlocks);
}
