/* global describe, it */
var scissors = require('../scissors');
var promisify = require('stream-to-promise');
var fs = require('fs');
var util = require('util');
var Testfile = require('./testfile');

var pdf = __dirname + '/test_data/test.pdf';

// TODO: better result checks

describe('Scissors', function() {
  this.timeout(20000);


  // textStream()
  describe('#textStream()', function() {
    it('should output text that is contained in the PDF', function() {
      var testfile = new Testfile('textstream','txt');
      return promisify(scissors(pdf).pages(1,3)
      .textStream().pipe(fs.createWriteStream(testfile.getPath())))
      .then(function(){
        testfile.assertExists();
        //testfile.remove();
      }).catch(function(err){
        throw err;
      });
    });
  });

  // textStream()
  describe('#textStream()', function() {
    it('should output text that is contained in the PDF', function() {
      var testfile = new Testfile('textstream','txt');
      return promisify(scissors(pdf).pages(1,3)
      .textStream().pipe(fs.createWriteStream(testfile.getPath())))
      .then(function(){
        testfile.assertExists();
        //testfile.remove();
      }).catch(function(err){
        throw err;
      });
    });
  });

  // propertyStream()
  describe('#propertyStream()', function() {
    it('should output metadata about the PDF', function() {
      var testfile = new Testfile('properties','txt');
      var result = {};
      return promisify(scissors(pdf)
      .textStream()
      .on('data',function(data){
        if( data.value){
          result[data.event] = data.value;
        }
      }))
      .then(function(){
        fs.writeFileSync(testfile.getPath(), JSON.stringify(result,null,2));
      }).catch(function(err){
        throw err;
      });
    });
  });
});
