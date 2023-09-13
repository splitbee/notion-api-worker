// import {} from "@cloudflare/workers-types";
import { Router, Method } from "tiny-request-router";

import { pageRoute } from "./routes/page";
import { tableRoute } from "./routes/table";
import { collectionRoute } from "./routes/collection";
import { userRoute } from "./routes/user";
import { assetRoute } from "./routes/asset";
import { blockRoute } from "./routes/block";
import { fileRoute } from "./routes/file";
import { searchRoute } from "./routes/search";
import { createResponse } from "./response";
import { getCacheKey } from "./get-cache-key";
import * as types from "./api/types";

export type Handler = (
  req: types.HandlerRequest
) => Promise<Response> | Response;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  // "Cache-Control":`public, s-maxage=${30}, max-age=${60*60*0.1}, stale-while-revalidate=${60*4}`, 
  // 60s fresh cache but 7 day cache; max-age determines "freshness" and swr time is whenever the stlate data gets sent over
  // "Cache-Control":`public, s-maxage=${10}, max-age=${10}, stale-while-revalidate=${10}`, 
  "Cache-Control":`public, s-maxage=${60}, max-age=${60}, stale-while-revalidate=${60*60}`, 
};

const router = new Router<Handler>();

router.options("*", () => new Response(null, { headers: corsHeaders }));

router.get("/v1/page/:pageId", pageRoute);
router.get("/v1/table/:pageId", tableRoute);
router.get("/v1/collection/:pageId", collectionRoute);
router.get("/v1/user/:userId", userRoute);
router.get("/v1/search", searchRoute);
router.get("/v1/asset", assetRoute);
router.get("/v1/block/:blockId", blockRoute);
router.get("/v1/file", fileRoute);

router.get("*", async () =>
  createResponse(
    {
      error: `Route not found!`,
      routes: ["/v1/page/:pageId", "/v1/table/:pageId", "/v1/user/:pageId", "/v1/asset?url=[filename]&blockId=[id]", "/v1/:blockId"],
    },
    {},
    404
  )
);




// const match = router.match('GET' as Method, '/foobar')
// if (match) {
//   // Call the async function of that match
//   const response = await match.handler()
//   console.log(response) // => Response('Hello')
// }



//cf-only cache
const cache = (caches as any).default;
//const NOTION_API_TOKEN = process.env.NOTION_TOKEN // not implemented yet — use .env later
  // typeof env.NOTION_TOKEN !== "undefined" ? NOTION_TOKEN : undefined;

const handleRequest = async (fetchEvent: FetchEvent): Promise<Response> => {
  const request = fetchEvent.request;
  const { pathname, searchParams } = new URL(request.url);
  const notionToken =
    // NOTION_API_TOKEN ||
    (request.headers.get("Authorization") || "").split("Bearer ")[1] ||
    undefined;

  const match = router.match(request.method as Method, pathname);

  if (!match) {
    return new Response("Endpoint not found.", { status: 404 });
  }

  const cacheKey = getCacheKey(request);
  let response;

  if (cacheKey) {
    try {
      response = await cache.match(cacheKey);
    } catch (err) {}
  }

  const getResponseAndPersist = async () => {
    const res = await match.handler({
      request,
      searchParams,
      params: match.params,
      notionToken,
    });

    if (cache && cacheKey) {
      await cache.put(cacheKey, res.clone());
    }

    return res;
  };

  // console.log('responding ...')
  if (response) {
    fetchEvent.waitUntil(getResponseAndPersist());
    return response;
  }

  return getResponseAndPersist();
};


// cloudflare workers entry
self.addEventListener("fetch", async (event: Event) => {
  const fetchEvent = event as FetchEvent;
  fetchEvent.respondWith(handleRequest(fetchEvent));
});