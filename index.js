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





function buildEverything(channel, folder) {
	// write globals to base folder, and base templates
	writeGlobalData(channel, folder, '_harp.json')
	copyFile('templates/index.jade', folder, 'index.jade')
	copyFile('templates/_layout.jade', folder, '_layout.jade')
	
	// write posts to posts folder
	var postDir = makeFolder(folder, 'posts')
	// writeGlobalData(channel, postDir, '_data.json')
	
	// copy more static stuff
	var cssDir = makeFolder(folder, 'css')
	copyFile('templates/css/style.less', cssDir, 'style.less')
}





function writeGlobalData(channel, folder, filename) {
	var wpdata = {}
	var wpauthors = []
	for (var s in channel) {
		if (channel[s].length===1 && typeof channel[s][0] === 'string') {
			// key with a string value - treat as metadata
			wpdata[s] = channel[s][0]
		} else if (/author/.test(s)) {
			// author entry - exact name of key seems to vary
			var authors = channel[s]
			for (var a in authors) {
				var wpauthor = {}
				for (var longname in authors[a]) {
					var aname = /wp:author_(.*)/.exec(longname)[1]
					wpauthor[aname] = authors[a][longname][0]
				}
				wpauthors.push(wpauthor)
			}
		} else {
			console.log('todo: ', s)
		}
	}

	
	var out = {
		globals: {
			wpdata: wpdata,
			wpauthors: wpauthors
		}
	}
	writeFile(folder, filename, JSON.stringify( out, null, 2))
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
		buildEverything(channel, folder)
	})
}

function writeFile(where, file, content) {
	var outpath = path.join(where, file)
	var stream = fs.createWriteStream(outpath)
	console.log('writing: '+outpath)
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










