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
   .deflate()
   .inflate()
   .crop(100, 100, 300, 200) // left, bottom, right, top

pdf.pdfStream().pipe(fs.createWriteStream('out.pdf')); // PDF of compiled output
pdf.pngStream(300).pipe(fs.createWriteStream('out-page1.png')); // first page at 300 dpi
```

## Requirements

* Install [PDFTK (http://www.pdflabs.com/docs/install-pdftk/)](http://www.pdflabs.com/docs/install-pdftk/) on your system.
* Ensure you have Ghostscript installed on your system (`gs` from the command line).

## References

* http://hzqtc.github.com/2012/04/pdf-tools-merging-extracting-and-cropping.html
* http://documentcloud.github.com/docsplit/
* http://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
* http://segfault.in/2010/07/pdf-manipulations-and-conversions-from-linux-command-prompt/
* http://www.maths.ox.ac.uk/help/faqs/files/manipulating-pdf-files
* http://stackoverflow.com/questions/11754556/ghostscript-convert-a-pdf-and-output-in-a-textfile
* http://right-sock.net/linux/better-convert-pdf-to-jpg-using-ghost-script/
* http://stackoverflow.com/questions/12484353/how-to-crop-a-section-of-a-pdf-file-to-png-using-ghostscript?lq=1