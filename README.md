![Notion API Worker](https://user-images.githubusercontent.com/1440854/79867270-634a1800-83de-11ea-98ad-42209b9f32a7.png)

A **serverless wrapper** for the the private Notion API. It provides fast and easy access to your Notion content. Ideal if you want to use Notion as CMS.

It's powered by [Cloudflare Workers](https://workers.cloudflare.com/). 

_This package might become obsolete, once the official Notion API arrives._

## Features

🍭 **Easy to use** – Receive Notion data with a single GET request

🗄 **Table Access** – Get structured data from tables & databases

✨ **Fast CDN** – Leverage the global Cloudflare CDN

🛫 **CORS Friendly** – Access your data where you need it


## Use Cases

- Create a table with pages that include date and additional metadata. Perfect if you want to render a list of all available posts.

- Get page content that can be rendered with  [`react-notion`](https://github.com/splitbee/react-notion)



## Endpoints

We provide a hosted version of this project on [`https://notion-api.splitbee.io`](https://notion-api.splitbee.io/). You can also [host your own](https://workers.cloudflare.com/). Cloudflare offers a generous free plan with up to 100,000 request per day.

### Load Page - `/v1/page/<PAGE_ID>`

[Example](https://notion-api.splitbee.io/v1/page/2e22de6b770e4166be301490f6ffd420)

Returns all block data for a given page.
For example, you can render this data with [`react-notion`](https://github.com/splitbee/react-notion).

### Loage Table `/v1/table/<PAGE_ID>`

[Example](https://notion-api.splitbee.io/v1/page/2e22de6b770e4166be301490f6ffd420)

Returns the given Table page as object array. The column names serve as key for those object.


## Credits

- [Timo Lins](https://timo.sh) – Idea, Documentation
- [Tobias Lins](https://tobi.sh) – Code
