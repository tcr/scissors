/* global describe, it */
var scissors = require('../scissors');
var fs = require('fs');
var Testfile = require('./testfile');
var Promise = require('any-promise');
var promisify = require('stream-to-promise');
var pdf = () => fs.createReadStream(__dirname + '/test_data/test.pdf');

describe('Test Scissors image extraction methods', function() {

  this.timeout(50000);

  //return; // skip time-consuming image tests
  describe('#jpgStream() - slow rasterize', function() {
    it('should extract a single jpg page (using default rasterize)', function(done) {
      var testfile = new Testfile('page1_default','jpg');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = false;
      scissors(pdf())
        .jpgStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(testfile.getPath()))
        .on('error', err => {throw err;})
        .on('finish', function(){
          testfile.assertExists();
          testfile.remove();
          done();
        });
    });
  });

  describe('#pngStream() - slow rasterize', function() {
    it('should extract a single png page (using default rasterize)', function(done) {
      var testfile = new Testfile('page1_default','png');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = false;
      scissors(pdf())
        .pngStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(testfile.getPath()))
        .on('error', err => {throw err;})
        .on('finish', function(){
          testfile.assertExists();
          testfile.remove();
          done();
        });
    });
  });

  describe('#jpgStream()', function() {
    it('should extract a single jpg page (using simple rasterize)', function(done) {
      var testfile = new Testfile('page1_simple','jpg');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      scissors(pdf())
        .jpgStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(testfile.getPath()))
        .on('error', err => {throw err;})
        .on('finish', function(){
          testfile.assertExists();
          testfile.remove();
          done();
        });
    });
  });

  describe('#pngStream()', function() {
    it('should extract a single png page (using simple rasterize)', function(done) {
      var testfile = new Testfile('page1_simple','png');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      scissors(pdf())
        .pngStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(testfile.getPath()))
        .on('error', err => {throw err;})
        .on('finish', function(){
          testfile.assertExists();
          testfile.remove();
          done();
        });
    });
  });

  describe('#jpgStream()', function() {
    it('should extract a single jpg page using crop box (using simple rasterize)', function(done) {
      var testfile = new Testfile('page1_simple_crop_box','jpg');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      var useCropBox = true;
      scissors(pdf())
        .jpgStream(dpi, pageNum, useSimpleRasterize, useCropBox).pipe(fs.createWriteStream(testfile.getPath()))
        .on('error', err => {throw err;})
        .on('finish', function(){
          testfile.assertExists();
          testfile.remove();
          done();
        });
    });
  });

  describe('#pngStream()', function() {
    it('should extract a single png page using crop box (using simple rasterize)', function(done) {
      var testfile = new Testfile('page1_simple_crop_box','png');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      var useCropBox = true;
      scissors(pdf())
        .pngStream(dpi, pageNum, useSimpleRasterize, useCropBox)
        .on('error', err => {throw err;})
        .pipe(fs.createWriteStream(testfile.getPath()))
        .on('error', err => {throw err;})
        .on('finish', function(){
          testfile.assertExists();
          testfile.remove();
          done();
        });
    });
  });

  describe('#extractImageStream()', function() {
    it('should extract a single image from the pdf (only checks file creation)', function(done) {
      var testfile = new Testfile('image0','jpg');
      scissors(pdf())
        .extractImageStream(0)
        .on('error', err => {throw err;})
        .pipe(fs.createWriteStream(testfile.getPath()))
        .on('error', err => {throw err;})
        .on('finish', function(){
          testfile.assertExists();
          testfile.remove();
          done();
        });
    });
  });
  
  describe('Save several pages as images', function() {
    it('should save a range of pages as png images', function() {
      var files = [];
      return Promise.all(
        [1,2,3].map(function(page){
          var file = new Testfile('page_'+page,'png');
          files.push(file);
          return promisify(
            scissors(pdf())
              .pngStream(300,page,true)
              .on('error', err => {throw err;})
              .pipe(fs.createWriteStream(file.getPath()))
          );
        })
      )
      .then(function(){
        files.forEach(function(file){ 
          file.assertExists();
          file.remove();
        });
      })
      .catch(function (err) {
        throw err;
      });
    });
  });
});
