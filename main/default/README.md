# `@shapediver/viewer`

This is the npm package for the ShapeDiver Viewer. 

For more information on ShapeDiver, please visit our [homepage](https://shapediver.com/). If you need help, have a look at our [help desk](https://help.shapediver.com/doc/Viewer.1836580882.html).

## Installation
```
npm install --save @shapediver/viewer
```

## Usage

The ShapeDiver Viewer consists of simple components that you can use in your own application. You can see here how you can create those components and some things that you can do with them. Please have a look at the specific documentations or the [help desk](https://help.shapediver.com/doc/Viewer.1836580882.html) for further information.

### createSession

The [session](./interfaces/ISessionApi.html) is the component that connects to the ShapeDiver servers. This component is used to change [parameters](./interfaces/IParameterApi.html), to create [exports](./interfaces/IExportApi.html) and to manage the [outputs](./interfaces/IOutputApi.html). For more information on what all of these terms mean, please visit our [help desk page](https://help.shapediver.com/doc/sessions).

```typescript
import { createSession } from '@shapediver/viewer';

const session = await createSession({
    id: 'mySession',
    ticket: MY_TICKET, 
    modelViewUrl: MY_MODEL_VIEW_URL
});
```

Once a session is created, the initial outputs are already loaded (unless specified otherwise in the [method options](./modules.html#createSession)).

### createViewport

The [viewport](./interfaces/IViewportApi.html) is the component where the rendering takes place. To create it, a canvas is needed that is somewhere in your page. 

```typescript
import { createViewport } from '@shapediver/viewer';

const viewport = await createViewport({
    id: 'myViewport',
    canvas: document.getElementById('canvas') as HTMLCanvasElement
});
```

Once you created a viewport, you can see the logo. When nothing is in the scene yet, the logo is shown until there is something to render. 

There are many options that you can already provide on initialization, please have a look at them [here](./modules.html#createViewport).

## Features

- __Interaction__: [`@shapediver/viewer.features.interaction`](./features/interaction/index.html)

    To select, drag and hover objects, please use our interaction feature package.
    
- __Attribute Visualization__: [`@shapediver/viewer.features.attribute-visualization`](./features/attribute-visualization/index.html)

    To visualize the attributes of objects, please use our attribute visualization feature package.

