# notion-cloudflare-worker

A serverless layer on top of the private Notion API. It leverages [Cloudflare Workers](https://workers.cloudflare.com/), to provide fast and easy access to all your Notion content.

_This package might become obsolete, once the official Notion API arrives._

## Features

🍭 **Easy to use** – Receive Notion data with a single GET request
✨ **Fast CDN** – Leverage the global Cloudflare CDN
🛫 **CORS Friendly** – Access your data where you need it
🗄 **Table Access** – Get structured data from tables & databases

## Use Cases

- Use a table to manage posts for your blog

## Endpoints

We provide a hosted version of this project on [https://notion.splitbee.io/](https://notion.splitbee.io/). You can also [host your own](https://workers.cloudflare.com/). Cloudflare offers a generous free plan with up to 100,000 request per day.

### Get data from a page - `/v1/page/<PAGE_ID>`

[Example](https://notion.splitbee.io/v1/page/2e22de6b770e4166be301490f6ffd420)

Returns all block data for a given page.
For example, you can render this data with [`react-notion`](https://github.com/splitbee/react-notion).

### Get parsed data from table `/v1/table/<PAGE_ID>`

[Example](https://notion.splitbee.io/v1/page/2e22de6b770e4166be301490f6ffd420)

## Credits

- [Timo Lins](https://timo.sh) – Idea, Documentation
- [Tobias Lins](https://tobi.sh) – Code
