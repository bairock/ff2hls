const fs = require('fs');
const utils = require('./utils');

test('magicBitrate returns a positive number', () => {
  expect(utils.magicBitrate(160, 90)).toBeGreaterThan(0);
});

test('streamFfArgs returns an array', () => {
  const dummyStream = { width: 160, height: 90, bitrate: 100 };
  const dummyPath = '/path/to/output';
  const result = utils.streamFfArgs(dummyStream, dummyPath);
  expect(Array.isArray(result)).toBe(true);
});

test('applicableStreams returns an array', () => {
  const basicInput = { height: [270, 360, 540, 720] };
  const fixturePath = 'testFixtures/ffprobe_720p_no_captions.json';
  const probeData = JSON.parse(fs.readFileSync(fixturePath));
  const result = utils.applicableStreams(basicInput, probeData);
  expect(Array.isArray(result)).toBe(true);
});

test('applicableStreams does not upscale', () => {
  const basicInput = { height: [360, 540, 720, 1080] };
  const fixturePath = 'testFixtures/ffprobe_720p_no_captions.json';
  const probeData = JSON.parse(fs.readFileSync(fixturePath));
  const result = utils.applicableStreams(basicInput, probeData);
  expect(result.length).toEqual(3);
});

test('masterManifest returns m3u8 text', () => {
  const basicInput = [{ width: 160, height: 90, bitrate: 100 }];
  const result = utils.masterManifest(basicInput, []);
  expect(result.startsWith('#EXTM3U')).toBe(true);
});
