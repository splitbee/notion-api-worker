import { fetchPageById, fetchBlocks } from "../api/notion";
import { parsePageId } from "../api/utils";
import { createResponse } from "../response";
import { getTableData } from "./table";
import { BlockType, CollectionType, HandlerRequest } from "../api/types";

export async function pageRoute(req: HandlerRequest) {
  const pageId = parsePageId(req.params.pageId);
  const page = await fetchPageById(pageId!, req.notionToken);

  // console.log('->>>>>>', JSON.stringify(page,0,2))

  if (!req.params.pageId) {
    console.error(`Page not found at [ID:${req.params.pageId}]`)
    return createResponse(
      JSON.stringify({ error: "No page found on Notion at: " + pageId }),
      {},
      404
    );
  }


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

    const newBlocks = await fetchBlocks(pendingBlocks, req.notionToken).then(
      (res) => res.recordMap.block 
    );

    allBlocks = { ...allBlocks, ...newBlocks };
  }

  // const collection = page.recordMap.collection
  //   ? page.recordMap.collection[Object.keys(page.recordMap.collection)[0]]
  //   : null;

  // const collectionView = page.recordMap.collection_view
  //   ? page.recordMap.collection_view[
  //       Object.keys(page.recordMap.collection_view)[0]
  //     ]
  //   : null;


  // if (collection && collectionView) {
  // if (collection) {
    const pendingCollections = allBlockKeys.flatMap((blockId) => {
      // console.log('blockMapping:', blockId)
      const block = allBlocks[blockId];
      return (block.value && block.value.type === "collection_view") ? [block.value.id] : [];
    });

    for (let b of pendingCollections) {
      const collPage = await fetchPageById(b!, req.notionToken);
      // console.log('Pending Block ID $$$$:', b)
      const collPageBlock = collPage.recordMap.block[b];

      let coll
      let collView: {
        value: { id: CollectionType["value"]["id"], format: any };
      } 
      
      if (collPageBlock.value.view_ids && collPageBlock.value.view_ids?.length > 0) {
        collView = Object.keys(collPage.recordMap.collection_view).map(
          (k) => collPage.recordMap.collection_view[k]
        ).find(view => view.value.id == collPageBlock.value.view_ids?.[0]);
      } else {
        collView = Object.keys(collPage.recordMap.collection_view).map(
          (k) => collPage.recordMap.collection_view[k]
        )[0];
      }
      
      // console.log('-mmmm- CollView:', JSON.stringify(collView), "^^^^^", collView.value.parent_id, "\n\n\n ******", Object.keys(collPage.recordMap.collection).map(
      //   (k) => collPage.recordMap.collection[k]
      // ).find(view => view.value.id == collView.value.format.collection_pointer.id))
      

      if (collView) {
        coll = Object.keys(collPage.recordMap.collection).map(
          (k) => collPage.recordMap.collection[k]
        ).find(view => view.value.id == collView.value.format.collection_pointer.id);
      } else {
        coll = Object.keys(collPage.recordMap.collection).map(
          (k) => collPage.recordMap.collection[k]
        )[0];
      }
      // console.log('[page] collection!!%%%:', JSON.stringify(Object.keys(collPage.recordMap.collection).map(
      //   (k) => collPage.recordMap.collection[k])), '%%%%%%%', )

      // console.log('>>>>> page getting table data')
      // console.log('[page] collection view collections:', JSON.stringify(Object.keys(collPage.recordMap.collection).map(
      //   (k) => collPage.recordMap.collection[k])), '!!!!!!!!!', JSON.stringify(collPage))

      const { rows, schema } = await getTableData(
        coll,
        collView.value.id,
        req.notionToken,
        true
      );

      // console.log('[page] collection rows:', collView.value.id, rows, schema)

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
  // }

  return createResponse(allBlocks);
}
