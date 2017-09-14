// My code is written in typescript and node version is v8.2.1
// pdf files are also attached

async createPNG(idArray, done) {
  try {
    // tslint:disable-next-line:prefer-for-of
    for (let index = 1; index <= 3; index++) {
      const pdfFile = "page_" + index;
      const pngFile = tmp.fileSync({ mode: "0644", prefix: "png_", postfix: ".png" });
      const pngFilePath = pngFile.name;
      const pdf = await scissors(pdfFile);
      await new Promise((resolve, reject) => {
        pdf.pngStream(300)
        .pipe(fs.createWriteStream(pngFilePath))
        .on("finish", () => {
          resolve();
        })
        .on("error", (e) => {
          reject(e); return;
        });
      });
      // cleanup
      pngFile.removeCallback();
    }
  } catch (e) {
    done(e);
  }
}
