import { fetchPageById, fetchTableData, fetchNotionUsers } from "../api/notion";
import { parsePageId, getNotionValue } from "../api/utils";
import { fetchNotionAsset } from "../api/notion";

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

  const tableArr: RowType[] = table.result.reducerResults.collection_group_results.blockIds.map(
    (id: string) => table.recordMap.block[id]
  );

  const tableData = tableArr.filter(
    (b) =>
      b.value && b.value.properties && b.value.parent_id === collection.value.id
  );

  type Row = { id: string; format: any; [key: string]: RowContentType };

  const rows: Row[] = [];
  const tds = []
  for (const td of tableData) {
    let row: Row = { id: td.value.id, format: td.value.format };
    tds.push(td)
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

    if(row.format && row.format.page_cover) {
      let asset:any = await fetchNotionAsset(row.format.page_cover, row.id)
      if (asset && asset.url && asset.url.signedUrls && asset.url.signedUrls[0])
        row.format.page_cover = asset.url.signedUrls[0]
    }

    rows.push(row);
  }

  const name: String = collection.value.name.join('')
  
  return { rows, schema: collectionRows, name, tableArr};
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
  if(tableProps) {// only table views have tableProps; galleries etc. don't
    tableProps.map((tableCol:any, i:any) => {
      tableProps[i] = { ...tableProps[i], ...tableData.schema[tableCol['property']] }
    })
  }

  let query_filter = views[0]['query2'] ? views[0]['query2'].filter : undefined
  let query_sort = views[0]['query2'] ? views[0]['query2'].sort : undefined







    // filters result array in place
    const _filter = ({filter, property}: {filter:any, property:any}) => {
      if(!filter)
        return
        
      // property = column name
      let _op = filter.operator // "string_contains" etc.
      let _type = filter.value && filter.value.type // "exact"
      let _text = filter.value && filter.value.value // text matching against; "filter text"
      let column = tableProps.find(c=>c.property==property)

      switch (_op) {
        case 'string_contains':
          tableData.rows = tableData.rows.filter((row:any)=>row[column.name] &&row[column.name].includes(_text))
          break;
        case 'string_is':
          tableData.rows = tableData.rows.filter((row:any)=>row[column.name] == _text)
          break;
        case 'string_does_not_contain':
          tableData.rows = tableData.rows.filter((row:any)=>row[column.name] && !row[column.name].includes(_text))
          break;
        case 'string_starts_with':
          tableData.rows = tableData.rows.filter((row:any)=>row[column.name] && row[column.name].startsWith(_text))
          break;
        case 'string_ends_with':
          tableData.rows = tableData.rows.filter((row:any)=>row[column.name] && row[column.name].endsWith(_text))
          break;
        case 'is_empty':
          tableData.rows = tableData.rows.filter((row:any)=> row[column.name] && (!row[column.name] || row[column.name] == ''))
          break;
        case 'is_not_empty':
          tableData.rows = tableData.rows.filter((row:any)=> row[column.name] && row[column.name] !== '')
          break;
        case 'enum_is_not':
          tableData.rows = tableData.rows.filter((row:any)=> row[column.name] !== _text)
          break;
        case 'enum_is':
          tableData.rows = tableData.rows.filter((row:any)=> row[column.name] == _text)
          break;
        case 'enum_contains':
          tableData.rows = tableData.rows.filter((row:any)=> row[column.name] && row[column.name].includes(_text))
          break;
        case 'enum_does_not_contain':
          tableData.rows = tableData.rows.filter(row=> {
            return !row[column.name] || (!row[column.name].includes(_text))
          })
          break;
      }
    }


    

    if(query_filter && query_filter.filters && query_filter.filters.length>0) {
      let op = query_filter.operator

      query_filter.filters.map((filter:any)=>{
        _filter(filter)
      })
    }






  

  // return sorted data
  // NOTE: sorting by A-Z doesn't always return the same results as Notion, since we're not sorting by block ID's position, just a-z
  if(query_sort && query_sort.length>0) {
    query_sort.map((qsort:any)=>{
      let column = tableProps.find((c:any)=>c.property==qsort.property)
      if(column.type=='multi_select' || column.type=='select') { // sort by column options array rank of first item, rather than a-z
        if(qsort.direction=='ascending') {
          tableData.rows = tableData.rows.sort((a:any,b:any) => { // get the column ranks by matching against the value and getting their index, then sorting by col index
            let _a = column.options.findIndex((e:any)=>e.value==a[column.name][0])
            let _b = column.options.findIndex((e:any)=>e.value==b[column.name][0])
            return _a < _b ? -1 : 1
          })
        }
        else {
          tableData.rows = tableData.rows.sort((a:any,b:any) => { // get the column ranks by matching against the value and getting their index, then sorting by col index
            let _a = column.options.findIndex((e:any)=>e.value==a[column.name][0])
            let _b = column.options.findIndex((e:any)=>e.value==b[column.name][0])
            return _a > _b ? -1 : 1
          })
        }
      } else {
        if(qsort.direction=='ascending') {
          // tableData.rows = tableData.rows.sort((a,b) => {console.log('>>',a[column.name],b[column.name], a[column.name] < b[column.name]); return a[column.name] < b[column.name] ? -1 : 1})
          tableData.rows = tableData.rows.sort((a,b) => a[column.name] > b[column.name] ? 1 : -1)
        } else
          tableData.rows = tableData.rows.sort((a,b) => a[column.name] < b[column.name] ? 1 : -1)
      } 
    })
  }

  
  return createResponse({ 
    ...tableData, 
    columns: tableProps, 
    collection: collection, 
    sort: views[0].page_sort, 
    query_filter, 
    query_sort, 
    views,
  });
}
