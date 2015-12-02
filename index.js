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
	
	// write out site globals and base folder templates
	writeGlobals(dat, folder, '_harp.json')
	copyFile('templates/index.jade', folder, 'index.jade')
	copyFile('templates/_layout.jade', folder, '_layout.jade')
	
	// write posts to posts folder
	var postDir = makeFolder(folder, 'posts')
	writePosts(dat, postDir, '_data.json')
	copyFile('templates/posts/_layout.jade', postDir, '_layout.jade')
	
	// copy more static stuff
	var cssDir = makeFolder(folder, 'css')
	copyFile('templates/css/style.less', cssDir, 'style.less')
}





function buildAllData(channel) {
	// huge data object to store everything
	var dat = {
		metadata: {},
		authors: [],
		postMeta: {},
		postContent: {},
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
				var comments = obj['wp:comment'] = []
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
					comments.push(co)
				}
			} else if (key === 'content:encoded') {
				if (type === 'post') {
					// store encoded content for separate processing
					dat.postContent[slug] = item[key]
				}
			} else {
				// general case: key:val pair
				obj[key] = nodeContent(item[key])
			}
		}
		switch (type) {
			case 'post': dat.postMeta[slug] = obj
				break;
			case 'page': dat.pages[slug] = obj
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

function writeGlobals(dat, folder, filename) {
	var out = {
		globals: {
			wpdata: dat.metadata,
			wpauthors: dat.authors
		}
	}
	writeFile(folder, filename, JSON.stringify(out, null, 2))
}



function writePosts(dat, folder, filename) {
	// posts metadata
	var out = dat.postMeta
	writeFile(folder, filename, JSON.stringify(out, null, 2))
	
	// post files
	for (var s in dat.postContent) {
		var content = processPostContent(dat.postContent[s])
		writeFile(folder, s + '.md', content)
	}
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
	var stream = fs.createWriteStream(outpath)
	// console.log('writing: ' + outpath)
	stream.once('open', function (fd) {
		stream.write(String(content))
		stream.end()
	})
}

function makeFolder(where, foldername) {
	var outpath = path.join(where, foldername)
	fs.mkdirSync(outpath)
	return outpath
}

function copyFile(src, where, file) {
	var content = fs.readFileSync(src, 'utf8')
	writeFile(where, file, content)
}










