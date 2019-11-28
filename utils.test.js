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
  const expectedHeights = [720, 540, 360];
  const actualHeights = result.map((stream) => stream.height);
  expect(actualHeights).toEqual(expectedHeights);
});

test('applicableStreams can scale by width', () => {
  const basicInput = { width: [640, 800, 1280, 1600] };
  const fixturePath = 'testFixtures/ffprobe_720p_no_captions.json';
  const probeData = JSON.parse(fs.readFileSync(fixturePath));
  const result = utils.applicableStreams(basicInput, probeData);
  const expectedHeights = [720, 450, 360];
  const actualHeights = result.map((stream) => stream.height);
  expect(actualHeights).toEqual(expectedHeights);
});

test('applicableStreams can handle portrait input', () => {
  const basicInput = { height: [640, 960, 1280, 1600] };
  const fixturePath = 'testFixtures/ffprobe_portrait.json';
  const probeData = JSON.parse(fs.readFileSync(fixturePath));
  const result = utils.applicableStreams(basicInput, probeData);
  const expectedWidths = [900, 720, 540, 360];
  const actualWidths = result.map((stream) => stream.width);
  expect(actualWidths).toEqual(expectedWidths);
});

test('applicableStreams can scale portrait inputs by width', () => {
  const basicInput = { width: [270, 450, 630, 810] };
  const fixturePath = 'testFixtures/ffprobe_portrait.json';
  const probeData = JSON.parse(fs.readFileSync(fixturePath));
  const result = utils.applicableStreams(basicInput, probeData);
  const expectedHeights = [1440, 1120, 800, 480];
  const actualHeights = result.map((stream) => stream.height);
  expect(actualHeights).toEqual(expectedHeights);
});

test('masterManifest returns m3u8 text', () => {
  const basicInput = [{ width: 160, height: 90, bitrate: 100 }];
  const result = utils.masterManifest(basicInput, []);
  expect(result.startsWith('#EXTM3U')).toBe(true);
});
