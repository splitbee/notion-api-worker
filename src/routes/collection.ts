import { fetchPageById, fetchTableData, fetchNotionUsers } from "../api/notion";
import { parsePageId, getNotionValue } from "../api/utils";
import {
  RowContentType,
  CollectionType,
  RowType,
  HandlerRequest,
} from "../api/types";
import { createResponse } from "../response";

export const getCollectionData = async (
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

  type Row = { id: string;[key: string]: RowContentType };

  const rows: Row[] = [];

  for (const td of tableData) {
    let row: Row = { id: td.value.id };

    for (const key of collectionColKeys) {
      const val = td.value.properties[key];
      if (val) {
        const schema = collectionRows[key];
        row[schema.name] = raw ? val : getNotionValue(val, schema.type, td);
        if (schema.type === "person" && row[schema.name]) {
          const users = await fetchNotionUsers(row[schema.name] as string[]);
          row[schema.name] = users as any;
        }
      }
    }
    rows.push(row);
  }

  const name: String = collection.value.name.join('')

  return { rows, schema: collectionRows, name };
};






export async function collectionRoute(req: HandlerRequest) {
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

  const views: any[] = []

  const collectionView: {
    value: { id: CollectionType["value"]["id"] };
  } = Object.keys(page.recordMap.collection_view).map((k) => {

    views.push(page.recordMap.collection_view[k]['value'])
    return page.recordMap.collection_view[k]
  })[0];

  const tableData = await getCollectionData(
    collection,
    collectionView.value.id,
    req.notionToken
  );

  // console.log('table data:', JSON.stringify(collectionView.value))
  // console.log('view:', JSON.stringify(page.recordMap))

  // clean up the table order
  const tableProps = views[0].format.table_properties
  tableProps.map((tableCol, i) => {
    tableProps[i] = { ...tableProps[i], ...tableData.schema[tableCol['property']] }
  })

  return createResponse({ ...tableData, columns: tableProps, sort: views[0].page_sort, collection: collection });
}
