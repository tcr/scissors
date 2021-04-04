/* global describe, it */
var scissors = require('../scissors');
var promisify = require('stream-to-promise');
var fs = require('fs');
var util = require('util');
var Testfile = require('./testfile');

var pdf = () => fs.createReadStream(__dirname + '/test_data/test.pdf');

// TODO: better result checks

describe('Test Scissor streams', function() {
  this.timeout(20000);


  // _commandStream()
  describe('#_commandStream()', function() {
    var counter = 0;
    it('should produce a stream with JSON data parsed from the raw PDF data', function(done) {
      var testfile = new Testfile('commandstream','json');
      var result = [];
      scissors(pdf())
        .pages(1,3)
        ._commandStream()
        .on('data',function(data){
          result.push(data);
        })
        .on('end', function(){
          if( counter++ == 0 ){
            fs.writeFileSync(testfile.getPath(), JSON.stringify(result,null,2));
            testfile.compareWithReferenceFile();
            testfile.remove();
            done();
          } else {
            // this addresses a weird, hard to reproduce error
            throw new Error('"end" event has been emitted twice!');
          }
        })
        .on('error', function(err){
          throw err;
        });
    });
  }); 


  // contentStream()
  describe('#contentStream()', function() {
    it('should output metadata about the PDF', function(done) {
      var testfile = new Testfile('contentstream','json');
      var result = [];
      scissors(pdf())
        .pages(1,3)
        .contentStream()
        .on('data',function(data){
          result.push(data);
        })
        .on('end', function(){
          fs.writeFileSync(testfile.getPath(), JSON.stringify(result,null,2));
          testfile.compareWithReferenceFile();
          testfile.remove();
          done();
        })
        .on('error', function(err){
          throw err;
        });
    });
  });
  
  // propertyStream()
  describe('#propertyStream()', function() {
    it('should stream json data with metadata about the PDF', function(done) {
      var testfile = new Testfile('propertystream','json');
      var result = [];
      scissors(pdf())
        .propertyStream()
        .on('data',function(data){
          if( data.value ){
            result.push(data);
          }
        })
        .on('end', function(){
          fs.writeFileSync(testfile.getPath(), JSON.stringify(result,null,2));
          testfile.compareWithReferenceFile();
          testfile.remove();
          done();
        })
        .on('error', function(err){
          throw err;
        });
    });
  });
  
  // textStream()
  describe('#textStream()', function() {
    it('should output text that is contained in the PDF', function() {
      var testfile = new Testfile('textstream','txt');
      return promisify(
        scissors(pdf()).pages(1,3)
          .textStream()
          .on('error', e => {throw e;})
          .pipe(fs.createWriteStream(testfile.getPath()))
      )
      .then(function(){
        testfile.assertExists();
        // disabled because result is different on different platforms
        //testfile.compareWithReferenceFile();
        testfile.remove();
      })
      .catch(function(err){
        throw err;
      });
    });
  });
});
