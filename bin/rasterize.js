#!/usr/bin/env node

var fs = require('fs');
var spawn = require('child_process').spawn;

var temp = require('temp');
require('bufferjs/indexOf');

// take stdin, write to random access file
// strip cropbox
// then reapply cropbox and write to stdout
// http://stackoverflow.com/questions/6183479/cropping-a-pdf-using-ghostscript-9-01?rq=1

function debug () {
	console.error.apply(console, arguments);
}

function readBoundingBox (ins, page, next) {
	var boundingbox = [0, 0, 0, 0];
	var gs = spawn('gs', [
		'-q',
	  '-dNOPAUSE', '-dBATCH',
	  '-sDEVICE=bbox',
	  '-dFirstPage=' + page, '-dLastPage=' + page,
	  '-f', '-']);
	ins.pipe(gs.stdin);
	gs.stderr.on('data', function (data) {
		if (String(data).match(bbox)) {
			boundingbox = String(data).match(bbox).slice(1,5).map(Number);
			console.error(boundingbox);
		}
	});
	var bbox = /%%BoundingBox: (\d+) (\d+) (\d+) (\d+)/
	gs.on('exit', function (code) {
		console.error('ended');
	  next(code, boundingbox);
	});
}

function rasterizeImage (ins, page, dpi, boundingbox) {
	var multiplier = dpi / 72;
	var gs = spawn('gs', [
		'-q',
		'-sDEVICE=png16m',
	  '-sOutputFile=-',
	  '-r' + dpi,
	  '-g' + 
	  	Math.ceil((boundingbox[2] - boundingbox[0] + 2)*multiplier) +
	  	'x' + Math.ceil((boundingbox[3] - boundingbox[1] + 2)*multiplier),
	  '-dNOPAUSE', '-dBATCH',
	  '-dFirstPage=' + page, '-dLastPage=' + page,
	  '-c', '<</Install {' + (-(boundingbox[0] - 1)) + ' ' + (-(boundingbox[1] - 1)) + ' translate}>> setpagedevice',
	  '-f', '-']);
	ins.pipe(gs.stdin);
	gs.stderr.on('data', function (data) {
	  debug('gs encountered an error:\n', String(data));
	});
	gs.on('exit', function (code) {
		if (code) {
	  	debug('gs exited with failure code:', code);
	  }
	  debug('Finished writing image.');
	});
	return gs.stdout;
}

function createTempFile (next) {
	debug('opening temp file');
	temp.open('spindrift', function (err, info) {
		debug('closing temp file', info.path);
		fs.close(info.fd, function () {
			debug('closed.');
			next(info.path);
		});
	});
}

//stripCropbox(process.stdin, fs)

if (process.argv.length < 5) {
	debug('Invalid number of arguments.');
	process.exit(1);
}

var input = process.argv[2];
var format = process.argv[3];
var page = Number(process.argv[4]) || 1;
var dpi = Number(process.argv[5]) || 72;

createTempFile(function (path) {
	var inputStream = input == '-' ? process.stdin : fs.createReadStream(input);
	readBoundingBox(inputStream, page, function (err, boundingbox) {
		if (err) {
			return debug(err);
		}
		rasterizeImage(fs.createReadStream(path), page, dpi, boundingbox)
			.pipe(process.stdout);
	});
	inputStream.resume();
	inputStream.pipe(fs.createWriteStream(path));
});