# `@shapediver/viewer.utils.mime-type`

This package is part of the [`@shapediver/viewer`](https://www.npmjs.com/package/@shapediver/viewer).
It is used to expand the format property of the [ShapeDiver](www.shapediver.com) file parameters.
Additionally, it can be used to to find additional mime-types for provided file endings.


## Install
```
npm install @shapediver/viewer.utils.mime-type
```

## Usage

### extendMimeTypes(mimeTypes: string[]): string[]

Returns an extended array of mime types. The provided mime types are are mapped to file endings and the corresponding mime types are added. The types are filtered to only contain unique values.

Example:

```
import { extendMimeTypes } from "@shapediver/viewer.utils.mime-type"

const currentFormats = ['application/dxf', 'application/x-autocad'];
const completeFormats = extendMimeTypes(currentFormats);
```

### guessMimeTypeFromFilename(filename: string): string[]

Try to guess mime types from a file name

Example:

```
import { guessMimeTypeFromFilename } from "@shapediver/viewer.utils.mime-type"

const types = guessMimeTypeFromFilename(fileName);
```

### mapMimeTypeToFileEndings(mimeTypes: string[]): string[]

Returns the corresponding file endings for each mime type.

Example:

```
import { mapMimeTypeToFileEndings } from "@shapediver/viewer.utils.mime-type"

const currentFormats = ['model/vnd.sdtf'];
const fileEndings = mapMimeTypeToFileEndings(currentFormats);
```