import {
    createViewport,
    createSession,
    IOutputApi,
    ITreeNode,
    addListener,
    EVENTTYPE_INTERACTION,
    IEvent,
    ORTHOGRAPHIC_CAMERA_DIRECTION,
    VISIBILITY_MODE
} from "@shapediver/viewer";
import {
    InteractionEngine,
    DragManager,
    InteractionData,
    PlaneConstraint
} from "@shapediver/viewer.features.interaction";
import { createMenu, outputNames, positionAdjustementCallback, ringBoundaryBB, setOutputRestrictions, textureBoundaryBB, updateBB } from "./utilities";

import * as SDV from "@shapediver/viewer"

(<any>window).SDV = SDV;

(async () => {
    /**
     * INITIAL VIEWPORT AND SESSION SETUP
     * 
     * First we create two viewports, one for displaying the texture and the boundary, and one for displaying the ring.
     * 
     * Then we create the session with either a ticket that was provided via a query parameter (?ticket=THE_TICKET) or a ticket that is hard coded.
     */

    // create the texture viewport, this one will be used to show the texture and boundary
    const textureViewport = await createViewport({
        canvas: document.getElementById("canvas1") as HTMLCanvasElement,
        id: "textureViewport",
        visibility: VISIBILITY_MODE.MANUAL
    });

    // create the ring viewport, this one will be used to show the ring
    const ringViewport = await createViewport({
        canvas: document.getElementById("canvas2") as HTMLCanvasElement,
        id: "ringViewport",
        visibility: VISIBILITY_MODE.MANUAL
    });

    // read out the query parameter "ticket" if it exists, use it as a ticket
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(<string>prop),
    });
    let ticket = decodeURIComponent((<any>params).ticket);
    ticket = ticket === "null" ? "59fd4e1c733f89001a2b432cdaf6544a5fa5092ab6d8e1273deb811ce59e03414edf41de717c038657e9d0ec0cc8d93c270e7f4abe9607ff3cec64edfaab511276d5cd44feb5c4247e14f1d3d29991138a2f10f8e276253842bb8fac50b62c2f30971c3acbd04c-c6f1337fa6d0c30bb3dd769aa4a0b095" : ticket;

    // create the session
    const session = await createSession({
        ticket,
        modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
        id: "mySession"
    });

    /**
     * OUTPUT ADJUSTEMENT AND MENU CREATION
     * 
     * In this step we store values for convience in different data structures:
     *  - We read the parameters into variables.
     *  - We store all needed outputs into a dictionary.
     *  - We set the viewport restrictions for the outputs.
     *  - We create a menu to be able to adjust the texture_rotation and TS (texture scale).
     */

    // read out the two parameters that are going to be used in this example
    const textureRotationParameter = session.getParameterByName('texture_rotation')[0];
    const textureMoveParameter = session.getParameterByName('texture_move')[0];
    const textureScaleParameter = session.getParameterByName('TS')[0];

    // storage of the outputs as defined by Edwin
    // see the list of outputs in the utilities file the variable "outputNames"
    let outputs: {
        [key: string]: IOutputApi;
    } = {};

    // store all non-material outputs (the ones that don't have the format "material" in their format array)
    outputNames.forEach(
        (n) =>
        (outputs[n] = session
            .getOutputByName(n)
            .find((o) => !o.format.includes("material"))!)
    );

    // set the output restrictions for each viewport so that the texture and boundary are only visible in one
    // and the ring with the profile in the other
    setOutputRestrictions(outputs, textureViewport, ringViewport);

    // create a menu that makes the adjustment of the texture rotation and texture scale possible
    createMenu(session, textureRotationParameter, textureScaleParameter, textureMoveParameter)

    /**
     * INTERACTION SETUP
     * 
     * In the textureViewport we create an orthographic camera to make the interaction easier.
     * 
     * We create the InteractionEngine, a DragManager and a Plane contraint to only be able to drag the texture on that plane.
     * We then add the InteractionData to the texture output to make it draggable.
     */

    // change the camera of the texture viewport to an orthographic one
    const camera = textureViewport.createOrthographicCamera();
    camera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT;
    textureViewport.assignCamera(camera.id);

    // create the interactionEngine and provide it the texture viewport object
    const interactionEngine = new InteractionEngine(textureViewport);

    // create the dragManager and add it
    const dragManager = new DragManager();
    interactionEngine.addInteractionManager(dragManager);

    // add a plane constraint
    const planeConstraint = new PlaneConstraint([0, 1, 0], [0, 0, 0]);
    // use the token to remove the constraint again (removeDragConstraint)
    const token = dragManager.addDragConstraint(planeConstraint);

    // here we add the InteractionData to the 2d_texture output node
    // we use the updateCallback for this to always add it again once it has been updated
    // as there was previously already an updateCallback set in setOutputRestrictions, we call it again here to keep that behavior as well
    const interactionData = new InteractionData({ drag: true });
    const originalUpdateCallback = outputs["2d_texture"].updateCallback;
    outputs["2d_texture"].updateCallback = (newNode?: ITreeNode, oldNode?: ITreeNode) => {
        if(originalUpdateCallback)
            originalUpdateCallback(newNode, oldNode)
        if (newNode) 
            newNode.data.push(interactionData);
    };
    // we call it once in the beginning to initially assign the InteractionData
    outputs["2d_texture"].updateCallback!(outputs["2d_texture"].node);

    /**
     * INTERACTION EVENT LISTENERS
     * 
     * In this step we create the event listeners for the interactions.
     */
    
    // the DRAG_START listener
    const dragStartListenerToken = addListener(EVENTTYPE_INTERACTION.DRAG_START, (e: IEvent) => {
        // whenever the dragging start, adjust the bounding boxes with the current values
        // these bounding boxes are used to check if the texture is within the specified area
        updateBB(outputs);
    });

    // the DRAG_MOVE listener
    const dragMoveListenerToken = addListener(EVENTTYPE_INTERACTION.DRAG_MOVE, (e: IEvent) => {
        // whenever the texture was move, see if it is within the specified area, and if not, restrict it
        positionAdjustementCallback(e);
    });

    // the DRAG_END listener
    const dragEndListenerToken = addListener(EVENTTYPE_INTERACTION.DRAG_END, async (e: IEvent) => {
        // when the dragging ends, restrict the texture position for a last time
        const matrix = positionAdjustementCallback(e);
        // create a BB that is transformed by the current dragging
        const draggedTextureBoundaryBB = textureBoundaryBB
            .clone()
            .applyMatrix(matrix);
        // read out the center of the dragged texture BB
        const center = draggedTextureBoundaryBB.boundingSphere.center;
        // apply the position to the move parameters and customize the scene
        textureMoveParameter.value = `[${center[0]}, ${center[2]}]`;
        await session.customize();
    });

    // once everything has been initialize, show the viewports
    textureViewport.show = true;
    ringViewport.show = true;
})();
