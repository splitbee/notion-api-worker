import { fetchPageById, fetchTableData, fetchNotionUsers } from "../api/notion";
import { parsePageId, getNotionValue } from "../api/utils";
import {
  RowContentType,
  CollectionType,
  RowType,
  HandlerRequest,
} from "../api/types";
import { createResponse } from "../response";

export const getTableData = async (
  collection: CollectionType,
  collectionViewId: string,
  notionToken?: string,
  raw?: boolean
) => {
  const table = await fetchTableData(
    collection.value.id,
    collectionViewId,
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
        row[schema.name] = raw ? val : getNotionValue(val, schema.type);
        if (schema.type === "person" && row[schema.name]) {
          const users = await fetchNotionUsers(row[schema.name] as string[]);
          row[schema.name] = users as any;
        }
      }
    }
    rows.push(row);
  }

  return { rows, schema: collectionRows };
};

export async function tableRoute(req: HandlerRequest) {
  const pageId = parsePageId(req.params.pageId);
  const page = await fetchPageById(pageId!, req.notionToken);

  if (!page.recordMap.collection)
    return createResponse(
      JSON.stringify({ error: "No table found on Notion page: " + pageId }),
      {},
      401
    );

  const collection = Object.keys(page.recordMap.collection).map(
    (k) => page.recordMap.collection[k]
  )[0];

  const collectionView: {
    value: { id: CollectionType["value"]["id"] };
  } = Object.keys(page.recordMap.collection_view).map(
    (k) => page.recordMap.collection_view[k]
  )[0];

  const { rows } = await getTableData(
    collection,
    collectionView.value.id,
    req.notionToken
  );

  return createResponse(rows);
}
