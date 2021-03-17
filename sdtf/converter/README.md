# `viewer.sdtf.converter`

> This package reads from:
> - uri to sdtf file
> - array buffer to sdtf file
> - json to sdtf file

## Install
```
npm install @shapediver/viewer.sdtf.converter
```
## Usage

```typescript
import { Reader, SdtfFile } from '@shapediver/viewer.sdtf.converter';

const reader = new Reader();

// uri to sdtf file
const file1: SdtfFile = reader.readFromUri('SOME_URI');

// array buffer to sdtf file
const file2: SdtfFile = reader.readFromArrayBuffer(SOME_ARRAYBUFFER);

// json to sdtf file
const file3: SdtfFile = reader.readFromJson(SOME_JSON);
```