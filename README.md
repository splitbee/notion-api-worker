![Notion API Worker](https://user-images.githubusercontent.com/1440854/79867270-634a1800-83de-11ea-98ad-42209b9f32a7.png)

A **serverless wrapper** for the the private Notion API. It provides fast and easy access to your Notion content.
Ideal to make Notion your CMS.

It's powered by [Cloudflare Workers](https://workers.cloudflare.com/).

_Use with caution. This is based on the private Notion API so we can not guarantee it will stay stable._

## Features

🍭 **Easy to use** – Receive Notion data with a single GET request

🗄 **Table Access** – Get structured data from tables & databases

✨ **Fast CDN** – Leverage the global Cloudflare CDN

🛫 **CORS Friendly** – Access your data where you need it

## Use Cases

- Create a table with pages that include date and additional metadata. Perfect if you want to render a list of all available posts.

- Get page content that can be rendered with [`react-notion`](https://github.com/splitbee/react-notion)

## Endpoints

We provide a hosted version of this project on [`https://notion-api.splitbee.io`](https://notion-api.splitbee.io/). You can also [host your own](https://workers.cloudflare.com/). Cloudflare offers a generous free plan with up to 100,000 request per day.

### Load page data

`/v1/page/<PAGE_ID>`

Example [https://notion-api.splitbee.io/v1/page/2e22de6b770e4166be301490f6ffd420](https://notion-api.splitbee.io/v1/page/2e22de6b770e4166be301490f6ffd420)

Returns all block data for a given page.
For example, you can render this data with [`react-notion`](https://github.com/splitbee/react-notion).

### Load data from table

`/v1/table/<PAGE_ID>`

Example [https://notion-api.splitbee.io/v1/table/20720198ca7a4e1b92af0a007d3b45a4](https://notion-api.splitbee.io/v1/table/20720198ca7a4e1b92af0a007d3b45a4)

Returns the given table page as object array. The column names serve as keys for those objects. The `id` represents the page ID of the underlying page.

### Private Notion Data

We highly recommend to host the Worker on your own Cloudflare account if you want to query private Notion pages. You can receive the token by getting the `token_v2` cookie from Notion.

- Define `NOTION_TOKEN` as environment variable as described [here](https://developers.cloudflare.com/workers/reference/apis/environment-variables/)
- Add the header `notion_token` to each request

## Credits

- [Timo Lins](https://timo.sh) – Idea, Documentation
- [Tobias Lins](https://tobi.sh) – Code
