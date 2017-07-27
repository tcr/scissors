# scissors

PDF manipulation in Node.js, based on PDFTK! Split, join, crop, read, extract, 
boil, mash, stick them in a stew.

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
scissors.join(pdfA.page(1), pdfB, pdfC.pages(5, 10)).pdfStream()...

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
pdf.getPageSizes().then(console.dir);
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

* Install [PDFTK](http://www.pdflabs.com/docs/install-pdftk/) 
  on your system. Mac OS >=10.11 requires a patched build available 
  [here](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/pdftk_server-2.02-mac_osx-10.11-setup.pkg) 
  as per [this thread](http://stackoverflow.com/questions/32505951/pdftk-server-on-os-x-10-11)
* Ensure you have Ghostscript installed (check by running `gs --version`).
* *(optional)* To extract individual images from a page with the 
  `extractImageStream()` method, install `pdfimages` with `brew install xpdf` or 
   `apt-get install poppler-utils`.

## Dev resources
- https://www.pdflabs.com/docs/pdftk-man-page/

## Known issues
- `.crop()` doesn't work reliably, if at all.