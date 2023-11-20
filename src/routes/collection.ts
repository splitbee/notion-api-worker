
import { fetchPageById, fetchTableData, fetchNotionUsers, fetchNotionAsset } from "../api/notion";
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
  raw?: boolean,
  filter?: any,
  sort?: any,
  limit,
) => {

  // console.log('Getting collection data:', collection, collectionViewId, notionToken, raw, filter)
  const table = await fetchTableData(
    collection.value.id,
    collectionViewId,
    notionToken,
    filter,
    sort,
    limit,
  );

  // console.log('fetchTableData:::::::::', table)

  const collectionRows = collection.value.schema;
  const collectionColKeys = Object.keys(collectionRows);

  const tableArr: RowType[] = table.result.reducerResults.collection_group_results.blockIds.map(
    (id: string) => table.recordMap.block[id]
  );



  // filter for relevant rows
  let tableData = tableArr.filter(
    (b) =>
      b.value && b.value.properties && b.value.parent_id === collection.value.id
  );

  type Row = { id: string; format: any; [key: string]: RowContentType };

  const rows: Row[] = [];
  const tds = []

  

  for (const tableRow of tableData) {
    // console.log('tableRow:', tableRow)
    let row: Row = { id: tableRow.value.id, format: tableRow.value.format };
    tds.push(tableRow)
    for (const key of collectionColKeys) {
      const val = tableRow.value.properties[key];
      if (val) {
        const schema = collectionRows[key];
        row[schema.name] = raw ? val : getNotionValue(val, schema.type, tableRow);
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

    row['Created By'] = await fetchNotionUsers([tableRow.value?.['created_by_id']]);
    rows.push(row);
  }

  const name: String = collection.value.name.join('')

  return { rows, schema: collectionRows, name, tableArr};
};



















export async function collectionRoute(req: HandlerRequest) {
  console.time("collectionRoute"); // Start timer

  const pageId = parsePageId(req.params.pageId);
  const viewName = req.searchParams.get("view"); // collection view
  const limit = Number(req.searchParams.get("limit")) || 999; // collection view
  const page = await fetchPageById(pageId!, req.notionToken);
  const pageBlock = page.recordMap.block[pageId!];
  let payload: string|null = req.searchParams.get("payload"); // ["rows", "columns"] etc. — array of keys to be returned; will return EVERYTHING if left empty
  let payloadArr: string[] = [];
  if (payload) payloadArr = payload.split(',')
  
  if (!page.recordMap.collection)
    return createResponse(
      JSON.stringify({ error: "No table found on Notion page: " + pageId }),
      {},
      401
    );

  let collection
  const views: any[] = []
  let collectionView: {
    value: { id: CollectionType["value"]["id"], format: any };
  }
  

  if (pageBlock.value.view_ids && pageBlock.value.view_ids?.length > 0) {
    Object.keys(page.recordMap.collection_view).map((k) => {
      views.push(page.recordMap.collection_view[k]['value'])
      return page.recordMap.collection_view[k]
    }).find(view => view.value.id == pageBlock.value.view_ids?.[0]);
  } else {
    Object.keys(page.recordMap.collection_view).map((k) => {
      views.push(page.recordMap.collection_view[k]['value'])
      return page.recordMap.collection_view[k]
    })[0];
  }

  // ok the above is doing some crazy stuff; we just want the FIRST view (e.g. the left-most one)
  // have to rewrap it here into {value: ... } (ugh)

  if (viewName) {
    collectionView = { value: views.find(v => v.name == viewName) || views[0] }
  } else {
    // default to first view
    collectionView = { value: views[0] }
  }

  
  // console.log('flip flup %%_%%1231231232%', pageId, page.recordMap?.block?.[pageId]?.value?.collection_id)
  // console.log('[RECORDMAP?]', JSON.stringify(page.recordMap,0,2))
  // console.log('[COLLECTION VIEW?]', JSON.stringify(collectionView,0,2), 'looffppopo', JSON.stringify(views,0,2))

  if (collectionView) {
    let collectionId = page.recordMap?.block?.[pageId]?.value?.collection_id
    collection = Object.keys(page.recordMap.collection).map(
      (k) => page.recordMap.collection[k]
    // ).find(view => view.value?.id == collectionView.value?.format?.collection_pointer?.id);
    ).find(view => view.value?.id == collectionId);
  }
  
  // if collectionView failed (code is brittle) we get the default view
  if(!collection) {
    collection = Object.keys(page.recordMap.collection).map(
      (k) => page.recordMap.collection[k]
    )[0];
  }




  let query_filter = collectionView.value?.['query2']?.filter ? collectionView.value?.['query2']?.filter : {}
  let query_sort = collectionView.value?.['query2']?.sort ? collectionView.value?.['query2']?.sort : []

  if (collectionView.value?.format.property_filters) {
    if (!query_filter.filters)
      query_filter.filters = []
    query_filter.filters = [...query_filter?.filters, ...collectionView.value?.format.property_filters.map(f => f.filter)]
    // query_filter.filters = [...query_filter?.filters, ...collectionView.value?.format.property_filters]
  }



  const tableData = await getCollectionData(
    collection,
    collectionView.value.id,
    req.notionToken,
    null,
    query_filter,
    query_sort,
    limit,
  );

  // console.log('[collection] table data:', JSON.stringify(collectionView.value))
  // console.log('[collection] view:', JSON.stringify(page.recordMap))

  // clean up the table order
  const tableProps = collectionView.value.format.table_properties
  if(tableProps) {// only table views have tableProps; galleries etc. don't
    tableProps.map((tableCol:any, i:any) => {
      tableProps[i] = { ...tableProps[i], ...tableData.schema[tableCol['property']] }
    })
  }


  // filters result array in place
  const _filter = ({filter, property}: {filter:any, property:any}) => {
    if(!filter)
      return
      
    // property = column name
    let _op = filter.operator // "string_contains" etc.
    let _type = filter.value && filter.value.type // "exact"
    let _text = filter.value && filter.value.value // text matching against; "filter text"
    let column = tableProps.find((c: any)=>c.property==property)

    switch (_op) {
      // case 'person_contains':
      // this is already done on view filtering
      //   console.log('person_contains:', _text)
      //   tableData.rows = tableData.rows.filter((row:any)=>row[column.name] && row[column.name].includes(_text))
      //   console.log('person_contains:', tableData.rows)
      //   break;
      // case 'date_is_after':
      //   tableData.rows = tableData.rows.filter((row:any)=>row[column.name] && new Date(row[column.name]) > new Date(_text))
      //   break;
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
      case 'date_is_before':
        tableData.rows = tableData.rows.filter((row: any) => row[column.name] && new Date(row[column.name]) < new Date(_text))
        break;
      case 'number_is_greater':
        tableData.rows = tableData.rows.filter((row: any) => row[column.name] && row[column.name] > _text)
        break;
      case 'number_is_less':
        tableData.rows = tableData.rows.filter((row: any) => row[column.name] && row[column.name] < _text)
        break;
      case 'boolean_is_true':
        tableData.rows = tableData.rows.filter((row: any) => row[column.name] === true)
        break;
      case 'boolean_is_false':
        tableData.rows = tableData.rows.filter((row: any) => row[column.name] === false)
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
        tableData.rows = tableData.rows.filter((row: any)=> {
          return !row[column.name] || (!row[column.name].includes(_text))
        })
        break;
    }
  }

  
  // legacy; this is better done from view filtering
  if(query_filter && query_filter.filters && query_filter.filters.length>0) {
    // let op = query_filter.operator

    query_filter.filters.map((filter:any)=>{
      _filter(filter)
    })
  }


  // legacy; this is done through Notion API sorting 
  // return sorted data
  // NOTE: sorting by A-Z doesn't always return the same results as Notion, since we're not sorting by block ID's position, just a-z
  // if(query_sort && query_sort.length>0) {
  //   query_sort.map((qsort:any)=>{
  //     let column = tableProps.find((c:any)=>c.property==qsort.property)
  //     if(column.type=='multi_select' || column.type=='select') { // sort by column options array rank of first item, rather than a-z
        
  //       if(qsort.direction=='ascending') {
  //         tableData.rows = tableData.rows.sort((a:any,b:any) => { // get the column ranks by matching against the value and getting their index, then sorting by col index
  //           let _a = column.options.findIndex((e:any)=>e.value==a[column.name] && a[column.name][0])
  //           let _b = column.options.findIndex((e:any)=>e.value==b[column.name] && b[column.name][0])
  //           return _a < _b ? -1 : 1
  //         })
  //       }
  //       else {
  //         tableData.rows = tableData.rows.sort((a:any,b:any) => { // get the column ranks by matching against the value and getting their index, then sorting by col index
  //           let _a = column.options.findIndex((e:any)=>e.value==a[column.name] && a[column.name][0])
  //           let _b = column.options.findIndex((e:any)=>e.value==b[column.name] && b[column.name][0])
  //           return _a > _b ? -1 : 1
  //         })
  //       }
  //     } else {
  //       if(qsort.direction=='ascending') {
  //         // tableData.rows = tableData.rows.sort((a,b) => {console.log('>>',a[column.name],b[column.name], a[column.name] < b[column.name]); return a[column.name] < b[column.name] ? -1 : 1})
  //         tableData.rows = tableData.rows.sort((a,b) => a[column.name] > b[column.name] ? 1 : -1)
  //       } else
  //         tableData.rows = tableData.rows.sort((a,b) => a[column.name] < b[column.name] ? 1 : -1)
  //     } 
  //   })
  // }

  // only shows on cf devtools (press 'd' when running)
  console.timeEnd("collectionRoute"); // End timer

  let returnObj = {
    ...tableData,
    columns: tableProps,
    collection: collection,
    sort: collectionView.value?.page_sort,
    query_filter,
    query_sort,
    views,
  }

  if (payloadArr.length > 0) {
    let filteredReturnObj = {};
    payloadArr.forEach(key => {
      if (returnObj.hasOwnProperty(key)) {
        filteredReturnObj[key] = returnObj[key];
      }
    });
    return createResponse(filteredReturnObj);
  } else {
    // return everything
    return createResponse(returnObj);
  }

}
