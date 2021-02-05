# `viewer.sdtf.parser`

> This package has a decoder and encoder and can parse from:
> - uri to array buffer (and back)
> - uri to json and optional binary data (and back)
> - array buffer to json and optional binary data (and back)

## Install
```
npm install @shapediver/viewer.sdtf.parser
```

Please see the explanation in the [template repository](https://github.com/shapediver/ShapeDiverMonorepoTemplate) for permissions.

## Usage

```typescript
import { JsonSdtf } from '@shapediver/viewer.sdtf.shared';
import { Decoder, Encoder } from '@shapediver/viewer.sdtf.parser';

const encoder = new Encoder();

// uri to array buffer
const arrayBuffer = encoder.encodeFromUriToArrayBuffer('SOME_URI');

// uri to json and optional binary data
const json1: {
        json: JsonSdtf,
        binaryData?: ArrayBuffer
    } = encoder.encodeFromUriToJson('SOME_URI');

// array buffer to json and optional binary data
const json2: {
        json: JsonSdtf,
        binaryData?: ArrayBuffer
    } = encoder.encodeFromArrayBufferToJson(arrayBuffer);
```