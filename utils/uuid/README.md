# `viewer.utils.uuid`

> This package can create v4 `uuid`s and can check if a string is a valid `uuid`.

## Install
```
npm install @shapediver/viewer.utils.uuid
```

Please see the explanation in the [template repository](https://github.com/shapediver/ShapeDiverMonorepoTemplate) for permissions.

## Usage

```typescript
import uuid from '@shapediver/viewer.utils.uuid';

const uuid1: string = uuid.createUUID();

const result1: boolean = uuid.isUUID(uuid1); // is true
const result2: boolean = uuid.isUUID('not a uuid'); // is false


```