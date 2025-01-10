# `@shapediver/viewer.settings`

This package is part of the [`@shapediver/viewer`](https://www.npmjs.com/package/@shapediver/viewer), you can find all information [here](https://viewer.shapediver.com/v3/latest/api/index.html).

This package contains the definition for various versions of the ShapeDiver Viewer settings.
Additionally, it contains functionality for validation and conversion. 

## Install
```
npm install @shapediver/viewer.settings
```
## Usage

### Validation

```typescript
import { validate } from '@shapediver/viewer.settings';

// validate with the default object of the settings v3, this will not throw an error
const defaultsV3 = DefaultsV3();
// this will attempt to extract the version from the object
validate(defaultsV3)
// with a specified version
validate(defaultsV3, '3.0')

// validate with an invalid object - this will throw an error
try{
    const notAValidSettingsObject = {
        maliciousFunction: () => { console.log('I am bad!') }
    }
    validate(notAValidSettingsObject)
} catch (e) {
    // process the error
}
```

### Conversion

```typescript
import { convert } from '@shapediver/viewer.settings';

// convert to a different version
const defaultsV3 = DefaultsV3();
const convertedV2 = convert(defaultsV3, '2.0')
const convertedV1 = convert(defaultsV3, '1.0')
```

### Getting the target version

```typescript
import { evaluateSettingsVersion } from '@shapediver/viewer.settings';

// get the target versions
const targetVersion1 = evaluateSettingsVersion('1.1000.0'); // results in '1.0'
const targetVersion2 = evaluateSettingsVersion('2.27.0'); // results in '2.0'
const targetVersion3 = evaluateSettingsVersion('3.1.1.0'); // results in '3.0'
```