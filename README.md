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

### Output

This script fills the build directory with files looking like this:

```
/your-build-folder
    _harp.json             <-- overall site metadata
    _data.json             <-- post/page metadata
    _linkInfo.json         <-- see below
    comments/              
        _data.json         <-- json with all comment data
    posts/                 
        title-1.md         <-- one md file for each post or page
        title-2.md         
        ...                
    index.jade             <-- everything below here is boilerplate
    _layout.jade               static boilerplate for the harp site
    css/                   
        style.less         
    _partials/             
        comments.jade      
        post.jade          
```

Mostly it should be fairly clear what's where. 

> **Note about links:**  
  In general wordpress blogs use links like 
  `/?p=123` or `/2015/12/post-title`, whereas static site articles 
  will generally end with `post-title.html`, and use whatever folder structure 
  you choose for your site. This probably means that converting from
  wordpress to static will break lots of links, which you may want to address 
  with `.htaccess` redirects, an HTML5 `pushState` router, etc.
  To make this easier, this script writes out `_linkInfo.json`,
  which isn't used by the harp site, but merely lists up the 
  old/new URLs you might want to redirect. 


### Features

This script is experimental. Currently it exports harp content which can:

 1. Display overall site metadata and authors
 2. Show lists of pages and posts
 3. Show post/pages - metadata, post content, and comments

The script also parses `attachments` and `navItems` from the XML, but doesn't 
write out any accompanying data. 
Categories and tags are ignored so far, but should be reasonably easy to 
hack in if you know what you want to do with them.

> **Note:**  
  I couldn't find any documentation of Wordpress's export format, so your 
  XML dump might well be different from mine. 
  If the script barfs on you log an issue or send a PR!

### Credits:

by Andy Hall. ISC license, enjoy.
