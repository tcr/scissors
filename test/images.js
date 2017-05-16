/* global describe, it */
var assert = require('assert');
var scissors = require('../scissors');
var fs = require('fs');
var Outfile = require('./outfile');

var pdf = __dirname + '/test_data/test.pdf';

describe('Scissors', function() {
  this.timeout(20000);
  describe('#jpgStream()', function() {
    it('should extract a single jpg page (using default rasterize)', function(done) {
      var outfile = new Outfile('page1_default','jpg');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = false;
      scissors(pdf)
      .jpgStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(outfile.getPath()))
      .on('finish', function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        //outfile.remove();
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  describe('#pngStream()', function() {
    it('should extract a single png page (using default rasterize)', function(done) {
      var outfile = new Outfile('page1_default','png');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = false;
      scissors(pdf)
      .pngStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(outfile.getPath()))
      .on('finish', function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        //outfile.remove();
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  describe('#jpgStream()', function() {
    it('should extract a single jpg page (using simple rasterize)', function(done) {
      var outfile = new Outfile('page1_simple','jpg');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      scissors(pdf)
      .jpgStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(outfile.getPath()))
      .on('finish', function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        //outfile.remove();
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  describe('#pngStream()', function() {
    it('should extract a single png page (using simple rasterize)', function(done) {
      var outfile = new Outfile('page1_simple','png');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      scissors(pdf)
      .pngStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(outfile.getPath()))
      .on('finish', function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        //outfile.remove();
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  describe('#jpgStream()', function() {
    it('should extract a single jpg page using crop box (using simple rasterize)', function(done) {
      var outfile = new Outfile('page1_simple_crop_box','jpg');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      var useCropBox = true;
      scissors(pdf)
      .jpgStream(dpi, pageNum, useSimpleRasterize, useCropBox).pipe(fs.createWriteStream(outfile.getPath()))
      .on('finish', function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        //outfile.remove();
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  describe('#pngStream()', function() {
    it('should extract a single png page using crop box (using simple rasterize)', function(done) {
      var outfile = new Outfile('page1_simple_crop_box','png');
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      var useCropBox = true;
      scissors(pdf)
      .pngStream(dpi, pageNum, useSimpleRasterize, useCropBox).pipe(fs.createWriteStream(outfile.getPath()))
      .on('finish', function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        //outfile.remove();
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });
});
