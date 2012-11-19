# spindrift

PDF manipulation in Node.js! Split, join, crop, read, extract, boil, mash, stick them in a stew. 

## Future API

```javascript
spindrift('path.pdf').subset(7, 24).temp(function (err, pdf) {
	pdf.rotate()
});
```

## References

* http://documentcloud.github.com/docsplit/
* http://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/
* http://segfault.in/2010/07/pdf-manipulations-and-conversions-from-linux-command-prompt/
* http://www.maths.ox.ac.uk/help/faqs/files/manipulating-pdf-files