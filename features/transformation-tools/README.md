# `@shapediver/viewer.features.transformation-tools`

This is the npm package for the ShapeDiver Viewer Transformation Tools features. Please have a look at our [help desk section](https://help.shapediver.com/doc/transformation-tools) for this feature.

For more information on ShapeDiver, please visit our [homepage](https://shapediver.com/). If you need help, have a look at our [help desk](https://help.shapediver.com/doc/Viewer.1836580882.html).

This package provides two transformation tools: **GumballTransform** for full 3D translation, rotation, and scaling via a 3D gizmo, and **RectangleTransform** for 2D translation, rotation, and scaling on a defined plane via a rectangular handle. Both tools have already been integrated with [App Builder](https://help.shapediver.com/doc/shapediver-app-builder), allowing you to initialize them via a Grasshopper component without any coding.

## Installation

```
npm install --save @shapediver/viewer.features.transformation-tools
```

## Usage

As this is an additional package to the `@shapediver/viewer` package, we omit the initial setup. Please have a look [here](https://viewer.shapediver.com/v3/latest/api/index.html).

### GumballTransform

The GumballTransform allows you to translate, rotate, and scale geometry in 3D using a familiar gizmo. This is the standard behavior found in most 3D software.

The GumballTransform has already been integrated with [App Builder](https://help.shapediver.com/doc/shapediver-app-builder). This allows you to use a [component in Grasshopper](https://help.shapediver.com/doc/gumballTransform-input) to initialize the GumballTransform. With this approach, no coding is needed.

#### Initial Setup

The GumballTransform is initialized with the viewport in which it should be created and the nodes it should act on.

Once the GumballTransform has been created, you can listen to the `EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED` event which is emitted whenever the movement of the GumballTransform ends. In this event you get the current nodes and the matrices that are applied to it.

```typescript
import {
	GumballTransform,
	EventResponseMapping,
} from "@shapediver/viewer.features.transformation-tools";
import {addListener, EVENTTYPE_TRANSFORMATION_TOOLS} from "@shapediver/viewer";

// create the GumballTransform with a viewport and the nodes
const gumballTransform = new GumballTransform(viewport, nodes);

// listen to the event to be notified of changes
const eventListenerToken = addListener(
	EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED,
	(e) => {
		const event =
			e as EventResponseMapping[EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED];

		console.log(
			`GumballTransform has changed: 
        - viewportId: ${event.viewportId}
        - nodes: ${event.nodes}
        - transformations: ${event.transformations}`,
		);
	},
);
```

The nodes can either be taken from the scene tree or supplied by a user selection. For further information on the settings that are available, please visit the [API documentation](https://viewer.shapediver.com/v3/latest/api/features/transformation-tools/index.html).

#### Settings

**General** (inherited from all Transformation Tools):

| Name                | Description                                               | Default |
| ------------------- | --------------------------------------------------------- | ------- |
| enableRotation      | Enable or disable rotation.                               | `true`  |
| enableScaling       | Enable or disable scaling.                                | `true`  |
| enableTranslation   | Enable or disable translation.                            | `true`  |
| reuseTransformation | Reuse the transformation already applied to the nodes.    | `true`  |
| restrictions        | Restrictions applied to the transformation (keyed by id). | `{}`    |

**GumballTransform-specific**:

| Name                  | Description                                                                         | Default    |
| --------------------- | ----------------------------------------------------------------------------------- | ---------- |
| scale                 | The scale of the gizmo compared to the screen size.                                 | `0.15`     |
| space                 | The space in which the gizmo operates (`"local"` or `"world"`).                     | `local`    |
| enableRotationAxes    | Fine-grained enable/disable per rotation axis (`x`, `y`, `z`, `xy`, `yz`, `xz`).    | all `true` |
| enableScalingAxes     | Fine-grained enable/disable per scaling axis (`x`, `y`, `z`, `xy`, `yz`, `xz`).     | all `true` |
| enableTranslationAxes | Fine-grained enable/disable per translation axis (`x`, `y`, `z`, `xy`, `yz`, `xz`). | all `true` |

---

### RectangleTransform

The RectangleTransform allows you to translate, rotate and scale geometry in the scene using a 2D rectangular handle that lives on a defined plane. It is well-suited for flat or planar objects where a 3D gizmo would be unnecessarily complex.

The RectangleTransform has already been integrated with [App Builder](https://help.shapediver.com/doc/shapediver-app-builder). This allows you to use a [component in Grasshopper](https://help.shapediver.com/doc/rectangleTransform-input) to initialize the RectangleTransform. With this approach, no coding is needed.

#### Initial Setup

The RectangleTransform is initialized with the viewport, the nodes to transform, and a settings object. The `plane` setting is required and defines the plane on which the rectangle is drawn and interacted with.

```typescript
import {
	RectangleTransform,
	EventResponseMapping,
} from "@shapediver/viewer.features.transformation-tools";
import {addListener, EVENTTYPE_TRANSFORMATION_TOOLS} from "@shapediver/viewer";

// create the RectangleTransform with a viewport, nodes, and a plane definition
const rectangleTransform = new RectangleTransform(viewport, nodes, {
	plane: {
		origin: [0, 0, 0],
		vector_u: [1, 0, 0],
		vector_v: [0, 1, 0],
	},
});

// listen to the event to be notified of changes
const eventListenerToken = addListener(
	EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED,
	(e) => {
		const event =
			e as EventResponseMapping[EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED];

		// filter for this specific instance when multiple instances are active
		if (event.id !== rectangleTransform.id) return;

		console.log(
			`RectangleTransform has changed:
        - viewportId: ${event.viewportId}
        - nodes: ${event.nodes}
        - transformations: ${event.transformations}`,
		);
	},
);
```

The nodes can either be taken from the scene tree or supplied by a user selection. For further information on the settings that are available, please visit the [API documentation](https://viewer.shapediver.com/v3/latest/api/features/transformation-tools/index.html).

#### Settings

There are different settings that can be used to tailor the RectangleTransform to your needs.

**General** (inherited from all Transformation Tools):

| Name                | Description                                               | Default |
| ------------------- | --------------------------------------------------------- | ------- |
| enableRotation      | Enable or disable rotation.                               | `true`  |
| enableScaling       | Enable or disable scaling.                                | `true`  |
| enableTranslation   | Enable or disable translation.                            | `true`  |
| reuseTransformation | Reuse the transformation already applied to the nodes.    | `true`  |
| restrictions        | Restrictions applied to the transformation (keyed by id). | `{}`    |

**RectangleTransform-specific**:

| Name                    | Description                                                                                  | Default     |
| ----------------------- | -------------------------------------------------------------------------------------------- | ----------- |
| plane                   | The plane on which the rectangle is drawn. Requires `origin`, `vector_u`, and `vector_v`.    | `XY plane`  |
| corners.topLeft         | Enable or disable the top-left corner handle.                                                | `true`      |
| corners.topRight        | Enable or disable the top-right corner handle.                                               | `true`      |
| corners.bottomLeft      | Enable or disable the bottom-left corner handle.                                             | `true`      |
| corners.bottomRight     | Enable or disable the bottom-right corner handle.                                            | `true`      |
| edgeControls.top        | Enable or disable the top edge handle.                                                       | `true`      |
| edgeControls.bottom     | Enable or disable the bottom edge handle.                                                    | `true`      |
| edgeControls.left       | Enable or disable the left edge handle.                                                      | `true`      |
| edgeControls.right      | Enable or disable the right edge handle.                                                     | `true`      |
| scaling.uniform         | If `true`, scale equally in both directions.                                                 | `false`     |
| scaling.uMin / uMax     | Minimum / maximum allowed length along the U axis.                                           | `undefined` |
| scaling.vMin / vMax     | Minimum / maximum allowed length along the V axis.                                           | `undefined` |
| scaling.step            | Snap step size for scaling (in world units).                                                 | `undefined` |
| scaling.visualization   | Customize the appearance of the scaling handles and outline.                                 | `undefined` |
| rotation.step           | Snap step size for rotation (in degrees).                                                    | `undefined` |
| rotation.stepThreshold  | Proximity threshold for snapping during rotation (in degrees).                               | `undefined` |
| rotation.min / max      | Minimum / maximum allowed rotation angle (in degrees).                                       | `undefined` |
| rotation.handleDistance | Distance of the rotation handle above the top edge, as a fraction of the rectangle's height. | `0.25`      |
| rotation.visualization  | Customize the appearance of the rotation handle.                                             | `undefined` |
