# spindrift

PDF manipulation in Node.js! Split, join, crop, read, extract, boil, mash, stick them in a stew. 

## Example

```javascript
var spindrift = require('spindrift');

// Use and chain any of these commands...
var pdf = spindrift('in.pdf')
   .pages(7, 24)
   .page(1)
   .even()
   .odd()
   .rotate(90)
   .compress()
   .uncompress()
   .crop(100, 100, 300, 200) // left, bottom, right, top

// Join multiple files...
var pdfA = spindrift('1.pdf'), pdfB = spindrift('2.pdf'), pdfC = spindrift('3.pdf')
spindrift.join(pdfA.page(1), pdfB, pdfC.pages(5, 10)).deflate().pdfStream()...

// And output data as streams.
pdf.pdfStream().pipe(fs.createWriteStream('out.pdf')); // PDF of compiled output
pdf.pngStream(300).pipe(fs.createWriteStream('out-page1.png')); // PNG of first page at 300 dpi
pdf.textStream().pipe(process.stdout) // Individual text strings

// Extract content as text or images:
pdf.contentStream().on('data', console.log) 
// { type: 'string', x: 1750, y: 594,
//   string: 'Reinhold Messner',
//   font: { height: 112, width: 116, font: 'ZSVUGH+Imago-Book' },
//   color: { r: 137, g: 123, b: 126 } }
// { type: 'image', x: 3049, y: 5680, width: 655, height: 810, index: 4 }

// Use the 'index' property of an image element to extract an image:
pdf.extractImageStream(0)
```

## Requirements

* Install [PDFTK (http://www.pdflabs.com/docs/install-pdftk/)](http://www.pdflabs.com/docs/install-pdftk/) on your system.
* Ensure you have Ghostscript installed (check by running `gs --version`).
* *(optional)* To extract individual images from a page, install `pdfimages` with `brew install xpdf` or `apt-get install poppler-utils`.

## References

* http://hzqtc.github.com/2012/04/pdf-tools-merging-extracting-and-cropping.html
* http://documentcloud.github.com/docsplit/
* http://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
* http://segfault.in/2010/07/pdf-manipulations-and-conversions-from-linux-command-prompt/
* http://www.maths.ox.ac.uk/help/faqs/files/manipulating-pdf-files
* http://stackoverflow.com/questions/11754556/ghostscript-convert-a-pdf-and-output-in-a-textfile
* http://right-sock.net/linux/better-convert-pdf-to-jpg-using-ghost-script/
* http://stackoverflow.com/questions/12484353/how-to-crop-a-section-of-a-pdf-file-to-png-using-ghostscript?lq=1