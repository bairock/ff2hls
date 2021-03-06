function magicBitrate(width, height) {
  const p = width * height;
  return Math.max((p * 0.0008) + ((p ** 0.19) * 425) - 3600, p * 0.0008);
}

function streamFfArgs(stream, outputPath) {
  return [
    '-vf',
    `scale=w=${stream.width}:h=${stream.height}:force_original_aspect_ratio=decrease,pad='iw+mod(iw\,2)':'ih+mod(ih\,2)`,
    '-sn',
    '-c:a',
    'mp3',
    '-ar',
    '48000',
    '-pix_fmt',
    'yuv420p',
    '-c:v',
    'libx264',
    '-preset',
    'superfast',
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
    `${outputPath}/${stream.height}p.m3u8`,
  ];
}

function applicableStreams(streams, probe) {
  const videoStream = probe.streams.find((s) => s.codec_type === 'video');
  const aspect = videoStream.width / videoStream.height;
  const heights = streams.height ? streams.height : streams.width.map((s) => s / aspect);
  const notUpscaled = heights.filter((s) => videoStream.height >= s);
  const theStreams = notUpscaled.map((s) => {
    const height = s;
    const width = height * aspect;
    const bitrate = Math.round(magicBitrate(width, height));
    return { height, width, bitrate };
  });
  theStreams.sort((a, b) => b.bitrate - a.bitrate);
  return theStreams;
}

function masterManifest(videoStreams, captionStreams) {
  const manifestLines = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
  ];
  captionStreams.forEach((s, i) => {
    const captionArgs = [
      '#EXT-X-MEDIA:TYPE=SUBTITLES',
      'GROUP-ID="cc"',
      `NAME="${s.languageName}"`,
      `LANGUAGE="${s.languageCode}"`,
      `AUTOSELECT=${i === 0 ? 'YES' : 'NO'}`,
      `DEFAULT=${i === 0 ? 'YES' : 'NO'}`,
      `URI="cc${i}.m3u8"`,
    ];
    manifestLines.push(captionArgs.join(','));
  });
  videoStreams.forEach((s) => {
    const videoArgs = [
      `#EXT-X-STREAM-INF:BANDWIDTH=${s.bitrate}000`,
      `RESOLUTION=${Math.round(s.width)}x${Math.round(s.height)}`,
    ];
    manifestLines.push(videoArgs.join(','));
    manifestLines.push(`${s.height}p.m3u8`);
  });
  manifestLines.push('');
  return manifestLines.join('\n');
}

module.exports = {
  magicBitrate,
  streamFfArgs,
  applicableStreams,
  masterManifest,
};

