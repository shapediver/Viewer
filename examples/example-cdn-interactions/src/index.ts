import { mat4, quat, vec3 } from "gl-matrix";

const SDV = (<any>window).SDV;
const SDVInteractions = (<any>window).SDVInteractions;

(async () => {
    const viewer = await SDV.api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    const session = await SDV.api.createSession({ 
        ticket: 'd7275c4a686c2df9ba75ca6c7e05dc674ae60912c1aa75e478f273dab718cd20b2a269073e03b5810daaf461c82ad990b176d3071776ec0f80fa034bb1e2bc6ee6c99fc82764ad55157bcba7dd1856b18eb0390e2b83c201be16e51de33c356fc6ad73cb3100eeecd3fc48ea5405e7f1c2272088d7-ff5d231fc13c2098c7ed85e51331760e',
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