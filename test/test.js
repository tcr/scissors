/* global describe, it */
var assert = require('assert');
var scissors = require('../scissors');
var fs = require('fs');
var dir = __dirname;
var pdf = dir + '/test.pdf';
var promisify = require('stream-to-promise');

describe('Scissors', function() {
  // range()
  describe('#range()', function() {
    it('should extract a range of pdf pages (using a stream)', function(done) {
      var outfile = dir+'/_pages1-3.pdf';
      try{ fs.unlinkSync(outfile); } catch(e){/**/}
      scissors(pdf).pages(1,3)
      .pdfStream().pipe(fs.createWriteStream(outfile))
      .on('close', function(){
        assert.equal(true,fs.existsSync(outfile));
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  // range() with Promise
  describe('#range()', function() {
    it('should extract a range of pdf pages (using a promise)', function() {
      var outfile = dir+'/_pages1-3.pdf';
      try{ fs.unlinkSync(outfile); } catch(e){/**/}
      return promisify(scissors(pdf).pages(1,3)
      .pdfStream().pipe(fs.createWriteStream(outfile)))
      .then(function(){
        assert.equal(true,fs.existsSync(outfile));
      })
      .catch('error',function(err){
        console.error(err.message);
      });
    });
  });

  describe('#jpgStream()', function() {
    it('should extract a single jpg page (using default rasterize)', function(done) {
      var outfile = dir+'/_page1_default.jpg';
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = false;
      try{ fs.unlinkSync(outfile); } catch(e){/**/}
      scissors(pdf)
      .jpgStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(outfile))
      .on('close', function(){
        assert.equal(true,fs.existsSync(outfile));
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  describe('#pngStream()', function() {
    it('should extract a single png page (using default rasterize)', function(done) {
      var outfile = dir+'/_page1_default.png';
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = false;
      try{ fs.unlinkSync(outfile); } catch(e){/**/}
      scissors(pdf)
      .pngStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(outfile))
      .on('close', function(){
        assert.equal(true,fs.existsSync(outfile));
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  describe('#jpgStream()', function() {
    it('should extract a single jpg page (using simple rasterize)', function(done) {
      var outfile = dir+'/_page1_simple.jpg';
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      try{ fs.unlinkSync(outfile); } catch(e){/**/}
      scissors(pdf)
      .jpgStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(outfile))
      .on('close', function(){
        assert.equal(true,fs.existsSync(outfile));
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  describe('#pngStream()', function() {
    it('should extract a single png page (using simple rasterize)', function(done) {
      var outfile = dir+'/_page1_simple.png';
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      try{ fs.unlinkSync(outfile); } catch(e){/**/}
      scissors(pdf)
      .pngStream(dpi, pageNum, useSimpleRasterize).pipe(fs.createWriteStream(outfile))
      .on('close', function(){
        assert.equal(true,fs.existsSync(outfile));
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  describe('#jpgStream()', function() {
    it('should extract a single jpg page using crop box (using simple rasterize)', function(done) {
      var outfile = dir+'/_page1_simple_crop_box.jpg';
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      var useCropBox = true;
      try{ fs.unlinkSync(outfile); } catch(e){/**/}
      scissors(pdf)
      .jpgStream(dpi, pageNum, useSimpleRasterize, useCropBox).pipe(fs.createWriteStream(outfile))
      .on('close', function(){
        assert.equal(true,fs.existsSync(outfile));
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  describe('#pngStream()', function() {
    it('should extract a single png page using crop box (using simple rasterize)', function(done) {
      var outfile = dir+'/_page1_simple_crop_box.png';
      var dpi = 300;
      var pageNum = 1;
      var useSimpleRasterize = true;
      var useCropBox = true;
      try{ fs.unlinkSync(outfile); } catch(e){/**/}
      scissors(pdf)
      .pngStream(dpi, pageNum, useSimpleRasterize, useCropBox).pipe(fs.createWriteStream(outfile))
      .on('close', function(){
        assert.equal(true,fs.existsSync(outfile));
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });
});
