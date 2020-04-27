import {} from "@cloudflare/workers-types";
import { Router, Method, Params } from "tiny-request-router";

import { pageRoute } from "./routes/page";
import { tableRoute } from "./routes/table";
import { userRoute } from "./routes/user";
import { createResponse } from "./response";

export type Handler = (
  params: Params,
  notionToken?: string
) => Promise<Response> | Response;

const router = new Router<Handler>();

router.options("*", () => new Response("", { headers: {} }));
router.get("/v1/page/:pageId", pageRoute);
router.get("/v1/table/:pageId", tableRoute);
router.get("/v1/user/:userId", userRoute);

router.get("*", async () =>
  createResponse(
    JSON.stringify({
      error: `Route not found!`,
      routes: ["/v1/page/:pageId", "/v1/table/:pageId", " /v1/user/:pageId"],
    }),
    {},
    404
  )
);

const cache = (caches as any).default;
const NOTION_API_TOKEN =
  typeof NOTION_TOKEN !== "undefined" ? NOTION_TOKEN : undefined;

const handleRequest = async (fetchEvent: FetchEvent): Promise<Response> => {
  const request = fetchEvent.request;
  const { pathname } = new URL(request.url);
  const notionToken =
    NOTION_API_TOKEN ||
    (request.headers.get("Authorization") || "").split("Bearer ")[1] ||
    undefined;

  const match = router.match(request.method as Method, pathname);

  if (!match) {
    return new Response("Endpoint not found.", { status: 404 });
  }

  const cacheKey = request.url;
  let response;
  try {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      response = cachedResponse;
    }
  } catch (err) {}

  const getResponseAndPersist = async () => {
    const res = await match.handler(match.params, notionToken);

    await cache.put(cacheKey, res.clone());
    return res;
  };

  if (response) {
    fetchEvent.waitUntil(getResponseAndPersist());
    return response;
  }

  return getResponseAndPersist();
};

self.addEventListener("fetch", async (event: Event) => {
  const fetchEvent = event as FetchEvent;
  fetchEvent.respondWith(handleRequest(fetchEvent));
});
