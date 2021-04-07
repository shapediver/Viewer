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

const performanceEvaluator: PerformanceEvaluator = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);

performanceEvaluator.start('id');
// do something to record
performanceEvaluator.pause('id');
// stop recording
performanceEvaluator.continue('id');
// restart recording
performanceEvaluator.end('id');

const evaluation = performanceEvaluator.getEvaluation('id')
```