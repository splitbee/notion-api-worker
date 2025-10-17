import { Hono } from "hono";

import { pageRoute } from "./routes/notion-page";
import { tableRoute } from "./routes/table";
import { userRoute } from "./routes/user";
import { searchRoute } from "./routes/search";

const app = new Hono().basePath("/v1");

app.get("/page/:pageId", pageRoute);
app.get("/table/:pageId", tableRoute);
app.get("/user/:userId", userRoute);
app.get("/search", searchRoute);

export default app;
