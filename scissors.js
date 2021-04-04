/**
 * @module scissors
 */

// imports
var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');
var Stream = require('stream').Stream;
var BufferStream = require('bufferstream');
var temp = require('temp').track();
var async = require('async');
var Promise = require('any-promise');
var rimraf = require('rimraf').sync;

/*
    Internal functions
 */

/**
 * Non-standard lightweight internal promise implementation with a simple callback
 * Queue functions by using promise(yourCallback); Deliver the promise using
 * promise.deliver(). Once the promise has been delivered, promise(yourCallback)
 * immediately calls.
 * @ignore
 * @return {Function}
 */
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

/**
 * Forwards stream events "data", "end" and "error" from
 * stream a to stream b
 * @ignore
 * @param  {Stream} a The source stream
 * @param  {Stream} b The target stream
 */
function proxyStream (a, b) {
  if (a && b) {
    a
      .on('data', b.emit.bind(b, 'data'))
      .on('end', b.emit.bind(b, 'end'))
      .on('error', b.emit.bind(b, 'error'));
  }
}

/**
 * Constructor of Command instance
 * @inner
 * @constructor
 * @param {mixed} input Should be either a filename (string) or a pipe. If it's 
 * a pipe, this.stream is set to that value, otherwise null.

 * @param {Boolean} ready Whether the command has been fully executed
 */
function Command (input, ready) {
  this.input = input;
  // is input stream?
  if (typeof this.input !== 'string' && this.input && this.input.pipe) {
    this.stream = this.input;
  } else {
    this.stream = null;
  }
  this.commands = [];
  this.onready = promise();
  if (ready !== false) {
    this.onready.deliver();
  }
}

/**
 * Makes a copy of the commands in the queue and adds the input
 * @return {Command} A chainable Command instance
 */
Command.prototype._copy = function () {
  var cmd = new Command();
  cmd.input = this.input;
  cmd.stream = this.stream;
  cmd.commands = this.commands.slice();
  cmd.onready = this.onready;
  return cmd;
}

/**
 * Pushes a command to the queue
 * @param  {Array} command
 * @return {Command} A chainable Command instance
 */
Command.prototype._push = function (command) {
  this.commands.push(command);
  this.input = command;
  return this;
}

/**
 * Returns what the command line expects to receive,  i.e. either the filename
 * or - (i.e. stdin)
 * @return {string}
 */
Command.prototype._input = function () {
  // Non-existant files will throw an error, assume full paths.
  try {
    return typeof this.input == 'string' ? fs.realpathSync(this.input) : '-';
  } catch (e) {
    return this.input;
  }
};

/**
 * Marks a folder to be deleted on cleanup
 * @param  {String} folder
 * @return {Command} A chainable Command instance
 */
Command.prototype._markCleanupFolder = function (folder) {
  this._cleanupFolders = this._cleanupFolders || [];
  this._cleanupFolders.push(folder);
  return this;
};

/*
    Chainable instance methods, return a Command instance
 */

/**
 * Creates a copy of a page range
 * @param  {number} min First page
 * @param  {number} max Last page. If omitted, all pages starting with
 * first page are used.
 * @return {Command} A chainable Command instance
 */
Command.prototype.range = function (min, max) {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(),
    'cat', min + (max ? '-' + max : '-end'),
    'output', '-'
    ]);
};

/**
 * Creates a copy of the pages with the given numbers
 * @param {(...Number|Array)} Page number, either as an array or as arguments
 * @return {Command} A chainable Command instance
 */
Command.prototype.pages = function () {
  var args = (Array.isArray(arguments[0])) ?
    arguments[0] : Array.prototype.slice.call(arguments);
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(),
    'cat'].concat(args.map(Number), [
      'output', '-'
      ]));
};

/**
 * Creates a copy of all pages with an odd page number
 * @return {Command} A chainable Command instance
 */
Command.prototype.odd = function (/*min, max*/) {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(),
    'cat', 'odd',
    'output', '-'
    ]);
};

/**
 * Creates a copy of all pages with an even page number
 * @return {Command} A chainable Command instance
 */
Command.prototype.even = function (/*min, max*/) {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(),
    'cat', 'even',
    'output', '-'
    ]);
};

/**
 * Creates a copy of the input in reverse order
 * @return {Command} A chainable Command instance
 */
Command.prototype.reverse = function (/*min, max*/) {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(),
    'cat', 'end-1',
    'output', '-'
    ]);
};

/**
 * Rotates a copy of the input with the given degree
 * @param {number} amount
 * @return {Command} A chainable Command instance
 */
Command.prototype.rotate = function (amount) {
  var cmd = this._copy();
  amount = Number(amount) % 360;
  var dir = null;
  switch (amount) {
    case 90: case -270: dir = 'EAST'; break;
    case 180: case -180: dir = 'SOUTH'; break;
    case -90: case 270: dir = 'WEST'; break;
    case 0: return this;
    default: 
    throw new Error("Invalid rotation angle: " + amount);
  }
  return cmd._push([
    'pdftk', cmd._input(),
    'cat', '1-end' + dir,
    'output', '-'
    ]);
};


/**
 * Compresses the input
 * @return {Command} A chainable Command instance
 */
Command.prototype.compress = function () {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(), 'output', '-',
    'compress'
    ]);
};

/**
 * Uncompresses the input
 * @return {Command} A chainable Command instance
 */
Command.prototype.uncompress = function () {
  var cmd = this._copy();
  return cmd._push([
    'pdftk', cmd._input(), 'output', '-',
    'uncompress'
    ]);
};

/**
 * Repairs the input
 * @return {Command} A chainable Command instance
 */
Command.prototype.repair = function () {
  // pdftk extraction of a single page causes issues for some reason.
  // "repairing" using pdftk fixes this.
  var cmd = this._copy();
  var args = [
    'pdftk', this._input(), 'output', '-'
    ];
  // Don't double-repair.
  if (JSON.stringify(this.commands[this.commands.length - 1]) != JSON.stringify(args)) {
    cmd._push(args);
  }
  return cmd;
};

/**
 * Crops the input to a box defined by two x-y coordinates (left bottom / 
 * right top) in pt (72 points == 1 inch == 25.4 millimeters, 1mm = 2,8pt),
 * measured from the bottom left (coordinates 0,0).
 * Doesn't work with all PDFs yet, see // https://github.com/tcr/scissors/issues/21
 *
 * @param  {number} l Left x coordinate in pt
 * @param  {number} b Bottom y coordinate in pt
 * @param  {number} r Right x coordinate in pt
 * @param  {number} t Top y coordinate in pt
 * @return {Command} A chainable Command instance
 */
Command.prototype.crop = function (l, b, r, t) {
  var cmd = this.uncompress();
  return cmd._push([path.join(__dirname, 'bin/crop.js'), l, b, r, t]);
};

/*
    Instance methods returning a stream
 */

/**
 * Returns a stream with the output of `pdftk infile dump_data` (a report on PDF
 * document metadata and bookmarks). Used by {@link Command#getNumPages}. Might
 * be removed or turned into internal function, since it is very similar to
 * {@link Command#propertyStream}
 * @return {Stream}
 */
Command.prototype.dumpData = function () {
  var cmd = this._copy();
  cmd._push([
    'pdftk', cmd._input(),
    'dump_data'
    ]);
  return cmd._exec();
};

/**
 * Returns a stream with the PDF data
 * @return {Stream}
 */
Command.prototype.pdfStream = function () {
  var cmd = this.repair();
  return cmd._exec();
};

/**
 * Returns a stream with the PNG data in the given resolution
 * @param  {number} dpi DPI resolution
 * @return {Stream}
 */
 Command.prototype.pngStream = function (dpi, page, useSimpleRasterize, useCropBox) {
   return this.imageStream(dpi, 'png', page, useSimpleRasterize, useCropBox);
 };

 /**
  * Returns a stream with the JPG data in the given resolution
  * @param  {number} dpi DPI resolution
  * @return {Stream}
  */
 Command.prototype.jpgStream = function (dpi, page, useSimpleRasterize, useCropBox) {
   return this.imageStream(dpi, 'jpg', page, useSimpleRasterize, useCropBox);
 };

 /**
  * Returns a stream with the image data in the given resolution
  * @param  {number} dpi DPI resolution
  * @return {Stream}
  */
 Command.prototype.imageStream = function (dpi, format, page, useSimpleRasterize, useCropBox) {
   var cmd = this.repair();
   var rasterizer = useSimpleRasterize ? 'bin/simple_rasterize.js' : 'bin/rasterize.js';
   cmd._push([path.join(__dirname, rasterizer), this._input(), format || 'png', page || 1, dpi || 72, useCropBox ? 'true' : 'false']);
   var stream = cmd._exec();
   return stream;
 };

/**
 * (Internal) Returns a stream with JSON data parsed from the raw PDF data.
 * Consumes this.pdfStream()
 * @return {BufferStream}
 */
Command.prototype._commandStream = function () {
  var stream = new BufferStream({
    size: 'flexible'
  });
  // var buf = [];
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
  var end = false;
  gs.stdout
    .pipe(stream)
    .on('end', function(){
      end = true;
    })
  gs.stderr.on('data', function (data) {
    console.error('gs encountered an error:\n', String(data));
  });
  gs.on('exit', function (/*code*/) {
    if (!end) {
      end = true;
      stream.emit('end');
    }
  });
  return stream;
};

/**
 * Returns a stream with JSON content data aggregated from this._commandStream()
 * @return {Stream}
 */
Command.prototype.contentStream = function () {
  function isNextStringPartOfLastString (b, a, font) {
    // NOTE: This is a completely arbitrary heuristic.
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
  this._commandStream()
    .on('data', function (cmd) {
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
    })
    .on('end', function () {
      if (str) {
        stream.emit('data', {
          type: 'string',
          x: first ? first.x : 0,
          y: first ? first.y : 0,
          string: str, font: font, color: color
        });
        str = '';
        process.nextTick(function() {
          stream.emit('end');
        });
      }
    });
  return stream;
};

/**
 * Returns a Stream with text content data aggregated from this._commandStream()
 * @return {Stream}
 */
Command.prototype.textStream = function () {
  var stream = new Stream();
  this.contentStream().on('data', function (cmd) {
    if (cmd.type == 'string') {
      stream.emit('data', cmd.string);
    }
  });
  this.contentStream().on('end', function () {
    stream.emit('end');
  });
  return stream;
};

/**
 * Returns a stream of image data, via the `pdfimages` command (called with `-j`).
 * The output format cannot be guaranteed. As per pdfimages documentation
 * (http://linuxcommand.org/man_pages/pdfimages1.html),  images in DCT format 
 * are  saved  as  JPEG  format. All  non-DCT images are saved are written as PBM 
 * (for monochrome  images) or  PPM  (for non-monochrome  images) files. 
 * NOTE: The current implementation is pretty costly and is dependent on an additional
 * dependency (pdfimages). Preferrably, this would be done in Ghostscript.
 * @param  {Number=} [0] i The number of the image to be extracted, defaults to 0.
 * @return {Stream} Stream of image data in PPM, PBM or JPG format
 */
Command.prototype.extractImageStream = function (i) {
  i = i || 0;
  var stream = new Stream();
  if (!this._pdfimages) {
    var callback = this._pdfimages = promise();
    temp.mkdir('pdfimages', function (err, dirPath) {
      this._markCleanupFolder(dirPath);
      this.pdfStream()
        .pipe(fs.createWriteStream(path.join(dirPath, 'file.pdf')))
        .on('error', function () {
          callback.deliver([]);
        })
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

/**
 * Returns a stream of property data, in UTF-8 encoding
 * @return {Stream}
 */
Command.prototype.propertyStream = function () {
  var stream = new BufferStream({
    size: 'flexible'
  });
  stream.split('\n', function (buffer) {
    var line = String(buffer);
    var index = line.indexOf(':');
    if(index > -1) {
      stream.emit('data', {
        event: line.slice(0, index),
        value: parseInt(line.slice(index + 1))
      })
    } else {
      stream.emit('data', {event: line});
    }
  });

  var cmd = this._copy();
  var property_stream = cmd._push([
    'pdftk', cmd._input(),
    'dump_data_utf8',
    'output', '-'
  ])._exec().pipe(stream);

  property_stream.on('exit', function () {
    stream.emit('end');
  });

  return stream;
}

/**
 * Executes the commands in order and returns a stream with the data of the
 * result document
 * @return {Stream}
 */
Command.prototype._exec = function () {
  var stream = new Stream(), commands = this.commands.slice();
    
  stream.on('error', function (err) {
    console.error(err.message);
  })
    
  // Note: this.stream is either a pipe or null. If it's a pipe, it's piped into the 
  // object as stdin. (Otherwise the command would receive no stdin) And _input 
  // is used as the input argument to the command, either the filename or - to 
  // mean stdin, accordingly.
  var initialValue = this.stream;
  this.onready(function () {
    // use result of one command as input for next command
    var commandStream = commands.reduce(function (input, command) {
      var prog = spawn(command[0], command.slice(1));
      if (input) {
        input.pipe(prog.stdin);
      }
      prog.stderr.on('data', function (data) {
        process.stderr.write(command[0].match(/[^\/]*$/)[0] + ': ' + String(data));
      });
      prog.on('exit', function (code) {
        if (code) {
          var err = new Error(command[0] + ' exited with failure code: ' + code);
          err.code = code;
          stream.emit('error', err );
          console.error(err.message); // TODO Deprecated, will be removed
        }
      });
      return prog.stdout;
    }, initialValue);
    proxyStream(commandStream, stream);
  });
  return stream;
}

/*
    Instance methods returning Promises
 */

/**
 * Returns the number of pages in the document.
 * @return {Promise}
 */
Command.prototype.getNumPages = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.propertyStream()
    .on('data',function(data){
      if( data.event === 'NumberOfPages' ){
        resolve(parseInt(data.value));
      }
    })
    .on('end', function() {
      reject(new Error("PDF does not contain page number data."));
    })
    .on('error', reject);
  });
};

/**
 * Cleans all temporary folders created during usage.
 * Use this method if your process is running for a long time
 * and you want to clean up temporary folders.
 */
Command.prototype.cleanup = function() {
  if (this._cleanupFolders) {
    this._cleanupFolders.forEach(function (dir) {
      rimraf(dir)
    });
    this._cleanupFolders = [];
  }
};

/**
 * Returns an array of objects containing the dimension of the page.
 * Requires the imagemagick package, containing the `identify` command line 
 * utility
 * @return {Promise} Promise that resolves with an array of objects, each 
 * containing the properties 'width', 'height' and 'unit' unit being 'pt'.
 */
Command.prototype.getPageSizes = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    temp.open({suffix: '.pdf'}, function(err, info) {
      if (err) reject(err);
      fs.close(info.fd, function(err) {
        if (err) reject(err);
        self
        .pdfStream()
          .on('error', reject)
          .pipe(fs.createWriteStream(info.path))
          .on('finish',function(){
            var identify = spawn('identify', [info.path]);
            var result ="";
            identify.stderr.on('data', function (data) {
              if (data && data.toString().trim()) {
                throw new Error('identify encountered an error:\n', String(data));
              }
            });
            identify.stdout.on('data', function(data){
              result+=data.toString();
            });
            identify.on('exit', function (code) {
              rimraf(info.path);
              if (code) {
                throw new Error('identify exited with failure code:', code);
              }
              dimensions=[];
              var re = /\[([0-9]+)\] PDF ([0-9]+)x([0-9]+)/ig;
              result.split(/\n/).map(function(line){
                var matches = re.exec(line);
                if(matches instanceof Array){
                  dimensions.push({
                    width : matches[2],
                    height : matches[3],
                    unit : 'pt'
                  });
                }
              });
              resolve(dimensions);
            });
          })
          .on('error',function(err){
            rimraf(info.path);
            reject(err);
          });
      });
    });
  });
};

/**
 * Entry function
 * @function
 * @param  {string} path Path to the source PDF
 * @return {Command} A Command instance
 */
var scissors = function (path) {
  var cmd = new Command(path);
  return cmd;
}

/**
 * Joins the given pages into one document and returnes a
 * @return {Command} A chainable Command instance
 */
scissors.join = function () {
  var joinTemp = temp.mkdirSync('pdfimages'), joinindex = 0;
  var args = Array.prototype.slice.call(arguments);

  var outfile = joinTemp + '/' + (joinindex++) + '.pdf';
  var pdf = new Command(outfile, false);
  pdf._markCleanupFolder(joinTemp);

  async.map(args, function (arg, next) {
    var file = joinTemp + '/' + (joinindex++) + '.pdf';
    arg.pdfStream()
      .pipe(fs.createWriteStream(file))
      .on('close', function () {
        next(null, file);
      });
  }, function (err, files) {
    var command = ['pdftk'].concat(files, ['output', outfile]);
    var prog = spawn(command[0], command.slice(1));
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


/**
 * Exports the scissors function
 */
module.exports = scissors;

/*

References

* http://hzqtc.github.com/2012/04/pdf-tools-merging-extracting-and-cropping.html
* http://documentcloud.github.com/docsplit/
* http://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
* http://segfault.in/2010/07/pdf-manipulations-and-conversions-from-linux-command-prompt/
* http://www.maths.ox.ac.uk/help/faqs/files/manipulating-pdf-files
* http://stackoverflow.com/questions/11754556/ghostscript-convert-a-pdf-and-output-in-a-textfile
* http://right-sock.net/linux/better-convert-pdf-to-jpg-using-ghost-script/
* http://stackoverflow.com/questions/12484353/how-to-crop-a-section-of-a-pdf-file-to-png-using-ghostscript?lq=1

*/
