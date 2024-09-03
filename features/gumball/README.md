# `@shapediver/viewer.features.gumball`

This is the npm package for the ShapeDiver Viewer Gumball feature. Please have a look at our [help desk section](https://help.shapediver.com/doc/gumball) for this feature.

For more information on ShapeDiver, please visit our [homepage](https://shapediver.com/). If you need help, have a look at our [help desk](https://help.shapediver.com/doc/Viewer.1836580882.html).

The Gumball has already been integrated with [App Builder](https://help.shapediver.com/doc/shapediver-app-builder). This allows you to use a [component in Grasshopper](https://help.shapediver.com/doc/gumball-input) to initialize the Gumball. With this approach, no coding is needed.

## Installation
```
npm install --save @shapediver/viewer.features.gumball
```

## Usage

As this is an additional package to the `@shapediver/viewer` package, we omit the initial setup. Please have a look [here](https://viewer.shapediver.com/v3/latest/api/index.html).

### Gumball

The gumball is initialized with the viewport in which it should be created and the nodes with which the Gumball should be initialized.

Once the Gumball has been created, you can listen to the `EVENTTYPE_GUMBALL.MATRIX_CHANGED` event which is emitted whenever the movement of the Gumball ends. In this event you get the current nodes and the matrices that are applied to it.

```typescript
import { Gumball, GumballEventResponseMapping } from '@shapediver/viewer.features.gumball';
import { addListener, EVENTTYPE_GUMBALL } from '@shapediver/viewer';

// create the Gumball with a viewport and the nodes
const gumball = new Gumball(viewport, nodes);

// listen to the event to be notified of changes
const eventListenerToken = addListener(EVENTTYPE_GUMBALL.MATRIX_CHANGED, (e) => {
    const gumballEvent = e as GumballEventResponseMapping[EVENTTYPE_GUMBALL.MATRIX_CHANGED];

    console.log(
        `Gumball has changed: 
        - viewportId: ${gumballEvent.viewportId}
        - nodes: ${gumballEvent.nodes}
        - transformations: ${gumballEvent.transformations}`
    );
});
```

### Settings

There are different settings that can be used to tailor the Gumball to your needs. You can find them in the table below.

| Name           | Description                 | Default |
|----------------|-----------------------------|---------|
| enableRotation | Enable or disable rotation. | `true` |
| enableScaling | Enable or disable scaling. | `true` |
| enableTranslation | Enable or disable translation. | `true` |
| scale | The scale of the Gumball compared to the screen size. | `0.15` |
| space | The space in which the Gumball operates. | `local` |
| reuseTransformation | Reuse the transformation that are already applied to the nodes. | `true` |