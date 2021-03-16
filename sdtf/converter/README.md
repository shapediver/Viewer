# `viewer.sdtf.reader`

> This package reads from:
> - uri to sdtf file
> - array buffer to sdtf file
> - json to sdtf file

## Install
```
npm install @shapediver/viewer.sdtf.reader
```
## Usage

```typescript
import { Reader } from '@shapediver/viewer.sdtf.reader';

const reader = new Reader();

// uri to sdtf file
const file1 = reader.readFromUri('SOME_URI');

// array buffer to sdtf file
const file2 = reader.readFromArrayBuffer(SOME_ARRAYBUFFER);

// json to sdtf file
const file3 = reader.readFromJson(SOME_JSON);
```