# `@shapediver/viewer`

This is the npm package for the ShapeDiver Viewer.
For more information on ShapeDiver, please visit our [homepage](https://shapediver.com/).

For the documentation of the Viewer, there are three main pages:

- [The Viewer help desk](https://help.shapediver.com/doc/viewer) which offers introductions, descriptions and guides.
- [The Viewer API documentation](https://viewer.shapediver.com/v3/latest/api/index.html) which offers the technical documentation of the API.
- [The Viewer examples page](https://viewer.shapediver.com/v3/examples/index.html) which offers various examples (with github links and CodeSandBoxes).

If you have any questions or need help with the viewer, please visit the [ShapeDiver Forum](https://forum.shapediver.com/).

## Installation

```
npm install --save @shapediver/viewer
```

## Usage

The ShapeDiver Viewer consists of simple components that you can use in your own application. You can see here how you can create those components and some things that you can do with them. Please have a look at the specific documentations or the [help desk](https://help.shapediver.com/doc/Viewer.1836580882.html) for further information.

### createSession

The [session](./interfaces/ISessionApi.html) is the component that connects to the ShapeDiver servers. This component is used to change [parameters](./interfaces/IParameterApi.html), to create [exports](./interfaces/IExportApi.html) and to manage the [outputs](./interfaces/IOutputApi.html). For more information on what all of these terms mean, please visit our [help desk page](https://help.shapediver.com/doc/sessions).

```typescript
import {createSession} from "@shapediver/viewer";

const session = await createSession({
	id: "mySession",
	ticket: MY_TICKET,
	modelViewUrl: MY_MODEL_VIEW_URL,
});
```

Once a session is created, the initial outputs are already loaded (unless specified otherwise in the [method options](./modules.html#createSession)).

### createViewport

The [viewport](./interfaces/IViewportApi.html) is the component where the rendering takes place. To create it, a canvas is needed that is somewhere in your page.

```typescript
import {createViewport} from "@shapediver/viewer";

const viewport = await createViewport({
	id: "myViewport",
	canvas: document.getElementById("canvas") as HTMLCanvasElement,
});
```

Once you created a viewport, you can see the logo. When nothing is in the scene yet, the logo is shown until there is something to render.

There are many options that you can already provide on initialization, please have a look at them [here](./modules.html#createViewport).

## Features

- **Interaction**: [`@shapediver/viewer.features.interaction`](./features/interaction/index.html)

    To select, drag and hover objects, please use our interaction feature package.

- **Attribute Visualization**: [`@shapediver/viewer.features.attribute-visualization`](./features/attribute-visualization/index.html)

    To visualize the attributes of objects, please use our attribute visualization feature package.

- **Drawing Tools**: [`@shapediver/viewer.features.drawing-tools`](./features/drawing-tools/index.html)

    To create and edit point and line data.

- **Gumball**: [`@shapediver/viewer.features.gumball`](./features/gumball/index.html)

    Translate, rotate and scale objects.
