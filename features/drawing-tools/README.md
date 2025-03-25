# `@shapediver/viewer.features.drawing-tools`

This is the npm package for the ShapeDiver Viewer Drawing Tools feature. Please have a look at our [help desk section](https://help.shapediver.com/doc/drawing-tools) for this feature.

For more information on ShapeDiver, please visit our [homepage](https://shapediver.com/). If you need help, have a look at our [help desk](https://help.shapediver.com/doc/Viewer.1836580882.html).

## Installation

```
npm install --save @shapediver/viewer.features.drawing-tools
```

## Usage

As this is an additional package to the `@shapediver/viewer` package, we omit the initial setup. Please have a look [here](https://viewer.shapediver.com/v3/latest/api/index.html).

### Initialization

The drawing tools can be initialized with the function `createDrawingTools`, create a new instance of the drawing tools. The following input can be provided to the function:

- viewport: the viewport API in which the drawing tools should be created
- callbacks: the `onUpdate` and `onCancel` callbacks are called by the drawing tools whenever the drawing tools are either updated or cancelled
- settings: the settings with which the Drawing Tools are initialized (see below)

### Drawing Tools Settings

The settings that can be provided to the drawing tools are separated into four sections:

#### geometry

The geometry settings of the drawing tool.
Here you can define the points, the mode and specific details of the geometry.

| Property           | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| points             | The points that are used when starting the drawing tool. The points are defined as an array of arrays, where each array contains the x, y and z coordinates of the point. If the mode is set to 'lines', the points are connected in the order they are defined. If the mode is set to 'points', the points are not connected.                                                                                                                                                                  |
| mode               | The mode of the geometry. If the mode is set to 'lines', the points are connected in the order they are defined. If the mode is set to 'points', the points are not connected.                                                                                                                                                                                                                                                                                                                  |
| minPoints          | The minimum amount of points, if undefined, the geometry is not restricted. This value is checked whenever the user tries to update or finish the drawing tool.                                                                                                                                                                                                                                                                                                                                 |
| maxPoints          | The maximum amount of points, if undefined, the geometry is not restricted. This value is checked whenever the user tries to update or finish the drawing tool.                                                                                                                                                                                                                                                                                                                                 |
| strictMinMaxPoints | If the number of points is strictly checked during the drawing process. If this setting is set to true, once the minimum or maximum amount of points is reached, the user cannot add or remove points that would violate the restriction. If this setting is set to false, the user can add or remove points even if the minimum or maximum amount of points is exceeded temporarily. Once the user tries to update or finish the drawing tool, the amount of points is checked in either case. |
| close              | If the mode is set to 'lines', if it is a closed line or not. If the mode is set to 'points', this setting is ignored. A line can be closed by connecting the last point with the first point.                                                                                                                                                                                                                                                                                                  |
| autoClose          | If the mode is set to 'lines', if the line is automatically closed. If the mode is set to 'points', this setting is ignored. The first and last point are always connected if the line is automatically closed.                                                                                                                                                                                                                                                                                 |

#### restrictions

The restrictions of the drawing tool.

Here you can define the restrictions that are used when interacting with the drawing tool.
At least one restriction is required, the plane and axis restrictions are added by default if no restrictions are defined.

Each restriction is defined by a type and the corresponding properties of that restriction. For further details on this please see the [API documentation](https://viewer.shapediver.com/v3/latest/api/features/drawing-tools/index.html).

#### visualization

The visualization settings of the drawing tool.
Here you can define the visualization of the drawing tool.

| Property                     | Description                                                                                                                                                                                           |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| distanceMultiplicationFactor | The multiplication factor of the point size when interactions are performed. If the factor is set to 2, the point size is doubled when interacting.                                                   |
| pointLabels                  | If the point labels are shown. The point labels display the position of the points.                                                                                                                   |
| distanceLabels               | If the distance labels are shown. The distance labels display the distance between the points.                                                                                                        |
| points                       | The material properties of the points. For more details please have a look at the [API documentation](https://viewer.shapediver.com/v3/latest/api/interfaces/IMaterialMultiPointDataProperties.html). |
| lines                        | The material properties of the lines. For more details please have a look at the [API documentation](https://viewer.shapediver.com/v3/latest/api/interfaces/IMaterialBasicLineData.html).             |

#### controls

The control settings of the drawing tool.
Here you can define which keys are used for the different actions of the drawing tool.

| Property | Description                                     |
| :------- | :---------------------------------------------- |
| insert   | The key that is used to insert a point.         |
| delete   | The key that is used to delete a point.         |
| confirm  | The key that is used to confirm actions.        |
| cancel   | The key that is used to cancel drawing.         |
| undo     | The keys that are used to undo the last action. |
| redo     | The keys that are used to redo the last action. |

#### general

The general settings of the drawing tool.
Here you can define general settings of the drawing tool.

| Property      | Description                                                               |
| :------------ | :------------------------------------------------------------------------ |
| autoStart     | If the drawing tool is started automatically when no points are defined.  |
| autoUpdate    | If the drawing tool is updated automatically when the drawing is changed. |
| closeOnUpdate | If the drawing tool is closed when the drawing is updated.                |
| displayUnit   | The unit that will be displayed in the distance and point labels.         |

## Code Example

```typescript
import {
    addListener,
    createSession,
    createViewport,
    EVENTTYPE_DRAWING_TOOLS,
    IEvent
    } from '@shapediver/viewer';
import {
    createDrawingTools,
    IDrawingToolsApi,
    IDrawingToolsEvent,
    PointsData,
    Settings
    } from '@shapediver/viewer.features.drawing-tools';

(async () => {
    // create a viewport
    const viewport = await createViewport({
        canvas: document.getElementById('canvas') as HTMLCanvasElement
    });
    // create a session
    const session = await createSession({
        ticket: 'YOUR_TICKET',
        modelViewUrl: 'YOUR_MODEL_VIEW_URL'
    });

    /**
     * Define the settings you want to use for the drawing tools
     */
    const customizationProperties: Settings = {

    };

    /**
     * Callback function for the drawing tool
     * executed when the drawing tool is updated
     *
     * @param geometryData
     */
    const onUpdate = async (pointsData: PointsData) => {
        console.log('Drawing tools updated', pointsData);
    };

    /**
     * Callback function for the drawing tool
     * executed when the drawing tool is cancelled
     */
    const onCancel = () => {
        console.log('Drawing tools cancelled');
    };

    /**
     * Add an event when the condition for the minimum number of points is not met.
     */
    addListener(EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS, (event: IEvent) => {
        console.log((event as IDrawingToolsEvent).message);
    });

    /**
     * Add an event when the maximum number of points has been exceeded.
     */
    addListener(EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS, (event: IEvent) => {
        console.log((event as IDrawingToolsEvent).message);
    });

    const drawingToolsApi: IDrawingToolsApi | undefined = createDrawingTools(viewport, { onUpdate, onCancel }, customizationProperties);

```
