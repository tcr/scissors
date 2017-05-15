[![Dependency Status](https://david-dm.org/theapsgroup/scissors.png)](https://david-dm.org/theapsgroup/scissors)

# scissors

PDF manipulation in Node.js! Split, join, crop, read, extract, boil, mash, stick them in a stew.

## Example

```javascript
var scissors = require('scissors');

// Use and chain any of these commands...
var pdf = scissors('in.pdf')
   .pages(4, 5, 6, 1, 12) // select or reorder individual pages
   .range(1, 10) // pages 1-10
   .even() // select even pages
   .odd() // select odd pages
   .rotate(90) // 90, 180, 270, 360
   .compress()
   .uncompress()
   .crop(100, 100, 300, 200) // offset in points from left, bottom, right, top
   .encrypt({
        userPass: 'foo',
        ownerPadd: 'bar',
        allow: ['printing','degradedprinting']
   })

// Join multiple files...
var pdfA = scissors('1.pdf'), pdfB = scissors('2.pdf'), pdfC = scissors('3.pdf')
scissors.join(pdfA.page(1), pdfB, pdfC.pages(5, 10)).deflate().pdfStream()...

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
* Mac OS 10.11 requires a patched build available [here] (https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/pdftk_server-2.02-mac_osx-10.11-setup.pkg) as per [this thread](http://stackoverflow.com/questions/32505951/pdftk-server-on-os-x-10-11)
* Ensure you have Ghostscript installed (check by running `gs --version`).
* *(optional)* To extract individual images from a page, install `pdfimages` with `brew install xpdf` or `apt-get install poppler-utils`.
