# `@shapediver/viewer.viewport`

This is the npm package for the ShapeDiver Viewer Viewport API.
For more information on ShapeDiver, please visit our [homepage](https://shapediver.com/).

For the documentation of the Viewer, there are three main pages:

- [The Viewer help desk](https://help.shapediver.com/doc/viewer) which offers introductions, descriptions and guides.
- [The Viewer API documentation](https://viewer.shapediver.com/v3/latest/api/index.html) which offers the technical documentation of the API.
- [The Viewer examples page](https://viewer.shapediver.com/v3/examples/index.html) which offers various examples (with github links and CodeSandBoxes).

If you have any questions or need help with the viewer, please visit the [ShapeDiver Forum](https://forum.shapediver.com/).

## Installation

```
npm install --save @shapediver/viewer.viewport
```

## Usage

The ShapeDiver Viewer consists of simple components that you can use in your own application. You can see here how you can create those components and some things that you can do with them. Please have a look at the specific documentations or the [help desk](https://help.shapediver.com/doc/Viewer.1836580882.html) for further information.

### createViewport

The [viewport](./interfaces/IViewportApi.html) is the component where the rendering takes place. To create it, a canvas is needed that is somewhere in your page.

```typescript
import {createViewport} from "@shapediver/viewer.viewport";

const viewport = await createViewport({
	id: "myViewport",
	canvas: document.getElementById("canvas") as HTMLCanvasElement,
});
```

Once you created a viewport, you can see the logo. When nothing is in the scene yet, the logo is shown until there is something to render.
