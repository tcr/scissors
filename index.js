var fs = require('fs');
var spawn = require('child_process').spawn;

var temp = require('temp');
require('bufferjs/indexOf');

function stripCropbox (ins, outs) {
	ins.on('data', function (data) {
		var i;
		if ((i = data.indexOf('/CropBox')) != -1) {
			outs.write(data.slice(0, i));
			console.log(i, String(data.slice(i, i + 50)));
			while (data[i] != '\n'.charCodeAt(0)) {
				i++;
			}
			console.log(i);
			outs.write(data.slice(i));
		} else {
			outs.write(data);
		}
	});

/*
	'gs', [
	  '-sDEVICE=pdfwrite',
	  '-o', 'cropped.pdf',
	  '-c', '[/CropBox [224 272 900 794] /PAGES pdfmark',
	  '-f', 'page3.pdf'
*/
}


// spindrift

var capitals = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function Command (path) {
	this.prefix = [];
	this.input = fs.realpathSync(path);
	this.operation = null;
	this.suffix = null;
}

Command.prototype.buffer = function () {
	if (this.operation) {
		this.prefix.push(this.args());
		this.input = '-';
		this.operation = null;
		this.suffix = null;
	}
}

Command.prototype.subset = function (min, max) {
	this.buffer();
	this.operation = ['cat', min + (max === null ? '' : '-' + max)];
	return this;
};

Command.prototype.odd = function (min, max) {
	this.buffer();
	this.operation = ['cat', 'odd'];
	return this;
};

Command.prototype.even = function (min, max) {
	this.buffer();
	this.operation = ['cat', 'even'];
	return this;
};

Command.prototype.reverse = function (min, max) {
	this.buffer();
	this.operation = ['cat', 'end-1'];
	return this;
};

Command.prototype.rotate = function (amount) {
	this.buffer();
	var amount = Number(amount) % 360, dir = null;
	switch (amount) {
		case 90: case -270: dir = 'R'; break;
		case 180: case -180: dir = 'D'; break;
		case -90: case 270: dir = 'L'; break;
		default: return this;
	}
	this.operation = ['cat', '1-end' + dir];
	return this;
};

Command.prototype.compress = function () {
	this.buffer();
	this.operation = [];
	this.suffix = ['compress'];
	return this;
};

Command.prototype.uncompress = function () {
	this.buffer();
	this.operation = [];
	this.suffix = ['uncompress'];
	return this;
};

Command.prototype.args = function () {
	return ['pdftk', this.input].concat(this.operation, ['output', '-'], this.suffix || []);
};

Command.prototype.createStream = function () {
	return this.prefix.concat([this.args()]).reduce(function (input, command) {
	  var pdftk = spawn(command.shift(), command);
	  console.log(command);
	  if (input) {
	  	input.pipe(pdftk.stdin);
	  }
		pdftk.stderr.on('data', function (data) {
		  console.error('pdftk encountered an error:', String(data));
		});
		pdftk.on('exit', function (code) {
			if (code) {
		  	console.error('pdftk exited with failure code:', code);
		  }
		});
		return pdftk.stdout;
	}, null);
}

var spindrift = function (path) {
	return new Command(path);
}

spindrift.join = function () {
	var args = Array.prototype.slice.call(arguments);
	args.forEach(function (arg) {
		if (arg);
	});
}

module.exports = spindrift;

//var spindrift = require('spindrift');
//var cmd = spindrift('test.pdf').subset(1, 1);
//cmd.uncompress().createStream().pipe(fs.createWriteStream('test-out.pdf'));



/*

		this.opts.files.map(function (path, i) {
			return capitals[i] + '=' + path
		}),*/