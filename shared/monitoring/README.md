# `viewer.shared.monitoring`

> This package provides monitoring functionality for the viewer.

## Install
```
npm install @shapediver/viewer.shared.monitoring
```

Please see the explanation in the [template repository](https://github.com/shapediver/ShapeDiverMonorepoTemplate) for permissions.

## Usage

```typescript
import { container } from 'tsyringe';
import { PerformanceEvaluator } from '@shapediver/viewer.shared.monitoring';

const performanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);

performanceEvaluator.start('id');
// do something to record
performanceEvaluator.pause('id');
// stop recording
performanceEvaluator.continue('id');
// restart recording
performanceEvaluator.end('id');

const evaluation = performanceEvaluator.getEvaluation('id')
```


```typescript
import { container } from 'tsyringe';
import { ErrorHandler } from '@shapediver/viewer.shared.monitoring';

const errorHandler = <ErrorHandler>container.resolve(ErrorHandler);

errorHandler.handle(new Error('this is an error message'));
errorHandler.handleHttpError(404, new Error('this is an http error message'));
```