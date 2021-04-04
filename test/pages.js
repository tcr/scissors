/* global describe, it */
var scissors = require('../scissors');
var promisify = require('stream-to-promise');
var fs = require('fs');
var Testfile = require('./testfile');
var assert = require('assert-diff');
var pdf = () => fs.createReadStream(__dirname + '/test_data/test.pdf');

// TODO: better result checks

describe('Test Scissors page manipulation methods', function() {
  
  this.timeout(20000);
  
  // getNumPages()
  describe('#getNumPages()', function() {
    it('should retrieve the number of pages of the PDF document', function() {
      return scissors(pdf())
      .getNumPages()
      .then(function(length){
        assert.equal(length,10,'Incorrect page number');
      })
      .catch(function (err) {
        throw err;
      });
    });
  });
  
  // range() using stream events for async continuation
  describe('#range()', function() {
    it('should extract a range of pdf pages', function(done) {
      var testfile = new Testfile('range');
      scissors(pdf())
        .range(1,3)
        .pdfStream()
        .on('error', err => {throw err;})
        .pipe(fs.createWriteStream(testfile.getPath()))
        .on('error', err => {throw err;})
        .on('finish', function(){
          testfile.assertExists();
          testfile.assertHasLength(3)
          .then(function(){
            testfile.remove();
            done();
          });
        });
    });
  });

  // pages() with Promise
  describe('#pages()', function() {
    it('should extract pdf pages', function() {
      var testfile = new Testfile('pages');
      return promisify(
        scissors(pdf())
        .pages(1,3)
        .pdfStream().pipe(fs.createWriteStream(testfile.getPath()))
      )
      .then(function(){
        testfile.assertExists();
        return testfile.assertHasLength(2);
      })
      .then(function(){
        testfile.remove();  
      })
      .catch(function(err){
        throw err;
      });
    });
  });

  // odd() with Promise
  describe('#odd()', function() {
    it('should extract all odd pages', function() {
      var testfile = new Testfile('odd');
      return promisify(
        scissors(pdf())
          .odd()
          .pdfStream()
          .on('error', err => {throw err;})
          .pipe(fs.createWriteStream(testfile.getPath()))
      )
      .then(function(){
        testfile.assertExists();
        return testfile.assertHasLength(5);
      })
      .then(function(){
        testfile.remove();  
      })
      .catch(function(err){
        throw err;
      });
    });
  });

  // odd() with Promise
  describe('#even()', function() {
    it('should extract all odd pages', function() {
      var testfile = new Testfile('even');
      return promisify(
        scissors(pdf())
          .even()
          .pdfStream()
          .on('error', err => {throw err;})
          .pipe(fs.createWriteStream(testfile.getPath()))
      )
      .then(function(){
        testfile.assertExists();
        testfile.remove();
      }).catch(function(err){
        throw err;
      });
    });
  });

  // reverse() with Promise
  describe('#reverse()', function() {
    it('should reverse the page order', function() {
      var testfile = new Testfile('reverse');
      return promisify(
        scissors(pdf())
          .reverse()
          .pdfStream()
          .on('error', err => {throw err;})
          .pipe(fs.createWriteStream(testfile.getPath()))
      )
      .then(function(){
        testfile.assertExists();
        testfile.remove();
      })
    });
  });

  // chained commands
  describe('(chained commands)', function() {
    it('should execute a couple of chained commands', function() {
      var testfile = new Testfile('odd');
      return promisify(
        scissors(pdf())
          .reverse()
          .odd()
          .range(2,3)
          .pages(1)
          .pdfStream()
          .on('error', err => {throw err;})
          .pipe(fs.createWriteStream(testfile.getPath()))
      )
      .then(function(){
        testfile.assertExists();
        testfile.remove();
      }).catch(function(err){
        throw err;
      });
    });
  });

  // rotate
  describe('#rotate()', function() {
    it('should rotate the selected pages', function() {
      var testfile = new Testfile('rotate');
      return promisify(
        scissors(pdf())
          .range(1,3)
          .rotate(90)
          .pdfStream()
          .on('error', err => {throw err;})
          .pipe(fs.createWriteStream(testfile.getPath()))
      )
      .then(function(){
        testfile.assertExists();
        testfile.remove();
      })
    });
  });

  // compress
  describe('#compress()', function() {
    it('should compress the selected pages', function() {
      var testfile = new Testfile('compress');
      return promisify(
        scissors(pdf())
          .compress()
          .pdfStream()
          .on('error', err => {throw err;})
          .pipe(fs.createWriteStream(testfile.getPath()))
      )
      .then(function(){
        testfile.assertExists();
        testfile.remove();
      }).catch(function(err){
        throw err;
      });
    });
  });

  // decompress
  // describe('#uncompress()', function() {
  //   it('should uncompress the selected pages', function() {
  //     var infile  = new Testfile('compress');
  //     var outfile = new Testfile('uncompress');
  //     return promisify(scissors(infile.getPath())
  //     .uncompress()
  //     .pdfStream().pipe(fs.createWriteStream(outfile.getPath())))
  //     .then(function(){
  //       outfile.assertExists();
  //       //outfile.remove();
  //     }).catch(function(err){
  //       throw err;
  //     });
  //   });
  // });

  // crop
  describe('#crop()', function() {
    it('should crop the selected pages (checks only execution, not result)', function() {
      var testfile = new Testfile('crop');
      return promisify(
        scissors(pdf())
        .pages(1,2)
        .crop(0,0,100,100)
        .pdfStream()
        .pipe(fs.createWriteStream(testfile.getPath()))
      )
      .then(function(){
        testfile.assertExists();
        testfile.remove();
      }).catch(function(err){
        throw err;
      });
    });
  });
  
    // getPageSizes()
//   describe('#getPageSizes()', function() {
//     it('should retrieve information on the size of the PDF pages', function() {
//       var testfile = new Testfile('pagesizes','json');
//       return scissors(pdf())
//       .range(1,3)
//       .getPageSizes()
//       .then(function(result){
//         testfile
//         .writeJSON(result)
// //        .compareWithReferenceFile() // result is platform-dependent
//         .remove();
//       })
//       .catch(function (err) {
//         throw err;
//       });
//     });
//   });


});
