![Notion API Worker](https://user-images.githubusercontent.com/1440854/79893752-cc448680-8404-11ea-8d19-e0308eb32028.png)
![API Version](https://badgen.net/badge/API%20Version/v1/green)

A **serverless wrapper** for the private Notion API. It provides fast and easy access to your Notion content.
Ideal to make Notion your CMS.

If you build with Notion and need advanced forms that write directly to your databases, check out [NoteForms](https://noteforms.com/?utm_source=notion-api-worker&utm_medium=github&utm_campaign=readme) — an official Notion integration. Highlights: full customization ✨, multi‑page forms 🧭, conditional logic 🔀, notifications 📣, edit submissions ✍️ & more!

_Use with caution. This is based on the private Notion API. We can not gurantee it will stay stable._

## About this fork

This fork fixes a regression where the `/v1/table/:id` endpoint could return 500 errors on Cloudflare Workers. The fix detects when Notion collections are hosted behind a site-specific domain (e.g. `*.notion.site/api/v3`) and sends the proper headers, while gracefully falling back to the default Notion API if needed. It also adds improved diagnostics for non‑JSON responses and HTTP errors.

For background, see the upstream project and issue:

- Original repo: https://github.com/splitbee/notion-api-worker
- Discussion: https://github.com/splitbee/notion-api-worker/issues/89

### Hosted endpoint (no deployment needed)

If you don’t want to deploy to Cloudflare yourself, you can use this maintained instance:

Base URL: `https://notion-api-worker.notionforms.workers.dev`

Example:

`https://notion-api-worker.notionforms.workers.dev/v1/table/1caa631bec208045866af7d447654132`

This is provided as a convenience and will be maintained on a best‑effort basis. For production or private content, prefer self‑hosting and setting your own `NOTION_TOKEN`.

## Features

🍭 **Easy to use** – Receive Notion data with a single GET request

🗄 **Table Access** – Get structured data from tables & databases

✨ **Blazing Fast** – Built-in [SWR](https://www.google.com/search?q=stale+while+revalidate) caching for instant results

🛫 **CORS Friendly** – Access your data where you need it

## Use Cases

- Use it as data-source for blogs and documentation. Create a table with pages and additional metadata. Query the `/table` endpoints everytime you want to render a list of all pages.

- Get data of specific pages, which can be rendered with [`react-notion`](https://github.com/splitbee/react-notion)

## Endpoints

### Load page data

`/v1/page/<PAGE_ID>`

Example ([Source Notion Page](https://www.notion.so/react-notion-example-2e22de6b770e4166be301490f6ffd420))

[`https://notion-api.splitbee.io/v1/page/2e22de6b770e4166be301490f6ffd420`](https://notion-api.splitbee.io/v1/page/2e22de6b770e4166be301490f6ffd420)

Returns all block data for a given page.
For example, you can render this data with [`react-notion`](https://github.com/splitbee/react-notion).

### Load data from table

`/v1/table/<PAGE_ID>`

Example ([Source Notion Page](https://www.notion.so/splitbee/20720198ca7a4e1b92af0a007d3b45a4?v=4206debfc84541d7b4503ebc838fdf1e))

[`https://notion-api.splitbee.io/v1/table/20720198ca7a4e1b92af0a007d3b45a4`](https://notion-api.splitbee.io/v1/table/20720198ca7a4e1b92af0a007d3b45a4)

## Authentication for private pages

All public pages can be accessed without authorization. If you want to fetch private pages there are two options.

- The recommended way is to host your own worker with the `NOTION_TOKEN` environment variable set. You can find more information in the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/reference/apis/environment-variables/).
- Alternatively you can set the `Authorization: Bearer <NOTION_TOKEN>` header to authorize your requests.

### Receiving the token

To obtain your token, login to Notion and open your DevTools and find your cookies. There should be a cookie called `token_v2`, which is used for the authorization.

## Deploy to Cloudflare Workers (quick start)

Prerequisites:

- Node.js and `yarn` or `npm`
- Cloudflare account and Wrangler v4 (`npm i -g wrangler`)

Steps:

1. Install dependencies: `yarn` (or `npm install`)
2. Configure Cloudflare:
   - Copy `wrangler.example.toml` to `wrangler.toml` (or edit the existing one)
   - Set `name` to your Worker name and keep `workers_dev = true` for a `.workers.dev` preview. Optionally set `route` and `zone_id` for a custom domain
3. (Optional) Set secret for private pages: `wrangler secret put NOTION_TOKEN` and paste your Notion `token_v2`
4. Deploy: `yarn deploy` (or `wrangler deploy`)
5. Local dev: `yarn dev` (or `wrangler dev`)

Endpoints after deploy:

- `/v1/page/<PAGE_ID>`
- `/v1/table/<PAGE_ID>`
- `/v1/user/<USER_ID>`
- `/v1/search?query=<q>&ancestorId=<pageId>`

## Credits

- [Timo Lins](https://twitter.com/timolins) – Idea, Documentation
- [Tobias Lins](https://twitter.com/linstobias) – Code
- [Travis Fischer](https://twitter.com/transitive_bs) – Code
- JhumanJ (NoteForms) – Fork maintenance and Cloudflare fixes
