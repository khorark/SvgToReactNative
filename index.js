const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const juice = require("juice");
const SVGO = require("svgo");
const { exec } = require("child_process");
const { config } = require("./config.js");

// constants
const pathToMinDir = `${__dirname}/minSvg`;
const pathToComponentDir = `${__dirname}/components`;
const svgo = new SVGO(config);

const getFileSize = file => {
  const stats = fs.statSync(file);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes / 1000;
};

// Check dirs
if (!fs.existsSync(pathToMinDir)) fs.mkdirSync(pathToMinDir);
if (!fs.existsSync(pathToComponentDir)) fs.mkdirSync(pathToComponentDir);

// Read all files from dir
const files = fs.readdirSync(__dirname);

files.forEach(file => {
  if (path.extname(file) !== ".svg") return false;
  const startFileSize = getFileSize(`${__dirname}/${file}`);
  const timeStart = performance.now();

  // Work with files
  const svgData = fs.readFileSync(`${__dirname}/${file}`, {encoding: "utf-8"});
  const pathFileToMin = `${pathToMinDir}/${path.basename(file, "svg")}.min.svg`;

  const data = juice(svgData);

  svgo.optimize(data, {}).then(result => {
    fs.writeFile(pathFileToMin, result.data, err => {
      if (err) console.error(err);

      const finishFileSize = getFileSize(pathFileToMin);
      const persentProgress = (100 - (finishFileSize / startFileSize * 100)).toFixed(2);
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
