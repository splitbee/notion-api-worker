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
  | "relation";

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
  | UserType[];

export interface BaseValueType {
  id: string;
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
