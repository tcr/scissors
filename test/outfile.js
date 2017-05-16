/** @module test.outfile */

var fs = require('fs');

/**
 * Represents a test result file
 * @class
 * @param  {String} name Name of the test (will be used as filename)
 * @param  {String} ext  (optional) file extension (without dot). Defaults to "pdf"
 * @return {Outfile} An instance of this class
 */
var Outfile = function(name,ext){
  this.path = __dirname + '/test_results/' + name + '.' + (ext||'pdf');
  this.remove();
};

/**
 * Returns the path to the file
 * @return {string}
 */
Outfile.prototype.getPath = function(){
  return this.path;
};

/**
 * Deletes the file
 * @return {void}
 */
Outfile.prototype.remove = function(){
  try {
      fs.unlinkSync(this.path);
  } catch (e) {
    // ignore error if file does not exist
  }
};

module.exports = Outfile;
