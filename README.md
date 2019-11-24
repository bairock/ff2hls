# ff2hls
Helper function for transcoding video with nodejs

## Usage

```
const ff2hls = require('ff2hls');

const input = '/path/to/source.mov';
const renditions = { height: [360, 540, 720, 900] };
const output = '/path/to/hls_directory'
ff2hls.encode(input, renditions, output).then(console.log);
```
