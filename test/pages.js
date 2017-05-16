/* global describe, it */
var assert = require('assert');
var scissors = require('../scissors');
var promisify = require('stream-to-promise');
var fs = require('fs');
var Outfile = require('./outfile');

var pdf = __dirname + '/test_data/test.pdf';

// TODO: better result checks

describe('Scissors', function() {
  this.timeout(20000);
  // range() using stream events for async continuation
  describe('#range()', function() {
    it('should extract a range of pdf pages', function(done) {
      var outfile = new Outfile('range');
      scissors(pdf)
      .pages(1,3)
      .pdfStream()
      .pipe(fs.createWriteStream(outfile.getPath()))
      .on('finish', function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        outfile.remove();
        done();
      })
      .on('error',function(err){
        console.error(err.message);
      });
    });
  });

  // pages() with Promise
  describe('#page()', function() {
    it('should extract pdf pages', function() {
      var outfile = new Outfile('pages');
      return promisify(scissors(pdf).pages(1,3)
      .pdfStream().pipe(fs.createWriteStream(outfile.getPath())))
      .then(function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        //outfile.remove();
      })
      .catch('error',function(err){
        console.error(err.message);
      });
    });
  });

  // odd() with Promise
  describe('#odd()', function() {
    it('should extract all odd pages', function() {
      var outfile = new Outfile('odd');
      return promisify(scissors(pdf).odd()
      .pdfStream().pipe(fs.createWriteStream(outfile.getPath())))
      .then(function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        //outfile.remove();
      })
      .catch('error',function(err){
        console.error(err.message);
      });
    });
  });

  // odd() with Promise
  describe('#even()', function() {
    it('should extract all odd pages', function() {
      var outfile = new Outfile('even');
      return promisify(scissors(pdf).even()
      .pdfStream().pipe(fs.createWriteStream(outfile.getPath())))
      .then(function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        //outfile.remove();
      })
      .catch('error',function(err){
        console.error(err.message);
      });
    });
  });

  // reverse() with Promise
  describe('#reverse()', function() {
    it('should reverse the page order', function() {
      var outfile = new Outfile('reverse');
      return promisify(scissors(pdf).reverse()
      .pdfStream().pipe(fs.createWriteStream(outfile.getPath())))
      .then(function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        //outfile.remove();
      })
      .catch('error',function(err){
        console.error(err.message);
      });
    });
  });

  // chained commands
  describe('(chained commands)', function() {
    it('should execute a couple of chained commands', function() {
      var outfile = new Outfile('odd');
      return promisify(scissors(pdf)
      .reverse()
      .odd()
      .range(2,3)
      .pages(1)
      .pdfStream().pipe(fs.createWriteStream(outfile.getPath())))
      .then(function(){
        assert.equal(true,fs.existsSync(outfile.getPath()), 'File does not exist');
        assert.equal(true,fs.statSync(outfile.getPath()).size > 0, 'File size is 0');
        //outfile.remove();
      })
      .catch('error',function(err){
        console.error(err.message);
      });
    });
  });
});
