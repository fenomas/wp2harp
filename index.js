'use strict';

var fs = require('fs')
var path = require('path')
var parser = require('xml2js').parseString


/*
 *
 * 	Parse the XML input and write some Harp.js output!
 * 
 * 	Start hacking below here if you want to customize the output
 * 
*/


function doEverything(channel, folder) {
	// process XML channel into a big data object
	var dat = buildAllData(channel)
	// this looks at post metadata link values, converts /?p=123 links, etc.
	conformPaths(dat)
	
	// write out site globals and base folder content
	writeSiteMeta(dat, folder, '_harp.json')
	writePostMeta(dat, folder, '_data.json')
	copyFile('templates/index.jade', folder, 'index.jade')
	copyFile('templates/_layout.jade', folder, '_layout.jade')
	
	var partialDir = makeFolder(folder, '_partials')
	copyFile('templates/_partials/post.jade', partialDir, 'post.jade')
	copyFile('templates/_partials/comments.jade', partialDir, 'comments.jade')
	
	// write out post information
	writePosts(dat, folder)
	
	// comments
	var commentDir = makeFolder(folder, 'comments')
	writeComments(dat, commentDir)
	
	// copy more static stuff
	var cssDir = makeFolder(folder, 'css')
	copyFile('templates/css/style.less', cssDir, 'style.less')
	
	// write out a JSON file listing incoming links user will likely need to handle
	writeLinkInfo(dat, folder, '_linkInfo.json')
}





function buildAllData(channel) {
	// huge data object to store everything
	var dat = {
		metadata: {},
		authors: [],
		postMeta: {},
		postContent: {},
		postComments: {},
		pages: {},
		navItems: {},
		attachments: {},
	} 
	// run through XML object decorating dat object as we go
	for (var key in channel) {
		if (/author/.test(key)) {
			processAuthors(dat, channel[key])
		} else if (channel[key].length === 1 && typeof channel[key][0] === 'string') {
			// just a key,value pair - treat as site metadata
			dat.metadata[key] = nodeContent(channel[key])
		} else if (key === 'item') {
			processItems(dat, channel[key])
		} else {
			console.log('todo: ', key)
		}
	}
	return dat
}

function nodeContent(node) {
	// returns contents if the node looks like [ foo ]
	if (node && node.length && node.length === 1) return node[0]
	return node
}



function processAuthors(dat, authors) {
	for (var i = 0; i < authors.length; i++) {
		var obj = {}
		for (var longkey in authors[i]) {
			var key = /wp:author_(.*)/.exec(longkey)[1]
			obj[key] = authors[i][longkey][0]
		}
		dat.authors.push(obj)
	}
}


function processItems(dat, items) {
	for (var i = 0; i < items.length; i++) {
		var item = items[i]
		var obj = {}
		var commentList = []
		var type = nodeContent(item['wp:post_type']) || '(unspecified)'
		var slug = nodeContent(item['wp:post_name'])
			|| nodeContent(item['wp:post_id'])
			|| String(i)
		obj.slug = slug
		for (var key in item) {
			// nodes inside item have lots of weird structures
			if (key === 'guid') {
				var guid = nodeContent(item[key])
				obj['guid'] = guid._
				for (var s in guid.$) {
					obj['guid:' + s] = guid.$[s]
				}
			} else if (key === 'category') {
				// figure this out later
				obj.category = {}
				for (var s in item[key]) {
					var cat = item[key][s]
					obj.category[cat._] = cat.$.domain + ' : ' + cat.$.nicename
				}
			} else if (key === 'wp:postmeta') {
				// figure this out later
				obj['wp:postmeta'] = cleanUpMetaObject(item[key])
			} else if (key === 'wp:comment') {
				for (var j = 0; j < item[key].length; j++) {
					var commentObj = item[key][j]
					var co = {}
					for (var s in commentObj) {
						if (s === 'wp:commentmeta') {
							co[s] = cleanUpMetaObject(commentObj[s])
						} else {
							co[s] = nodeContent(commentObj[s])
						}
					}
					commentList.push(co)
				}
			} else if (key === 'content:encoded') {
				if (type === 'post' || type === 'page') {
					// store encoded content for separate processing
					dat.postContent[slug] = item[key]
				}
			} else {
				// general case: key:val pair
				obj[key] = nodeContent(item[key])
			}
		}
		switch (type) {
			case 'page': //dat.pages[slug] = obj
			case 'post': 
				dat.postMeta[slug] = obj
				dat.postComments[slug] = commentList
				// break;
				break;
			case 'attachment': dat.attachments[slug] = obj
				break;
			case 'nav_menu_item': dat.navItems[slug] = obj
				break;
			default: console.log('Warning: found unknown item type: =' + typeof type + '=')
		}
	}
}

// helper for cleaning up wp:meta tag pairs
function cleanUpMetaObject(node, b) {
	var ret = {}
	for (var s in node) {
		var mkey = nodeContent(node[s]['wp:meta_key'])
		var mval = nodeContent(node[s]['wp:meta_value'])
		ret[mkey] = mval
	}
	return ret
}


// This runs through all posts to figure out what subfolder they should live in
//    /?p=123  -style posts will convert to:  /posts/123

function conformPaths(dat) {
	var err = []
	var base = dat.metadata.link
	// conform base link not to end with a slash
	if (/\/$/.test(base)) base = base.substring(0, base.length-1)
	// loop through posts, adding anything we can't deal with to err[]
	for (var slug in dat.postMeta) {
		var link = dat.postMeta[slug].link
		if (/\?p=(\d+)$/.test(link)) { err.push(slug); continue }
		if (link.indexOf(base) !== 0) { err.push(slug); continue }
		var tail = link.substring(base.length)
		if (/\/$/.test(tail)) tail = tail.substring(0, tail.length-1)
		var folders = tail.split('/')
		folders.pop() // that should have been the slug or post ID
		if (folders[0]==='') folders.shift()
		if (folders.length===0) { err.push(slug); continue }
		dat.postMeta[slug].wp_link_path = folders.join('/')
	}
	// run through errors
	err.forEach(function(slug){
		dat.postMeta[slug].wp_link_path = ''
	})
}


/*
 *		If you want to process the body of each post 
 * 		(convert html to md, etc.) here's where you do it: 
*/

function processPostContent(s) {
	return s
}



/*
 *		Functions for writing out content, based on the big dat file 
 * 
*/

function writeSiteMeta(dat, folder, filename) {
	// overall site metadata
	var out = {
		globals: {
			wp_data: dat.metadata,
			wp_authors: dat.authors,
		}
	}
	writeFile(folder, filename, JSON.stringify(out, null, 2))
}


function writePostMeta(dat, folder, filename) {
	// metadata for all posts
	var out = {
		wp_posts: dat.postMeta,
	}
	writeFile(folder, filename, JSON.stringify(out, null, 2))
}



function writePosts(dat, folder) {
	// write out actual post and page files, relative to the root folder
	for (var slug in dat.postContent) {
		var sub = getPostSubfolder(folder)//, dat.postMeta[slug].wp_link_path)
		var content = processPostContent(dat.postContent[slug])
		writeFile(sub, slug + '.md', content)
	}
}


function getPostSubfolder(root, subfolderString) {
	// settle for now on always returning /posts/ for post subfolders
	if (!_alreadyMade.posts) {
		_alreadyMade.posts = makeFolder(root, 'posts')
	}
	return _alreadyMade.posts
	
	// if you want posts placed in subfolders according to wordpress links
	// (e.g. /2015/12/foo) then below is an implementation that should work.
	// subfolderString is like:  foo/bar/baz   - no leading or tailing slash
	var m = _alreadyMade['/' + subfolderString]
	if (m) return m
	var farr = subfolderString.split('/')
	var loc = root
	var path = '/'
	for (var i=0; i<farr.length; i++) {
		var f = farr[i]
		var here = path+f
		if (!_alreadyMade[here]) _alreadyMade[here] = makeFolder(loc, f)
		loc = _alreadyMade[here]
		path = here
	}
	return loc
}
var _alreadyMade = {}





function writeComments(dat, folder) {
	// write comments into their own JSON, assuming people probably want to 
	// do something like convert them to disqus, not just serve them statically
	var out = dat.postComments
	writeFile(folder, '_data.json', JSON.stringify(out, null, 2))
}


function writeLinkInfo(dat, folder, filename) {
	// write a list of links that are probably broken, for the user to consider handling
	var base = dat.metadata.link
	var out = {}
	for (var slug in dat.postMeta) {
		var link = dat.postMeta[slug].link || ''
		var tail = link.substring(base.length)
		if (/\/$/.test(tail)) tail = tail.substring(0, tail.length-1)
		out[slug] = {}
		out[slug].converted_path = '/posts/' + slug + '.md'
		out[slug].wordpress_link = tail
		out[slug].wordpress_pver = '/?p=' + dat.postMeta[slug]['wp:post_id']
	}
	writeFile(folder, filename, JSON.stringify(out, null, 2))
}





/*
 * 
 * 		Internals below here - probably not useful to customize
 * 
*/


module.exports = function (xmlFile, folder) {
	var xml = fs.readFileSync(xmlFile, 'utf8')
	parser(xml, function (err, result) {
		var channel = result.rss.channel[0]
		doEverything(channel, folder)
	})
}

function writeFile(where, file, content) {
	var outpath = path.join(where, file)
	// console.log('fake write: '+outpath)
	var stream = fs.createWriteStream(outpath)
	// console.log('writing: ' + outpath)
	stream.once('open', function (fd) {
		stream.write(String(content))
		stream.end()
	})
}

function makeFolder(where, foldername) {
	var outpath = path.join(where, foldername)
	// console.log('fake mkdir: ' + outpath)
	fs.mkdirSync(outpath)
	return outpath
}

function copyFile(src, where, file) {
	var content = fs.readFileSync(src, 'utf8')
	writeFile(where, file, content)
}










