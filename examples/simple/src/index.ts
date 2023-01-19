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
    PlaneConstraint,
    IDragEvent
} from "@shapediver/viewer.features.interaction";
import { createMenu, outputNames, setOutputRestrictions } from "./utilities";

import * as SDV from "@shapediver/viewer"
import { updateTextureDraggingData, texturePositionAdjustementCallback } from "./utilitiesTextureDragging";
import { holePositionAdjustementCallback, updateHoleDraggingData } from "./utilitiesHoleDragging";

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
    ticket = ticket === "null" ? "ac41cf8b7d0d526e03ee87a4147b60b35e3801b36a31004f5cc890d9b670ca41f25f3197206226f50cbd9ef6bbe188c7caf8124c3a3fc9dd7419b39c4dd52b434768feeacf37db9e47c4cad2cac0822bdd3eaae1a939994acaded9c3344d6cab98b8ee2e22349b-10ce07eaa74f54503d3c0a672255367a" : ticket;

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
     *  - We create a menu to be able to adjust the parameters.
     */

    // read out the two parameters that are going to be used in this example
    const texturePositionParameter = session.getParameterByName('texture_position')[0];
    const holePositionParameter = session.getParameterByName('hole_position')[0];

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

    // create a menu that makes the adjustment of the texture rotation, texture scale and texture import possible
    createMenu(session)

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

    // here we add the InteractionData to the texture output node
    // we use the updateCallback for this to always add it again once it has been updated
    // as there was previously already an updateCallback set in setOutputRestrictions, we call it again here to keep that behavior as well
    const interactionDataTexture = new InteractionData({ drag: true });
    const originalTextureUpdateCallback = outputs["texture"].updateCallback;
    outputs["texture"].updateCallback = (newNode?: ITreeNode, oldNode?: ITreeNode) => {
        if(originalTextureUpdateCallback)
            originalTextureUpdateCallback(newNode, oldNode)
        if (newNode) 
            newNode.data.push(interactionDataTexture);
    };
    // we call it once in the beginning to initially assign the InteractionData
    outputs["texture"].updateCallback!(outputs["texture"].node);

    // here we add the InteractionData to the hole output node
    // we use the updateCallback for this to always add it again once it has been updated
    // as there was previously already an updateCallback set in setOutputRestrictions, we call it again here to keep that behavior as well
    const interactionDataHole = new InteractionData({ drag: true });
    const originalHoleUpdateCallback = outputs["hole"].updateCallback;
    outputs["hole"].updateCallback = (newNode?: ITreeNode, oldNode?: ITreeNode) => {
        if(originalHoleUpdateCallback)
            originalHoleUpdateCallback(newNode, oldNode)
        if (newNode) 
            newNode.data.push(interactionDataHole);
    };
    // we call it once in the beginning to initially assign the InteractionData
    outputs["hole"].updateCallback!(outputs["hole"].node);

    /**
     * INTERACTION EVENT LISTENERS
     * 
     * In this step we create the event listeners for the interactions.
     */
    
    // the DRAG_START listener
    const dragStartListenerToken = addListener(EVENTTYPE_INTERACTION.DRAG_START, (e: IEvent) => {
        const outputData = (e as IDragEvent).node.data.find(d => d instanceof SDV.OutputApiData);
        if((outputData as SDV.OutputApiData).api.id === outputs["texture"].id) {
            // whenever the dragging start, adjust the bounding boxes with the current values
            // these bounding boxes are used to check if the texture is within the specified area
            updateTextureDraggingData(outputs);
        } else if((outputData as SDV.OutputApiData).api.id === outputs["hole"].id){
            // whenever the dragging start, adjust the bounding box and the boundary points with the current values
            // these values are used to check if the hole is within the specified area
            updateHoleDraggingData(outputs);
        }
    });

    // the DRAG_MOVE listener
    const dragMoveListenerToken = addListener(EVENTTYPE_INTERACTION.DRAG_MOVE, (e: IEvent) => {
        const outputData = (e as IDragEvent).node.data.find(d => d instanceof SDV.OutputApiData);
        if((outputData as SDV.OutputApiData).api.id === outputs["texture"].id) {
            // whenever the texture was moved, see if it is within the specified area, and if not, restrict it
            texturePositionAdjustementCallback(e);
        } else if((outputData as SDV.OutputApiData).api.id === outputs["hole"].id){
            // whenever the hole was moved, see if it is within the specified area, and if not, restrict it
            holePositionAdjustementCallback(e);
        }
    });

    // the DRAG_END listener
    const dragEndListenerToken = addListener(EVENTTYPE_INTERACTION.DRAG_END, async (e: IEvent) => {
        const outputData = (e as IDragEvent).node.data.find(d => d instanceof SDV.OutputApiData);
        if((outputData as SDV.OutputApiData).api.id === outputs["texture"].id) {
            // when the dragging ends, restrict the texture position for a last time
            const p = texturePositionAdjustementCallback(e);
            // apply the position to the position parameters and customize the scene
            texturePositionParameter.value = `[${p[0]}, ${p[2]}]`;
            await session.customize();
        } else if((outputData as SDV.OutputApiData).api.id === outputs["hole"].id){
            // when the dragging ends, restrict the hole position for a last time
            const p = holePositionAdjustementCallback(e);
            // apply the position to the position parameters and customize the scene
            holePositionParameter.value = `[${p[0]}, ${p[2]}]`;
            await session.customize();
        }

    });

    // once everything has been initialize, show the viewports
    textureViewport.show = true;
    ringViewport.show = true;
})();
