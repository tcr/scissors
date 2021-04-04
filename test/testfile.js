/** @module test.testfile */

var fs = require('fs');
var assert = require('assert-diff');
var scissors = require('../scissors');

/**
 * Represents a test result file
 * @class
 * @param  {String} name Name of the test (will be used as filename)
 * @param  {String} ext  (optional) file extension (without dot). Defaults to 'pdf'
 * @return {Testfile} An instance of this class
 */
var Testfile = function(name,ext){
  this.name = name;
  this.ext = ext||'tmp'; 
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
 * @return {Testfile} The testfile instance
 */
Testfile.prototype.assertExists = function(){
  assert.equal(true,fs.existsSync(this.getPath()), 'File does not exist');
  assert.equal(true,fs.statSync(this.getPath()).size > 0, 'File size is 0');
  return this;
};

/**
 * write data to file as JSON
 * @return {Testfile} The testfile instance
 */
Testfile.prototype.writeJSON = function(data){
  fs.writeFileSync(this.getPath(),JSON.stringify(data,null,2),'utf-8');
  return this;
};

/**
 * Throws an error if file does not have the specified number of pages
 * @return {Promise}
 */
Testfile.prototype.assertHasLength = function(length){
  return scissors(fs.createReadStream(this.getPath()))
    .getNumPages()
    .then(function(computedLength){
      assert.equal(computedLength,length,'Page number does not match.');
    })
    .catch(function(err){
      throw err;
    });
};

/**
 * Compares with a reference result and throws an error if file is not the same
 * @return {Testfile} The testfile instance
 */
Testfile.prototype.compareWithReferenceFile = function(){
  var content = fs.readFileSync(this.getPath(),'utf-8');
  var referenceFile    = __dirname + '/test_data/' + this.name + '.' + this.ext;
  var referenceContent =  fs.readFileSync(referenceFile);
  if( this.ext == 'json'){
    content = JSON.parse(content);
    referenceContent = JSON.parse(referenceContent,'utf-8');
    assert.deepEqual(content, referenceContent, 'Output does not match reference content');
  } else {
    for( var i=0; i++; i<Math.min(content.length, referenceContent.length) ){
      if( content[i] !== referenceContent[i]){
        break;
      }
    }
    assert.equal(content, referenceContent, 'Output does not match reference content near "' + content.substr(i,20)+'"' );  
  }
  return this;
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
