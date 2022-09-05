# `@shapediver/viewer.features.interaction`

This is the npm package for the ShapeDiver Viewer interaction features. Please have a look at our [help desk section](https://help.shapediver.com/doc/interactions-part-1) for this feature.

For more information on ShapeDiver, please visit our [homepage](https://shapediver.com/). If you need help, have a look at our [help desk](https://help.shapediver.com/doc/Viewer.1836580882.html).

## Installation
```
npm install --save @shapediver/viewer.features.interaction
```

## Usage

As this is an additional package to the `@shapediver/viewer` package, we omit the initial setup. Please have a look [here](https://viewer.shapediver.com/v3/latest/api/index.html).

### InteractionEngine

After creating a [Viewport](https://viewer.shapediver.com/v3/latest/api/interfaces/IViewportApi.html) and possibly a [Session](https://viewer.shapediver.com/v3/latest/api/interfaces/ISessionApi.html), you can create an [InteractionEngine](https://viewer.shapediver.com/v3/latest/api/features/interaction/interfaces/IInteractionEngine.html), which is the central hub for all interaction related behavior. This can easily done with the code below.

```typescript
const interactionEngine = new InteractionEngine(viewport);
```

Once an [InteractionEngine](https://viewer.shapediver.com/v3/latest/api/features/interaction/interfaces/IInteractionEngine.html) has been created, Selection, Hovering or Dragging can be enabled. Please see the following sections for the description of these features.

### Selection

To be able to select objects in the scene, a [SelectionManager](https://viewer.shapediver.com/v3/latest/api/features/interaction/classes/SelectManager.html) has to be created. Additionally, the nodes that should be selectable have to be marked as such. This can be seen in the code below.

```typescript  
import { addListener, EVENTTYPE, ISelectEvent, MaterialStandardData } from "@shapediver/viewer";
import { InteractionData, InteractionEngine, SelectManager } from "@shapediver/viewer.features.interaction";

// Create the selection manager and add it
const selectManger = new SelectManager();
// Define a material that should be applied on selection. If no material is defined, the material will not change
selectManger.effectMaterial = new MaterialStandardData({ color: "#ffff00" });
// Add the selection manager to the interaction engine
interactionEngine.addInteractionManager(selectManger);

// In this example, we just make the whole session selectable as one. This can be further expanded to the lowest geometry levels
session.node.data.push(new InteractionData({ select: true }));

// event listener for SELECT_ON
addListener(EVENTTYPE.INTERACTION.SELECT_ON, (e) => {
    const selectEvent = <ISelectEvent>e;
});

// event listener for SELECT_OFF
addListener(EVENTTYPE.INTERACTION.SELECT_OFF, (e) => {
    const selectEvent = <ISelectEvent>e;
});
```

Via the shown event listeners in the code example actions can be triggered. Additional examples can be viewed on our [help desk](https://help.shapediver.com/doc/interactions-part-1#Interactions-Part1-Selection).

### Hovering

To be able to hover objects in the scene, a [HoverManager](https://viewer.shapediver.com/v3/latest/api/features/interaction/classes/HoverManager.html) has to be created. Additionally, the nodes that should be hoverable have to be marked as such. This can be seen in the code below.

```typescript  
import { addListener, EVENTTYPE, IHoverEvent, MaterialStandardData } from "@shapediver/viewer";
import { InteractionData, InteractionEngine, HoverManager } from "@shapediver/viewer.features.interaction";

// Create the hover manager and add it
const hoverManger = new HoverManager();
// Define a material that should be applied on hover. If no material is defined, the material will not change
hoverManger.effectMaterial = new MaterialStandardData({ color: "#ffff00" });
// Add the hover manager to the interaction engine
interactionEngine.addInteractionManager(hoverManger);

// In this example, we mark the various outputs of a session as hoverable
for (let  o in session.outputs)
  session.outputs[o].node!.data.push(new InteractionData({ hover: true }));

// event listener for HOVER_ON
addListener(EVENTTYPE.INTERACTION.HOVER_ON, (e) => {
    const hoverEvent = <IHoverEvent>e;
});

// event listener for HOVER_OFF
addListener(EVENTTYPE.INTERACTION.HOVER_OFF, (e) => {
    const hoverEvent = <IHoverEvent>e;
});
```

Via the shown event listeners in the code example actions can be triggered. A note of caution, if a lot of objects are hoverable make sure that you do not trigger any actions that take a long time in the events. This might affect the performance of your application. Additional examples can be viewed on our [help desk](https://help.shapediver.com/doc/interactions-part-1#Interactions-Part1-Hovering).

### Dragging

To be able to drag objects in the scene, a [DragManager](https://viewer.shapediver.com/v3/latest/api/features/interaction/classes/DragManager.html) has to be created. Additionally, the nodes that should be draggable have to be marked as such. 

For dragging, you also have to define how you want things to be dragged through the scene. There are various options for this which are all explained in our [help desk section](https://help.shapediver.com/doc/interactions-part-2#Interactions-Part2-Dragging). In this example, we only add a camera plane constraint.

```typescript  
import { addListener, EVENTTYPE, IDragEvent, MaterialStandardData } from "@shapediver/viewer";
import { InteractionData, InteractionEngine, DragManager } from "@shapediver/viewer.features.interaction";

// Create the drag manager and add it
const dragManger = new DragManager();
// Define a material that should be applied on drag. If no material is defined, the material will not change
dragManger.effectMaterial = new MaterialStandardData({ color: "#ffff00" });
// Add the drag manager to the interaction engine
interactionEngine.addInteractionManager(dragManger);

// add a camera plane constraint
const cameraPlaneConstraint = new CameraPlaneConstraint();
// use the token to remove the constraint again (removeDragConstraint)
const token = dragManager.addDragConstraint(cameraPlaneConstraint);

// In this example, we mark the various outputs of a session as draggable
for (let  o in session.outputs)
  session.outputs[o].node!.data.push(new InteractionData({ drag: true }));

// event listener for DRAG_START 
addListener(EVENTTYPE.INTERACTION.DRAG_START, (e) => {
    const dragEvent = <IDragEvent>e;
});

// event listener for DRAG_MOVE
addListener(EVENTTYPE.INTERACTION.DRAG_MOVE, (e) => {
    const dragEvent = <IDragEvent>e;
});

// event listener for DRAG_END
addListener(EVENTTYPE.INTERACTION.DRAG_END, (e) => {
    const dragEvent = <IDragEvent>e;
});
```

Via the shown event listeners in the code example actions can be triggered. A note of caution, make sure that you do not trigger any actions that take a long time in the `DRAG_MOVE` events. These events are fired all the time and might affect the performance of your application. Additional examples can be viewed on our [help desk](https://help.shapediver.com/doc/interactions-part-2#Interactions-Part2-Dragging).


