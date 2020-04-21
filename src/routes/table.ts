import { fetchPageById, fetchTableData } from "../api/notion";
import { parsePageId, getNotionValue } from "../api/utils";
import { RowContentType, CollectionType, RowType } from "../api/types";
import { createResponse } from "../response";

export async function tableRoute(params: { pageId: string }) {
  const pageId = parsePageId(params.pageId);
  const page = await fetchPageById(pageId);

  console.log({ page });

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
    collectionView.value.id
  );

  console.log({ table });

  const collectionRows = collection.value.schema;
  const collectionColKeys = Object.keys(collectionRows);

  const tableArr: RowType[] = table.result.blockIds.map(
    (id: string) => table.recordMap.block[id]
  );

  const tableData = tableArr.filter(
    (b) =>
      b.value && b.value.properties && b.value.parent_id === collection.value.id
  );

  const rows = tableData.map((td) => {
    let row: { [key: string]: RowContentType } = { id: td.value.id };
    collectionColKeys.forEach((key) => {
      const val = td.value.properties[key];
      if (val) {
        const schema = collectionRows[key];
        row[schema.name] = getNotionValue(val, schema.type);
      }
    });
    return row;
  });

  return createResponse(JSON.stringify(rows));
}
