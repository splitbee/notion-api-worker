![Notion API Worker](https://user-images.githubusercontent.com/1440854/79893752-cc448680-8404-11ea-8d19-e0308eb32028.png)
![API Version](https://badgen.net/badge/API%20Version/v1/green)


A **serverless wrapper** for the the private Notion API. It provides fast and easy access to your Notion content.
Ideal to make Notion your CMS.

We provide a hosted version of this project on [`https://notion-api.splitbee.io`](https://notion-api.splitbee.io/). You can also [host it yourself](https://workers.cloudflare.com/). Cloudflare offers a generous free plan with up to 100,000 request per day.


_Use with caution. This is based on the private Notion API. We can not gurantee it will stay stable._

## Features

🍭 **Easy to use** – Receive Notion data with a single GET request

🗄 **Table Access** – Get structured data from tables & databases

✨ **Blazing Fast** – Built-in [SWR](https://www.google.com/search?q=stale+while+revalidate) caching for instant results

🛫 **CORS Friendly** – Access your data where you need it


## Use Cases

- Use it as data-source for blogs and documentation. Create a table with pages and additional metadata. Query the `/table` endpoints everytime you want to render a list of all pages.

- Get data of speific pages, which can be rendered with [`react-notion`](https://github.com/splitbee/react-notion)



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

Returns the given table page as object array. The column names serve as keys for those objects. The `id` reprents the page ID of the underlying page.


## Credits

- [Timo Lins](https://timo.sh) – Idea, Documentation
- [Tobias Lins](https://tobi.sh) – Code
