import { Params } from "tiny-request-router";
import { fetchPageById, fetchTableData, fetchNotionUsers } from "../api/notion";
import { parsePageId, getNotionValue } from "../api/utils";
import { RowContentType, CollectionType, RowType } from "../api/types";
import { createResponse } from "../response";

export async function tableRoute(params: Params, notionToken?: string) {
  const pageId = parsePageId(params.pageId);
  const page = await fetchPageById(pageId, notionToken);

  if (!page.recordMap.collection)
    return createResponse(
      JSON.stringify({ error: "No table found on Notion page: " + pageId }),
      {},
      401
    );

  const collection: CollectionType = Object.keys(page.recordMap.collection).map(
    (k) => page.recordMap.collection[k]
  )[0];
  const collectionView: {
    value: { id: CollectionType["value"]["id"] };
  } = Object.keys(page.recordMap.collection_view).map(
    (k) => page.recordMap.collection_view[k]
  )[0];

  const table = await fetchTableData(
    collection.value.id,
    collectionView.value.id,
    notionToken
  );

  const collectionRows = collection.value.schema;
  const collectionColKeys = Object.keys(collectionRows);

  const tableArr: RowType[] = table.result.blockIds.map(
    (id: string) => table.recordMap.block[id]
  );

  const tableData = tableArr.filter(
    (b) =>
      b.value && b.value.properties && b.value.parent_id === collection.value.id
  );

  type Row = { id: string; [key: string]: RowContentType };

  const rows: Row[] = [];

  for (const td of tableData) {
    let row: Row = { id: td.value.id };

    for (const key of collectionColKeys) {
      const val = td.value.properties[key];
      if (val) {
        const schema = collectionRows[key];
        row[schema.name] = getNotionValue(val, schema.type);
        if (schema.type === "person") {
          const users = await fetchNotionUsers(row[schema.name] as string[]);
          row[schema.name] = users;
        }
      }
    }
    rows.push(row);
  }

  return createResponse(JSON.stringify(rows));
}
