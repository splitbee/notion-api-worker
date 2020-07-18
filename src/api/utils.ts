import { DecorationType, ColumnType, RowContentType } from "./types";

export const idToUuid = (path: string) =>
  `${path.substr(0, 8)}-${path.substr(8, 4)}-${path.substr(
    12,
    4
  )}-${path.substr(16, 4)}-${path.substr(20)}`;

export const parsePageId = (id: string) => {
  if (id) {
    const rawId = id.replace(/\-/g, "").slice(-32);
    return idToUuid(rawId);
  }
};

export const getNotionValue = (
  val: DecorationType[],
  type: ColumnType
): RowContentType => {
  switch (type) {
    case "text":
      return getTextContent(val);
    case "person":
      return (
        val.filter((v) => v.length > 1).map((v) => v[1]![0][1] as string) || []
      );
    case "checkbox":
      return val[0][0] === "Yes";
    case "date":
      if (val[0][1]![0][0] === "d") return val[0]![1]![0]![1]!.start_date;
      else return "";
    case "title":
      return getTextContent(val);
    case "select":
      return val[0][0];
    case "multi_select":
      return val[0][0].split(",") as string[];
    case "number":
      return Number(val[0][0]);
    case "relation":
      return val
        .filter(([symbol]) => symbol === "‣")
        .map(([_, relation]) => relation![0][1] as string);
    case "file":
      return val
        .filter((v) => v.length > 1)
        .map((v) => ({ name: v[0] as string, url: v[1]![0][1] as string }));
    default:
      console.log({ val, type });
      return "Not supported";
  }
};

const getTextContent = (text: DecorationType[]) => {
  return text.reduce((prev, current) => prev + current[0], "");
};
