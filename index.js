const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const juice = require("juice");
const SVGO = require("svgo");
const { exec } = require("child_process");
const { config } = require("./config.js");
const xml2js = require("xml2js");

// constants
const pathToMinDir = `./minSvg`;
const pathToComponentDir = `./components`;
const svgo = new SVGO(config);
const builder = new xml2js.Builder();

const getFileSize = file => {
  const stats = fs.statSync(file);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes / 1000;
};

// Check dirs
if (!fs.existsSync(pathToMinDir)) fs.mkdirSync(pathToMinDir);
if (!fs.existsSync(pathToComponentDir)) fs.mkdirSync(pathToComponentDir);

// Read all files from dir
const files = fs.readdirSync("./");

files.forEach(file => {
  if (path.extname(file) !== ".svg") return false;
  const startFileSize = getFileSize(`./${file}`);
  const timeStart = performance.now();

  // Work with files
  const svgData = fs.readFileSync(`./${file}`, { encoding: "utf-8" });

  const pathFileToMin = `${pathToMinDir}/${path.basename(
    file,
    ".svg"
  )}Icon.svg`;

  const data = juice(svgData);

  xml2js.parseString(data, { trim: true }, (err, result) => {
    if (
      typeof result === "object" &&
      result.hasOwnProperty("svg") &&
      result.svg.hasOwnProperty("$")
    ) {
      const viewBox = result.svg["$"].viewbox.split(" ");

      result.svg["$"].width = viewBox[2];
      result.svg["$"].height = viewBox[3];

      const xml = builder.buildObject(result);
    }

    svgo.optimize(xml, {}).then(result => {
      fs.writeFile(pathFileToMin, result.data, err => {
        if (err) console.error(err);

        // Convert to React native class
        exec(`svg-to-react-native -d ${pathToMinDir} -o ${pathToComponentDir}`);

        const finishFileSize = getFileSize(pathFileToMin);
        const persentProgress = (
          100 -
          finishFileSize / startFileSize * 100
        ).toFixed(2);
        const timeFinish = parseInt(performance.now() - timeStart);

        console.log("");
        console.log(`${file}:`);
        console.log(`Done in ${timeFinish} ms!`);
        console.log(
          `${startFileSize} KiB - \x1b[32m${persentProgress}%\x1b[37m = ${finishFileSize} KiB`
        );
        console.log("");
      });
    });
  });
});
