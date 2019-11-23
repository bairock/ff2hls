const childProcess = require('child_process');
const fs = require('fs');

function bitrateForPixels(p) {
  return Math.max((p * 0.0008) + ((p ** 0.19) * 425) - 3600, p * 0.0008);
}

function encode(inputFile, streams, outputPath, options) {
  const streamsArray = streams.height ? streams.height : streams.width;
  const aspect = 16 / 9;
  const theStreams = streamsArray.map(s => {
    const height = s;
    const width = height * aspect;
    const bitrate = Math.round(bitrateForPixels(width * height));
    return { height, width, bitrate };
  })
  const outputArgs = theStreams.map(stream => [
    '-vf',
    `scale=w=${stream.width}:h=${stream.height}:force_original_aspect_ratio=decrease`,
    '-c:a',
    'aac',
    '-ar',
    '48000',
    '-pix_fmt',
    'yuv420p',
    '-c:v',
    'libx264',
    '-profile:v',
    'main',
    '-crf',
    '20',
    '-sc_threshold',
    '0',
    '-g',
    '48',
    '-keyint_min',
    '48',
    '-hls_time',
    '4',
    '-hls_playlist_type',
    'vod',
    '-b:v',
    `${stream.bitrate}k`,
    '-maxrate',
    `${Math.round(stream.bitrate * 1.07)}k`,
    '-bufsize',
    `${Math.round(stream.bitrate * 1.5)}k`,
    '-b:a',
    '96k',
    '-hls_segment_filename',
    `${outputPath}/${stream.height}p_%03d.ts`,
    `${outputPath}/${stream.height}p.m3u8`
  ]);
  const ffArgs = ['-hide_banner', '-y', '-i', inputFile].concat(...outputArgs);
  const manifestStreams = theStreams.map(stream =>
    `#EXT-X-STREAM-INF:BANDWIDTH=${stream.bitrate}000,RESOLUTION=${stream.width}x${stream.height}
${stream.height}p.m3u8`);
  const masterManifest = `#EXTM3U
#EXT-X-VERSION:3
${manifestStreams.join('\n')}
`;
  const proc = childProcess.spawn('ffmpeg', ffArgs);
  proc.stdout.on('data', (data) => console.log(data.toString()));
  proc.stderr.on('data', (data) => console.log(data.toString()));
  return new Promise((resolve, reject) => {
    proc.on('close', () => {
      fs.writeFile(`${outputPath}/master.m3u8`, masterManifest, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(`${outputPath}/master.m3u8`);
        }
      });
    });
  });
}

if (require.main === module) {
  if (process.argv.length < 4) {
    console.log('ff-to-hls requires two arguments.');
    process.exitCode = 1;
  } else {
    console.log(process.argv);
    const testStreams = {height: [360, 540, 720, 900]};
    encode(process.argv[2], testStreams, process.argv[3]).then(console.log);
  }
}

module.exports = { encode };
