import { mat4, quat, vec3 } from "gl-matrix";

const SDV = (<any>window).SDV;
const SDVInteractions = (<any>window).SDVInteractions;

(async () => {
    const viewer = await SDV.api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    const session = await SDV.api.createSession({ 
        ticket: '5dbb5117b630fb83a8056f06ee719f570a904be69ac45152822c327f33d21483a8dae9e3122ae17c992ea6b3e2b65af09ac9871dd83a263ef488e58b2c2260a07899418548bd4a8dcf1cff3ca33954c9e4c0fe60118f730d03c56b7e598eab908b34e16ba8625d-b5ac96869614191d8ada6725aba8fba6', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession'
    });

    for(let i = 0; i < session.node.children.length; i++) {
        const child = session.node.children[i];
        child.data.push(new SDVInteractions.InteractionData({hover: true, select: true, drag: true}));
    }

    // create the interaction engine and the managers
    const interactionEngine = new SDVInteractions.InteractionEngine(viewer);
    const hoverManager = new SDVInteractions.HoverManager();
    hoverManager.effectMaterial = new SDV.MaterialData({ color: '#dddddd', opacity: 0.25, alphaMode: SDV.MATERIAL_ALPHA.BLEND })
    interactionEngine.addInteractionManager(hoverManager);
    const dragManager = new SDVInteractions.DragManager();
    interactionEngine.addInteractionManager(dragManager);

    // create a default plane where objects are dragged
    dragManager.addDragConstraint(new SDVInteractions.PlaneConstraint(vec3.fromValues(0, -1, 0), vec3.fromValues(0, -0.3, 0)))
    dragManager.addDragConstraint(new SDVInteractions.PlaneConstraint(vec3.fromValues(1, 0, 0), vec3.fromValues(-2.5, 0, 0), { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }))
    dragManager.addDragConstraint(new SDVInteractions.PlaneConstraint(vec3.fromValues(0, 0, 1), vec3.fromValues(0, 0, 0)))
})();