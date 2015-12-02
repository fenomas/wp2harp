# wp2harp

First blush at a tool for converting Wordpress XML exports into a 
[harp.js](http://harpjs.com/)-ready static site.

*Experimental!*

### Usage

```shell
git clone [this repo]
cd wp2harp
npm install
mkdir output
node wp2harp.js example/theme-unit-test-data.xml output
```
This converts the included sample XML, and puts the results in `example/build`.
To try it with your own blog, export the XML from **Dashboard > Tools > Export**.

If you have `harp` installed globally, you can check the results with:

```shell
harp server output --port 8080
```

### Notes

This script is still new and experimental. So far it groks:

 1. Site metadata and authors
 2. Posts, post metadata, post comments

It also parses pages, attachments, and navItems, but doesn't do anything with them yet.
Categories and tags are ignored but on the to-do list.

*Note:* I couldn't find any documentation of Wordpress's export format, so your 
XML dump might be different from mine. If the script barfs on you log an issue!

### Credits:

by Andy Hall. ISC license, enjoy.
