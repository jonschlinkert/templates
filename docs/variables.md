# Variables

Assemble traverses your site looking for files to process. Any files with [YAML front matter](/frontmatter/) are subject to processing. For each of these files, Assemble makes a variety of data available via the [Liquid templating system](https://github.com/Shopify/liquid/wiki). The following is a reference of the available data.

## Global Variables

| Variable | Description |
| --- | --- |
| `site` | Sitewide information and configuration settings from `_config.yml`. See below for details. |
| `page` | Page specific information and the [YAML front matter](/frontmatter/). Custom variables set via the YAML Front Matter will be available here. See below for details. |
| `layout` | Layout specific information and the [YAML front matter](/frontmatter/). Custom variables set via the YAML Front Matter in layouts will be available here. |
| `content` | In layout files, the rendered content of the Post or Page being wrapped. This variable is not defined in Post or Page files. |
| `paginator` | When the `paginate` configuration option is set, this variable becomes available for use. See [Pagination](/pagination/) for details. |

## Site Variables

| Variable | Description |
| --- | --- |
| `site.time` | The current time (when you run the`assemble`command). |
| `site.pages` | A list of all Pages. |
| `site.posts` | A reverse chronological list of all Posts. |
| `site.related_posts` | If the page being processed is a Post, this contains a list of up to ten related Posts. By default, these are the ten most recent posts. For high quality but slow to compute results, run the`assemble`command with the`--lsi` ([latent semantic indexing](https://en.wikipedia.org/wiki/Latent_semantic_analysis#Latent_semantic_indexing)) option. Also note GitHub Pages does not support the`lsi`option when generating sites. |
| `site.static_files` | A list of all[static files](/docs/static-files/)(i.e. files not processed by Assemble's converters or the Liquid renderer). Each file has five properties:`path`,`modified_time`,`name`,`basename`and`extname`. |
| `site.html_pages` | A subset of `site.pages` listing those which end in `.html`. |
| `site.html_files` | A subset of `site.static_files` listing those which end in `.html`. |
| `site.collections` | A list of all the collections. |
| `site.data` | A list containing the data loaded from the YAML files located in the`_data`directory. |
| `site.documents` | A list of all the documents in every collection. |
| `site.categories.CATEGORY` | The list of all Posts in category `CATEGORY`. |
| `site.tags.TAG` | The list of all Posts with tag`TAG`. |
| `site.url` | Contains the url of your site as it is configured in the`_config.yml`. For example, if you have`url: http://mysite.com`in your configuration file, then it will be accessible in Liquid as`site.url`. For the development environment there is[an exception](/news/#3-siteurl-is-set-by-the-development-server), if you are running`assemble serve`in a development environment`site.url`will be set to the value of`host`,`port`, and SSL-related options. This defaults to`url: http://localhost:4000`. |
| `site.[CONFIGURATION_DATA]` | All the variables set via the command line and your`_config.yml`are available through the`site`variable. For example, if you have`foo: bar`in your configuration file, then it will be accessible in Liquid as`site.foo`. Assemble does not parse changes to`_config.yml`in`watch`mode, you must restart Assemble to see changes to variables. |

## Page Variables

| Variable | Description |
| --- | --- |
| `page.content` | The content of the Page, rendered or un-rendered depending upon what Liquid is being processed and what`page`is. |
| `page.title` | The title of the Page. |
| `page.excerpt` | The un-rendered excerpt of a document. |
| `page.url` | The URL of the Post without the domain, but with a leading slash, e.g.`/2008/12/14/my-post.html` |
| `page.date` | The Date assigned to the Post. This can be overridden in a Post's front matter by specifying a new date/time in the format`YYYY-MM-DD HH:MM:SS`(assuming UTC), or`YYYY-MM-DD HH:MM:SS +/-TTTT`(to specify a time zone using an offset from UTC. e.g.`2008-12-14 10:30:00 +0900`). |
| `page.id` | An identifier unique to a document in a Collection or a Post (useful in RSS feeds). e.g.`/2008/12/14/my-post``/my-collection/my-document` |
| `page.categories` | The list of categories to which this post belongs. Categories are derived from the directory structure above the`_posts`directory. For example, a post at`/work/code/_posts/2008-12-24-closures.md`would have this field set to`['work', 'code']`. These can also be specified in the[YAML Front Matter](/frontmatter/). |
| `page.tags` | The list of tags to which this post belongs. These can be specified in the[YAML Front Matter](/frontmatter/). |
| `page.path` | The path to the raw post or page. Example usage: Linking back to the page or post's source on GitHub. This can be overridden in the[YAML Front Matter](/frontmatter/). |
| `page.next` | The next post relative to the position of the current post in`site.posts`. Returns`nil`for the last entry. |
| `page.previous` | The previous post relative to the position of the current post in`site.posts`. Returns`nil`for the first entry. |

##### ProTip™: Use Custom Front Matter

Any custom front matter that you specify will be available under `page`. For example, if you specify `custom_css: true`
in a page's front matter, that value will be available as `page.custom_css`.

If you specify front matter in a layout, access that via `layout`. For example, if you specify `class: full_page` in a layout's front matter, that value will be available as`layout.class` in the layout and its parents.

## Paginator

| Variable | Description |
| --- | --- |
| `paginator.per_page` | Number of Posts per page. |
| `paginator.posts` | Posts available for that page. |
| `paginator.total_posts` | Total number of Posts. |
| `paginator.total_pages` | Total number of pages. |
| `paginator.page` | The number of the current page. |
| `paginator.previous_page` | The number of the previous page. |
| `paginator.previous_page_path` | The path to the previous page. |
| `paginator.next_page` | The number of the next page. |
| `paginator.next_page_path` | The path to the next page. |

##### Paginator variable availability

These are only available in index files, however they can be located in a
subdirectory, such as `/blog/index.html`.
