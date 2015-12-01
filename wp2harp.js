#!/usr/bin/node
/* globals __dirname, process */

'use strict';


// .bin/wp2harp points here..

var fs = require('fs')
var lib = require('./index')


// input handling

var err = false
var args = process.argv.slice(2)

function fail(s) {
	console.log(s)
	process.exit()
}

var f0 = args[0]
var f1 = args[1]
if (!f0 || !f1) {
	fail('\nInvalid inputs! \n\nUsage: node wp2harp myWordpress.xml outputDir\n')
}


if (!fs.existsSync(f0) || !fs.statSync(f0).isFile()) {
	fail("\nCouldn't find input file: "+ f0 + 
		" \n\nUsage: node wp2harp myWordpress.xml outputDir\n")
}

if (!fs.existsSync(f1) || !fs.statSync(f1).isDirectory()) {
	fail("\nCouldn't find output directory: "+ f1 +
		" \n\nUsage: node wp2harp myWordpress.xml outputDir\n")
}


lib(f0, f1)

