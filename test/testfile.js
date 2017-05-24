/** @module test.testfile */

var fs = require('fs');
var assert = require('assert');
var scissors = require('../scissors');

/**
 * Represents a test result file
 * @class
 * @param  {String} name Name of the test (will be used as filename)
 * @param  {String} ext  (optional) file extension (without dot). Defaults to "pdf"
 * @return {Testfile} An instance of this class
 */
var Testfile = function(name,ext){
  this.path = __dirname + '/test_results/' + name + '.' + (ext||'pdf');
  this.remove();
};

/**
 * Returns the path to the file
 * @return {string}
 */
Testfile.prototype.getPath = function(){
  return this.path;
};

/**
 * Throws an assertion error if file does not exist or is of size 0
 * @return {void}
 */
Testfile.prototype.assertExists = function(){
  assert.equal(true,fs.existsSync(this.getPath()), 'File does not exist');
  assert.equal(true,fs.statSync(this.getPath()).size > 0, 'File size is 0');
};

/**
 * Throws an assertion error if file does not have the specified number of pages
 * @return {Promise}
 */
Testfile.prototype.assertHasLength = function(length){
  scissors(this.getPath())
  .getNumPages()
  .then(function(computedLength){
    assert.equal(computedLength,length,'Page number does not match. Expected:' + length + ', got' + computedLength);
  })
  .catch(function(err){
    throw err;
  });
};

/**
 * Deletes the file
 * @return {void}
 */
Testfile.prototype.remove = function(){
  try {
    fs.unlinkSync(this.path); 
  } catch (e) {
    // ignore error if file does not exist
  }
};

module.exports = Testfile;
