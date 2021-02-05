# `sdtf.reader`

> This package encodes encodes:
> - uri to sdtf file
> - array buffer to sdtf file
> - json to sdtf file

## Install
```
npm install @shapediver/sdtf.reader
```

Please see the explanation in the [template repository](https://github.com/shapediver/ShapeDiverMonorepoTemplate) for permissions.

## Usage

```typescript
import { Reader } from '@shapediver/sdtf.reader';

const reader = new Reader();

// uri to sdtf file
const file1 = reader.readFromUri('SOME_URI');

// array buffer to sdtf file
const file2 = reader.readFromArrayBuffer(SOME_ARRAYBUFFER);

// json to sdtf file
const file3 = reader.readFromJson(SOME_JSON);
```