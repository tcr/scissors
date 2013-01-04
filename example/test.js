var fs = require('fs');
var scissors = require('..');

var pdf = scissors(__dirname + '/test.pdf');
var page = pdf.pages(2);

// Streams
page.pdfStream().pipe(fs.createWriteStream(__dirname + '/test-page.pdf'));
page.pngStream(300).pipe(fs.createWriteStream(__dirname + '/test-page.png'));

// All content
pdf.contentStream().on('data', function (item) {
  if (item.type == 'string') {
    console.log(item.string);
  } else if (item.type == 'image') {
    console.log(item);
  }
});
