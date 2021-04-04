# scissors
[![.github/workflows/run_tests.yml](https://github.com/tcr/scissors/actions/workflows/run_tests.yml/badge.svg)](https://github.com/tcr/scissors/actions/workflows/run_tests.yml)

PDF manipulation in Node.js, based on PDFTK! Split, join, crop, read, extract, 
boil, mash, stick them in a stew.

> This project is no longer actively maintained and we cannot respond to issues. 
> Consider alternatives such as https://github.com/jjwilly16/node-pdftk 
> 
> Bug fixes are always welcome.

## Example

```javascript
var scissors = require('scissors');

// Use and chain any of these commands...
var pdf = scissors('in.pdf')
   .pages(4, 5, 6, 1, 12) // select or reorder individual pages
   .range(1, 10) // pages 1-10
   .even() // select even pages, 
   .odd() // or odd, 
   .rotate(90) // 90, 180, 270, 360 degrees
   .reverse() // reverse the page order
   .crop(100, 100, 300, 200) // offset in points from left, bottom, right, top (doesn't work reliably yet)
   .pdfStream()... // output stream, see below
   
// Join multiple files...
var pdfA = scissors('1.pdf'), pdfB = scissors('2.pdf'), pdfC = scissors('3.pdf')
scissors.join(pdfA.pages(1), pdfB, pdfC.pages(5, 10)).pdfStream()...

// And output data as streams
pdf.pdfStream()
   .pipe(fs.createWriteStream('out.pdf'))
   .on('finish', function(){
     console.log("We're done!");
   }).on('error',function(err){
     throw err;
   });

// or use promises:
require('stream-to-promise')(
  scissors(pdf)
  .pages(1,3)
  .pdfStream().pipe(fs.createWriteStream(...)
)
.then(function(){
   console.log("We're done!");
})
.catch(function(e){
   console.error("Something went wrong:" + e);
});

pdf.pngStream(300).pipe(fs.createWriteStream('out-page1.png')); // PNG of first page at 300 dpi
pdf.textStream().pipe(process.stdout) // Stream of individual text strings
pdf.propertyStream().pipe(process.stdout) // Stream of PDF meta data

// Extract content as text or images:
pdf.contentStream().on('data', console.log)
// { type: 'string', x: 1750, y: 594,
//   string: 'Reinhold Messner',
//   font: { height: 112, width: 116, font: 'ZSVUGH+Imago-Book' },
//   color: { r: 137, g: 123, b: 126 } }
// { type: 'image', x: 3049, y: 5680, width: 655, height: 810, index: 4 }

// Use the 'index' property of an image element to extract an image:
// Calls `pdfimages -j`, so the result format is dependent on the 
// format of the embedded image (see http://linuxcommand.org/man_pages/pdfimages1.html)
pdf.extractImageStream(0).pipe(s.createWriteStream('firstImage.jpg'));

// Promise-based output:
pdf.getPageSizes().then(console.dir); // requires imagemagick
// [
//  {
//    "width": "595",
//    "height": "842",
//    "unit": "pt"
//  },
//  ...
pdf.getNumPages().then(console.log); // prints the number of pages of the PDF

```

## Requirements

Scissors is a wrapper around command line utilities (mainly PDFTK) that have to 
be separately installed.

* Install [PDFTK](http://www.pdflabs.com/docs/install-pdftk/). For MacOS, see below.
* Ensure you have Ghostscript installed (check by running `gs --version`).
* To use the `getPageSizes` method, you need the imagemagick library, which provides the `identify` executable.
* *(optional)* To extract individual images from a page with the 
  `extractImageStream()` method, install `pdfimages` with `brew install xpdf` or 
   `apt-get install poppler-utils`.

## MacOS

PDFTK does not run out-of-the box on Mac OS >=10.11. A patched build is
available
[here](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/pdftk_server-2.02-mac_osx-10.11-setup.pkg)
as per [this
thread](http://stackoverflow.com/questions/32505951/pdftk-server-on-os-x-10-11).
Alternatively, use a dockerized executable such as
https://hub.docker.com/r/jottr/alpine-pdftk. Remember that, in this case,  you
need to pass read streams to the executable instead of file paths unless you
mount the directories containing these paths to make them accessible for the
docker image.

## Testing

The tests sometimes and unpredictably fail for unknown reasons, try to run them again to see whether the
problem goes away.

## Dev resources
- https://www.pdflabs.com/docs/pdftk-man-page/

## Known issues
- `.crop()` doesn't work reliably, if at all.
