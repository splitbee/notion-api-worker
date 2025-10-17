import { DecorationType, ColumnType, RowContentType, RowType } from "./types.js";

export const idToUuid = (path: string): string =>
  `${path.slice(0, 8)}-${path.slice(8, 12)}-${path.slice(12, 16)}-${path.slice(16, 20)}-${path.slice(20)}`;

export const parsePageId = (id: string) => {
  if (id) {
    const rawId = id.replace(/\-/g, "").slice(-32);
    return idToUuid(rawId);
  }
};

export const getNotionValue = (
  val: DecorationType[],
  type: ColumnType,
  row: RowType
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
      try {
        if (val[0][1]![0][0] === "d") return val[0]![1]![0]![1]!.start_date;
        else return "";
      } catch (e) {
        return "";
      }
    case "title":
      return getTextContent(val);
    case "select":
    case "email":
    case "phone_number":
    case "url":
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
        .map((v) => {
          const rawUrl = v[1]![0][1] as string;

          const url = new URL(
            `https://www.notion.so${
              rawUrl.startsWith("/image")
                ? rawUrl
                : `/image/${encodeURIComponent(rawUrl)}`
            }`
          );

          url.searchParams.set("table", "block");
          url.searchParams.set("id", row.value.id);
          url.searchParams.set("cache", "v2");

          return { name: v[0] as string, url: url.toString(), rawUrl };
        });
    default:
      console.log({ val, type });
      return "Not supported";
  }
};

const getTextContent = (text: DecorationType[]) => {
  return text.reduce((prev, current) => prev + current[0], "");
};
