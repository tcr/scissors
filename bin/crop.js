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

function repairPDF (outs) {
	var pdftk = spawn('pdftk', ['-', 'output', '-']);
	pdftk.stderr.on('data', function (data) {
	  debug('pdftk encountered an error:\n', String(data));
	});
	pdftk.on('exit', function (code) {
		if (code) {
	  	debug('pdftk exited with failure code:', code);
	  }
	});
	pdftk.stdout.pipe(outs);
	return pdftk.stdin;
}

function stripCropbox (ins, outs, next) {
	var cropbox = [0, 0, 0, 0];
	var repair = repairPDF(outs);
	ins.on('data', function (data) {
		var i;
		if ((i = data.indexOf('/CropBox')) != -1) {
			repair.write(data.slice(0, i));
			for (var j = i; data[j] != '\n'.charCodeAt(0); ) {
				j++;
			}
			debug('Spindrift: found cropbox', String(data.slice(i, j)));
			cropbox = String(data.slice(i, j))
				.match(/\/CropBox\s+\[([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\]/)
				.slice(1, 5).map(Number);
			repair.write(data.slice(j + 1));
		} else {
			repair.write(data);
		}
	});
	ins.on('end', function () {
		debug('Spindrift: Finished stripping cropbox.');
		repair.end();
	})
	outs.on('close', function (err) {
		next(err, cropbox);
	});
}

function combineCropboxes (a, b) {
	return [a[0] + b[0], a[1] + b[1], Math.min(a[0] + b[2], a[2]), Math.min(a[1] + b[3], a[3])];
}

function writeCropbox (ins, cropbox) {
	var gs = spawn('gs', [
	  '-sDEVICE=pdfwrite',
	  '-sOutputFile=-',
	  '-q',
	  //'-sstdout=/dev/null',
	  '-dNOPAUSE', '-dBATCH',
	  '-c', '[/CropBox [' + cropbox.join(' ') + '] /PAGES pdfmark',
	  '-f', '-']);
	ins.pipe(gs.stdin);
	gs.stderr.on('data', function (data) {
	  debug('gs encountered an error:\n', String(data));
	});
	gs.on('exit', function (code) {
		if (code) {
	  	debug('gs exited with failure code:', code);
	  }
	  debug('Spindrift: Finished writing cropbox.');
	});
	return gs.stdout;
}

//stripCropbox(process.stdin, fs)

if (process.argv.length < 6) {
	debug('Invalid number of arguments.');
	process.exit(1);
}

var modcropbox = process.argv.slice(2, 6).map(Number);

debug('Spindrift: opening temp file');
temp.open('stripCropbox', function (err, info) {
	debug('Spindrift: closing temp file', info.path);
	fs.close(info.fd, function () {
		debug('Spindrift: closed.');
		stripCropbox(process.stdin, fs.createWriteStream(info.path), function (err, cropbox) {
			if (err) {
				return debug(err);
			}
			//fs.createReadStream(info.path).pipe(process.stdout);
			writeCropbox(fs.createReadStream(info.path), combineCropboxes(cropbox, modcropbox))
				.pipe(process.stdout);
		});
		process.stdin.resume();
	});
});