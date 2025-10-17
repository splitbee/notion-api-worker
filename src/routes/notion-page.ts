import { fetchPageById, fetchBlocks } from "../notion-api/notion";
import { parsePageId } from "../notion-api/utils";
import { BlockType, CollectionType, HandlerRequest } from "../notion-api/types";
import { getTableData } from "./table";
import { createResponse } from "../utils/response";
import { getNotionToken } from "../utils";

export async function pageRoute(c: HandlerRequest) {
  const pageId = parsePageId(c.req.param("pageId"));
  const notionToken = getNotionToken(c);

  const page = await fetchPageById(pageId!, notionToken);

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

      if (!content || (block.value.type === "page" && blockId !== pageId!)) {
        // skips pages other than the requested page
        return [];
      }

      return content.filter((id: string) => !allBlocks[id]);
    });

    if (!pendingBlocks.length) {
      break;
    }

    const newBlocks = await fetchBlocks(pendingBlocks, notionToken).then(
      (res) => res.recordMap.block
    );

    allBlocks = { ...allBlocks, ...newBlocks };
  }

  const collection = page.recordMap.collection
    ? page.recordMap.collection[Object.keys(page.recordMap.collection)[0]]
    : null;

  const collectionView = page.recordMap.collection_view
    ? page.recordMap.collection_view[
        Object.keys(page.recordMap.collection_view)[0]
      ]
    : null;

  if (collection && collectionView) {
    const pendingCollections = allBlockKeys.flatMap((blockId) => {
      const block = allBlocks[blockId];

      return block.value && block.value.type === "collection_view"
        ? [block.value.id]
        : [];
    });

    for (let b of pendingCollections) {
      const collPage = await fetchPageById(b!, notionToken);

      const coll = Object.keys(collPage.recordMap.collection).map(
        (k) => collPage.recordMap.collection[k]
      )[0];

      const collView: {
        value: { id: CollectionType["value"]["id"] };
      } = Object.keys(collPage.recordMap.collection_view).map(
        (k) => collPage.recordMap.collection_view[k]
      )[0];

      const { rows, schema } = await getTableData(
        coll,
        collView.value.id,
        notionToken,
        true
      );

      const viewIds = (allBlocks[b] as any).value.view_ids as string[];

      allBlocks[b] = {
        ...allBlocks[b],
        collection: {
          title: coll.value.name,
          schema,
          types: viewIds.map((id) => {
            const col = collPage.recordMap.collection_view[id];
            return col ? col.value : undefined;
          }),
          data: rows,
        },
      };
    }
  }

  return createResponse(allBlocks, {
    request: c,
  });
}
