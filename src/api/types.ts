import { Params } from "tiny-request-router";

type BoldFormatType = ["b"];
type ItalicFormatType = ["i"];
type StrikeFormatType = ["s"];
type CodeFormatType = ["c"];
type LinkFormatType = ["a", string];
type DateFormatType = [
  "d",
  {
    type: "date";
    start_date: string;
    date_format: string;
  }
];
type UserFormatType = ["u", string];
type PageFormatType = ["p", string];
type SubDecorationType =
  | BoldFormatType
  | ItalicFormatType
  | StrikeFormatType
  | CodeFormatType
  | LinkFormatType
  | DateFormatType
  | UserFormatType
  | PageFormatType;
type BaseDecorationType = [string];
type AdditionalDecorationType = [string, SubDecorationType[]];
export type DecorationType = BaseDecorationType | AdditionalDecorationType;

export type ColumnType =
  | "select"
  | "text"
  | "date"
  | "person"
  | "checkbox"
  | "title"
  | "multi_select"
  | "number"
  | "relation"
  | "file";

export type ColumnSchemaType = {
  name: string;
  type: ColumnType;
};

type UserType = { id: string; full_name: string };

export type RowContentType =
  | string
  | boolean
  | number
  | string[]
  | { title: string; id: string }
  | UserType[]
  | DecorationType[]
  | { name: string; url: string }[];

export interface BaseValueType {
  id: string;
  type: string;
  version: number;
  created_time: number;
  last_edited_time: number;
  parent_id: string;
  parent_table: string;
  alive: boolean;
  created_by_table: string;
  created_by_id: string;
  last_edited_by_table: string;
  last_edited_by_id: string;
  content?: string[];
}

export interface CollectionType {
  value: {
    id: string;
    version: number;
    name: string[][];
    schema: { [key: string]: ColumnSchemaType };
    icon: string;
    parent_id: string;
    parent_table: string;
    alive: boolean;
    copied_from: string;
  };
}

export interface RowType {
  value: {
    id: string;
    parent_id: string;
    properties: { [key: string]: DecorationType[] };
  };
}

export type JSONData =
  | null
  | boolean
  | number
  | string
  | JSONData[]
  | { [prop: string]: JSONData };

export type BlockMapType = {
  [key: string]: BlockType;
};

export interface NotionUserType {
  role: string;
  value: {
    id: string;
    version: number;
    email: string;
    given_name: string;
    family_name: string;
    profile_photo: string;
    onboarding_completed: boolean;
    mobile_onboarding_completed: boolean;
  };
}
export interface BlockType {
  role: string;
  value: BaseValueType;
}

export interface RecordMapType {
  block: BlockMapType;
  notion_user: {
    [key: string]: NotionUserType;
  };
  collection: {
    [key: string]: CollectionType;
  };
  collection_view: {
    [key: string]: {
      value: {
        id: string;
        type: CollectionViewType;
      };
    };
  };
}

export interface LoadPageChunkData {
  recordMap: RecordMapType;
  cursor: {
    stack: any[];
  };
}

type CollectionViewType = "table" | "gallery";

export interface CollectionData {
  recordMap: {
    block: { [key: string]: RowType };
    collection_view: {
      [key: string]: {
        value: { type: CollectionViewType };
      };
    };
  };
  result: {
    blockIds: string[];
  };
}

export interface NotionSearchParamsType {
  ancestorId: string;
  query: string;
  filters?: {
    isDeletedOnly: boolean;
    excludeTemplates: boolean;
    isNavigableOnly: boolean;
    requireEditPermissions: boolean;
  };
  limit?: number;
}

export interface NotionSearchResultType {
  id: string;
  isNavigable: boolean;
  score: number;
  highlight: {
    pathText: string;
    text: string;
  };
}

export interface NotionSearchResultsType {
  recordMap: {
    block: { [key: string]: RowType };
  };
  results: NotionSearchResultType[];
  total: number;
}

export interface HandlerRequest {
  params: Params;
  searchParams: URLSearchParams;
  request: Request;
  notionToken?: string;
}
