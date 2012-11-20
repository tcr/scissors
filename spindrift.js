var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');

var BufferStream = require('bufferstream');
var temp = require('temp');

// spindrift

function Command (input) {
	this.input = input;
	this.commands = [];
}

Command.prototype._push = function (command) {
	this.commands.push(command);
	this.input = command;
	return this;
}

Command.prototype._input = function () {
	return typeof this.input == 'string' ? fs.realpathSync(this.input) : '-';
};

Command.prototype.pages = function (min, max) {
	return this._push([
		'pdftk', this._input(),
		'cat', min + (max === null ? '' : '-' + max),
		'output', '-'
		]);
};

Command.prototype.page = function (page) {
	return this.pages(page, page);
};

Command.prototype.odd = function (min, max) {
	return this._push([
		'pdftk', this._input(),
		'cat', 'odd',
		'output', '-'
		]);
};

Command.prototype.even = function (min, max) {
	return this._push([
		'pdftk', this._input(),
		'cat', 'even',
		'output', '-'
		]);
};

Command.prototype.reverse = function (min, max) {
	return this._push([
		'pdftk', this._input(),
		'cat', 'end-1',
		'output', '-'
		]);
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
	return this._push([
		'pdftk', this._input(),
		'cat', '1-end' + dir,
		'output', '-'
		]);
};

Command.prototype.deflate = function () {
	return this._push([
		'pdftk', this._input(), 'output', '-',
		'compress'
		]);
};

Command.prototype.inflate = function () {
	return this._push([
		'pdftk', this._input(), 'output', '-',
		'uncompress'
		]);
};

Command.prototype.repair = function () {
	// pdftk extraction of a single page causes issues for some reason.
	return this._push([
		'pdftk', this._input(), 'output', '-',
		]);
};

Command.prototype.crop = function (l, b, r, t) {
	this.inflate();
	return this._push([path.join(__dirname, 'bin/crop.js'), l, b, r, t]);
};

Command.prototype.pngStream = function (dpi) {
	this._push([path.join(__dirname, 'bin/rasterize.js'), this._input(), 'pdf', 1, dpi || 72]);
	return this._exec();
};

Command.prototype.pdfStream = function () {
	this.repair();
	return this._exec();
};

Command.prototype.textStream = function () {
	var stream = new BufferStream({
		size: 'flexible'
	});
	var buf = [];
	stream.split('\n', function (line) {
	  var tokens = String(line).split(/[ ](?=[^\)]*?(?:\(|$))/);

	  // Simple sequential string detection.
	  if (tokens[0] == 'S') {
	  	var str = tokens[3].replace(/^.|.$/g, '');
	  	if (str.match(/^\s*$/)) {
	  		if (buf.length) {
	  			stream.emit('data', buf.join(' '));
	  		}
	  		buf = [];
	  	} else {
	  		buf.push(str);
	  	}
	  }
	});

	var gs = spawn('gs', [
	  '-q', '-dNODISPLAY',
	  '-P-',
	  '-dSAFER',
	  '-dDELAYBIND',
	  '-dWRITESYSTEMDICT',
	  '-dCOMPLEX', path.join(__dirname, 'contrib/ps2ascii.ps'),
	  '-', '-c', 'quit']);
	this.pdfStream().pipe(gs.stdin);
	gs.stdout.pipe(stream);
	gs.stderr.on('data', function (data) {
	  console.error('gs encountered an error:\n', String(data));
	});
	gs.on('exit', function (code) {
		stream.emit('end');
	});
	return stream;
};

/*

// TODO content extract

http://git.ghostscript.com/?p=ghostpdl.git;a=blob;f=gs/lib/ps2ascii.ps;h=2b0e2d581094b4c6397f926817872a05dae8af7c;hb=HEAD

.commands() => []
.bound(l, b, r, t)
.group(resolution) // combines strings into groups, logically higher groups?
.text()
.rows() // susses out rows of elements
.columns() // susses out columns of elements

  */

Command.prototype._exec = function () {
	return this.commands.reduce(function (input, command) {
	  var prog = spawn(command[0], command.slice(1));
	  console.error('spawn:', command.join(' '));
	  if (input) {
	  	input.pipe(prog.stdin);
	  }
		prog.stderr.on('data', function (data) {
		  process.stderr.write(command[0].match(/[^\/]*$/)[0] + ': ' + String(data));
		});
		prog.on('exit', function (code) {
			if (code) {
		  	console.error(command[0], 'exited with failure code:', code);
		  }
		});
		return prog.stdout;
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