const childProcess = require('child_process');
const fs = require('fs');
const ffprobe = require('ffprobe');
const utils = require('./utils');

function doEncode(inputFile, streams, outputPath) {
  const outputArgs = streams.map((stream) => utils.streamFfArgs(stream, outputPath));
  const ffArgs = ['-hide_banner', '-y', '-i', inputFile].concat(...outputArgs);
  const masterText = utils.masterManifest(streams, []);
  const proc = childProcess.spawn('ffmpeg', ffArgs);
  proc.stdout.on('data', (data) => console.log(data.toString()));
  proc.stderr.on('data', (data) => console.log(data.toString()));
  return new Promise((resolve, reject) => {
    proc.on('close', () => {
      fs.writeFile(`${outputPath}/master.m3u8`, masterText, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(`${outputPath}/master.m3u8`);
        }
      });
    });
  });
}

function encode(inputFile, streams, outputPath) {
  return new Promise((resolve, reject) => {
    ffprobe(inputFile, { path: 'ffprobe' })
      .then((probeResults) => {
        const calcStreams = utils.applicableStreams(streams, probeResults);
        return doEncode(inputFile, calcStreams, outputPath);
      })
      .then((masterManifestPath) => {
        resolve(masterManifestPath);
      })
      .catch((err) => reject(err));
  });
}

if (require.main === module) {
  if (process.argv.length < 4) {
    console.log('ff-to-hls requires two arguments.');
    process.exitCode = 1;
  } else {
    console.log(process.argv);
    const testStreams = { height: [360, 540, 720, 900] };
    encode(process.argv[2], testStreams, process.argv[3]).then(console.log);
  }
}

module.exports = { encode };
