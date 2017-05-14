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
});
