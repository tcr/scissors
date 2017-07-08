/* global describe, it */
var scissors = require('../scissors');
var fs = require('fs');
var Testfile = require('./testfile');

var pdf = __dirname + '/test_data/test.pdf';

describe('Scissors', function() {

  this.timeout(50000);

  //return; // skip time-consuming image tests
  describe('#jpgStream() - slow rasterize', function() {
    it('should extract a single jpg page (using default rasterize)', function(done) {
      var testfile = new Testfile('page1_default','jpg');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = false;
      scissors(pdf)
      .jpgStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(testfile.getPath()))
      .on('finish', function(){
        testfile.assertExists();
        testfile.remove();
        done();
      }).on('error',function(err){
        throw err;
      });
    });
  });

  describe('#pngStream() - slow rasterize', function() {
    it('should extract a single png page (using default rasterize)', function(done) {
      var testfile = new Testfile('page1_default','png');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = false;
      scissors(pdf)
      .pngStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(testfile.getPath()))
      .on('finish', function(){
        testfile.assertExists();
        testfile.remove();
        done();
      }).on('error',function(err){
        throw err;
      });
    });
  });

  describe('#jpgStream()', function() {
    it('should extract a single jpg page (using simple rasterize)', function(done) {
      var testfile = new Testfile('page1_simple','jpg');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      scissors(pdf)
      .jpgStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(testfile.getPath()))
      .on('finish', function(){
        testfile.assertExists();
        testfile.remove();
        done();
      }).on('error',function(err){
        throw err;
      });
    });
  });

  describe('#pngStream()', function() {
    it('should extract a single png page (using simple rasterize)', function(done) {
      var testfile = new Testfile('page1_simple','png');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      scissors(pdf)
      .pngStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(testfile.getPath()))
      .on('finish', function(){
        testfile.assertExists();
        testfile.remove();
        done();
      }).on('error',function(err){
        throw err;
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
      scissors(pdf)
      .jpgStream(dpi, pageNum, useSimpleRasterize, useCropBox).pipe(fs.createWriteStream(testfile.getPath()))
      .on('finish', function(){
        testfile.assertExists();
        testfile.remove();
        done();
      }).on('error',function(err){
        throw err;
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
      scissors(pdf)
      .pngStream(dpi, pageNum, useSimpleRasterize, useCropBox)
      .pipe(fs.createWriteStream(testfile.getPath()))
      .on('finish', function(){
        testfile.assertExists();
        testfile.remove();
        done();
      }).on('error',function(err){
        throw err;
      });
    });
  });

  describe('#extractImageStream()', function() {
    it('should extract a single image from the pdf (only checks file creation)', function(done) {
      var testfile = new Testfile('image0','jpg');
      scissors(pdf)
      .extractImageStream(0)
      .pipe(fs.createWriteStream(testfile.getPath()))
      .on('finish', function(){
        testfile.assertExists();
        testfile.remove();
        done();
      }).on('error',function(err){
        throw err;
      });
    });
  });
});
