# `viewer.monitoring.error-handler`

> This package provides error handling functionality for the viewer.

## Install
```
npm install @shapediver/viewer.monitoring.error-handler
```

Please see the explanation in the [template repository](https://github.com/shapediver/ShapeDiverMonorepoTemplate) for permissions.

## Usage

```typescript
import { container } from 'tsyringe';
import { ErrorHandler } from '@shapediver/viewer.monitoring.error-handler';

const errorHandler = <ErrorHandler>container.resolve(ErrorHandler);

errorHandler.handle(new Error('this is an error message'));
errorHandler.handleHttpError(404, new Error('this is an http error message'));
```