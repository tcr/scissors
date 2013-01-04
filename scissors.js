var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');
var Stream = require('stream').Stream;

var BufferStream = require('bufferstream');
var temp = require('temp');
var async = require('async');

// Calls functions once a promise has been delivered.
// Queue functions by using promise(yourCallback); Deliver the promise using promise.deliver().
// Once the promise has been delivered, promise(yourCallback) immediately calls.

function promise () {
  var queue = [], args = null;
  var promise = function (fn) {
    if (promise.delivered) {
      process.nextTick(function () {
        fn.apply(null, args);
      });
    } else {
      queue.push(fn);
    }
  }
  promise.deliver = function () {
    args = arguments, promise.delivered = true;
    queue.splice(0, queue.length).forEach(function (fn) {
      process.nextTick(function () {
        fn.apply(null, args);
      });
    });
  }
  return promise;
}

function proxyStream (a, b) {
  if (a && b) {
    a
      .on('data', b.emit.bind(b, 'data'))
      .on('end', b.emit.bind(b, 'end'))
      .on('error', b.emit.bind(b, 'error'));
  }
}

// scissors

function Command (input, ready) {
  this.input = input;
  this.commands = [];
  this.onready = promise();
  if (ready !== false) {
    this.onready.deliver();
  }
}

Command.prototype._copy = function () {
  var cmd = new Command();
  cmd.input = this.input;
  cmd.commands = this.commands.slice();
  cmd.onready = this.onready;
  return cmd;
}

Command.prototype._push = function (command) {
  this.commands.push(command);
  this.input = command;
  return this;
}

Command.prototype._input = function () {
  // Non-existant files will throw an error, assume full paths.
  try {
    return typeof this.input == 'string' ? fs.realpathSync(this.input) : '-';
  } catch (e) {
    return this.input;
  }
};

// Cloning commands.

Command.prototype.range = function (min, max) {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(),
    'cat', min + (max === null ? '' : '-' + max),
    'output', '-'
    ]);
};

Command.prototype.pages = function () {
  var args = Array.prototype.slice.call(arguments);
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(),
    'cat'].concat(args.map(Number), [
      'output', '-'
      ]));
};

Command.prototype.odd = function (min, max) {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(),
    'cat', 'odd',
    'output', '-'
    ]);
};

Command.prototype.even = function (min, max) {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(),
    'cat', 'even',
    'output', '-'
    ]);
};

Command.prototype.reverse = function (min, max) {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(),
    'cat', 'end-1',
    'output', '-'
    ]);
};

Command.prototype.rotate = function (amount) {
  var cmd = this._copy();
  this.buffer();
  var amount = Number(amount) % 360, dir = null;
  switch (amount) {
    case 90: case -270: dir = 'R'; break;
    case 180: case -180: dir = 'D'; break;
    case -90: case 270: dir = 'L'; break;
    default: return this;
  }
  return cmd._push([
    'pdftk', cmd._input(),
    'cat', '1-end' + dir,
    'output', '-'
    ]);
};

Command.prototype.compress = function () {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(), 'output', '-',
    'compress'
    ]);
};

Command.prototype.uncompress = function () {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(), 'output', '-',
    'uncompress'
    ]);
};

Command.prototype.repair = function () {
  // pdftk extraction of a single page causes issues for some reason.
  // "repairing" using pdftk fixes this.
  var cmd = this._copy();
  var args = [
    'pdftk', this._input(), 'output', '-',
    ];
  // Don't double-repair.
  if (JSON.stringify(this.commands[this.commands.length - 1]) != JSON.stringify(args)) {
    cmd._push(args);
  }
  return cmd;
};

Command.prototype.crop = function (l, b, r, t) {
  var cmd = this.uncompress();
  return cmd._push([path.join(__dirname, 'bin/crop.js'), l, b, r, t]);
};

Command.prototype.pdfStream = function () {
  var cmd = this.repair();
  return cmd._exec();
};

Command.prototype.pngStream = function (dpi) {
  var cmd = this.repair();
  cmd._push([path.join(__dirname, 'bin/rasterize.js'), this._input(), 'pdf', 1, dpi || 72]);
  var stream = cmd._exec();
  return stream;
};

// Consumes this.pdfStream()
Command.prototype._commandStream = function () {
  var stream = new BufferStream({
    size: 'flexible'
  });
  var buf = [];
  stream.split('\n', function (line) {
    var tokens = String(line).split(/[ ](?=[^\)]*?(?:\(|$))/);
    var data = (function () {
      switch (tokens[0]) {
        case 'S': return {type: 'string', x: +tokens[1], y: +tokens[2], string: tokens[3].replace(/^.|.$/g, '')};
        case 'F': return {type: 'font', height: +tokens[1], width: +tokens[2], font: (tokens[3] || '').replace(/^.|.$/g, '')};
        case 'P': return {type: 'endpage'};
        case 'C': return {type: 'color', r: +tokens[1], g: +tokens[2], b: +tokens[3]};
        case 'I': return {type: 'image', x: +tokens[1], y: +tokens[2], width: +tokens[3], height: +tokens[4]};
        case 'R': return {type: 'rectangle', x: +tokens[1], y: +tokens[2], width: +tokens[3], height: +tokens[4]};
      }
    })();
    if (data) {
      stream.emit('data', data);
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

// Consumes this.pdfStream()
Command.prototype.contentStream = function () {
  function isNextStringPartOfLastString (b, a, font) {
    // NOTE: This is a completely arbitrary hueristic.
    // I wouldn't trust it to not break.
    return Math.abs(a.y - b.y) < 50 && Math.abs((a.x + (a.string.length*(font.width / 3))) - b.x) < (font.width + 10);
  }

  function decode (str) {
    return String(str).replace(/\\(\d{3}|.)/g, function (str, esc) {
      if (esc.length == 3) {
        return String.fromCharCode(parseInt(esc, 8));
      } else {
        try {
          return JSON.parse('"' + str + '"');
        } catch (e) {
          return esc;
        }
      }
    });
  }

  var stream = new Stream(), str = '', first = null, last = null, font = null, color = null, imgindex = 0;
  this._commandStream().on('data', function (cmd) {
    if (cmd.type == 'string') {
      if (!last || isNextStringPartOfLastString(cmd, last, font)) {
        str += decode(cmd.string);
      } else {
        stream.emit('data', {
          type: 'string', x: (first || cmd).x, y: (first || cmd).y, 
          string: str, font: font, color: color
        });
        str = decode(cmd.string);
        first = cmd;
      }
      last = cmd;
    } else if (cmd.type == 'image') {
      cmd.index = imgindex++;
      stream.emit('data', cmd);
    } else if (cmd.type == 'font') {
      delete cmd.type;
      font = cmd;
    } else if (cmd.type == 'color') {
      delete cmd.type;
      color = cmd;
    }
  }).on('end', function () {
    if (str) {
      stream.emit('data', {
        type: 'string', x: (first || cmd).x, y: (first || cmd).y, 
        string: str, font: font, color: color
      });
      str = '';
    }
  });
  return stream;
};

// Consumes this.pdfStream()
Command.prototype.textStream = function () {
  var stream = new Stream();
  this.contentStream().on('data', function (cmd) {
    if (cmd.type == 'string') {
      stream.emit('data', cmd.string);
    }
  })
  return stream;
};

// Consumes this.pdfStream()
Command.prototype.extractImageStream = function (i) {
  // NOTE: This is pretty costly and uses another dependency.
  // Preferrably, this would be done in Ghostscript.
  i = i || 0;
  var stream = new Stream();
  if (!this._pdfimages) {
    var callback = this._pdfimages = promise();
    temp.mkdir('pdfimages', function (err, dirPath) {
      this.pdfStream()
        .pipe(fs.createWriteStream(path.join(dirPath, 'file.pdf')))
        .on('close', function () {
          var prog = spawn('pdfimages', ['-j', dirPath + '/file.pdf', dirPath + '/A']);
          prog.stderr.on('data', function (data) {
            process.stderr.write('pdfimages: ' + String(data));
          });
          prog.on('exit', function (code) {
            if (code) {
              console.error('pdfimages exited with failure code:', code);
              throw new Error('pdfimages failed.');
            }
            var files = fs.readdirSync(dirPath).slice(0, -1).map(function (file) {
              return dirPath + '/' + file;
            });
            callback.deliver(files);
          });
        }.bind(this))
    }.bind(this));
  }

  // Add callback to promise.
  this._pdfimages(function (pdfimages) {
    if (!pdfimages[i]) {
      stream.emit('error', new Error('Image ' + i + ' out of bounds.'));
      return;
    }
    proxyStream(fs.createReadStream(pdfimages[i]), stream);
  });

  return stream;
};

Command.prototype._exec = function () {
  var stream = new Stream(), commands = this.commands.slice();
  this.onready(function () {
    proxyStream(commands.reduce(function (input, command) {
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
    }, null), stream);
  });
  return stream;
}

var scissors = function (path) {
  return new Command(path);
}

var joinTemp = temp.mkdirSync('pdfimages'), joinindex = 0;

scissors.join = function () {
  var args = Array.prototype.slice.call(arguments);

  var outfile = joinTemp + '/' + (joinindex++) + '.pdf';
  var pdf = new Command(outfile, false);

  async.map(args, function (arg, next) {
    var file = joinTemp + '/' + (joinindex++) + '.pdf';
    arg.pdfStream()
      .pipe(fs.createWriteStream(file))
      .on('close', function () {
        next(null, file);
      });
  }, function (err, files) {
    command = ['pdftk'].concat(files, ['output', outfile]);
    var prog = spawn(command[0], command.slice(1));
    console.error('spawn:', command.join(' '));
    prog.stderr.on('data', function (data) {
      process.stderr.write(command[0].match(/[^\/]*$/)[0] + ': ' + String(data));
    });
    prog.on('exit', function (code) {
      if (code) {
        console.error(command[0], 'exited with failure code:', code);
      }
      // PDF is now ready.
      pdf.onready.deliver();
    });
  });

  return pdf;
}

module.exports = scissors;

/*

references

## References

* http://hzqtc.github.com/2012/04/pdf-tools-merging-extracting-and-cropping.html
* http://documentcloud.github.com/docsplit/
* http://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
* http://segfault.in/2010/07/pdf-manipulations-and-conversions-from-linux-command-prompt/
* http://www.maths.ox.ac.uk/help/faqs/files/manipulating-pdf-files
* http://stackoverflow.com/questions/11754556/ghostscript-convert-a-pdf-and-output-in-a-textfile
* http://right-sock.net/linux/better-convert-pdf-to-jpg-using-ghost-script/
* http://stackoverflow.com/questions/12484353/how-to-crop-a-section-of-a-pdf-file-to-png-using-ghostscript?lq=1

*/