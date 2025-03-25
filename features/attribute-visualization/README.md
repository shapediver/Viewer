# `@shapediver/viewer.features.attribute-visualization`

This is the npm package for the ShapeDiver Viewer attribute visualization features. Please have a look at our [help desk section](https://help.shapediver.com/doc/attribute-visualization) for this feature.

For more information on ShapeDiver, please visit our [homepage](https://shapediver.com/). If you need help, have a look at our [help desk](https://help.shapediver.com/doc/Viewer.1836580882.html).

This feature is already implemented on our [Platform](https://shapediver.com/app). Just go to any model with attribute and click on the attributes tab.

## Installation

```
npm install --save @shapediver/viewer.features.attribute-visualization
```

## Usage

As this is an additional package to the `@shapediver/viewer` package, we omit the initial setup. Please have a look [here](https://viewer.shapediver.com/v3/latest/api/index.html).

### AttributeVisualizationEngine

After creating a [Viewport](https://viewer.shapediver.com/v3/latest/api/interfaces/IViewportApi.html) and a [Session](https://viewer.shapediver.com/v3/latest/api/interfaces/ISessionApi.html), you can create an [AttributeVisualizationEngine](https://viewer.shapediver.com/v3/latest/api/features/attribute-visualization/index.html), which is the central hub for all attribute visualization related behavior. Additionally, you have to switch the viewport mode to visualize the attributes. You can switch forth and back to see the normal rendering again. This can easily done with the code below.

```typescript
import {RENDERER_TYPE} from "@shapediver/viewer";
import {AttributeVisualizationEngine} from "@shapediver/viewer.features.attribute-visualization";

// switch the viewport rendering typoe
viewport.type = RENDERER_TYPE.ATTRIBUTES;

// create the AttributeVisualizationEngine
const attributeVisualizationEngine = new AttributeVisualizationEngine(viewport);
```

Once an [AttributeVisualizationEngine](https://viewer.shapediver.com/v3/latest/api/features/attribute-visualization/index.html) has been created, Layers and Attributes can be visualized. Please see the following sections for the description of these features.

### Layers

Layers are a special kind of attributes. They are internally stored exactly the same as all other attributes, but get a special treatment for visualization purposes. In the example below you can see how the opacity and color of layers are change via their name.

```typescript
// change the opacity
attributeVisualizationEngine.layers["pinky"].opacity = 0.5;

// change the color
attributeVisualizationEngine.layers["brain"].color = "#ff0000";

// apply the changes
attributeVisualizationEngine.updateLayers(attributeVisualizationEngine.layers);
```

### Attributes

Attributes can have different types, therefore the visualization is not always the same. In the code example below we show the code for visualizing a string attribute. You can also visualize multiple attributes at the same time by adding them to the array. If however an object contains multiple attributes that should be visualized, only the first one will be.

```typescript
import {SDTF_TYPEHINT} from "@shapediver/viewer";
import {
	IStringAttribute,
	ATTRIBUTE_VISUALIZATION,
} from "@shapediver/viewer.features.attribute-visualization";

attributeVisualizationEngine.updateAttributes([
	<IStringAttribute>{
		key: "x+y, string",
		type: SDTF_TYPEHINT.STRING,
		visualization: ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED,
	},
]);
```

Please make sure to visit our [help desk](https://help.shapediver.com/doc/attribute-visualization#AttributeVisualization-CodeSandBoxes) where there are many more examples linked.
