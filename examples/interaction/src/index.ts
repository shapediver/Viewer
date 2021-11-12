import 'reflect-metadata'

import { api } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'
import { InteractionEngine, HoverManager, DragManager, PointConstraint, InteractionData, LineConstraint, PlaneConstraint, IDragEvent } from '@shapediver/viewer.features.interaction'
import { mat4, quat, vec3 } from 'gl-matrix';
(<any>window).api = SDV.api;

// monitor if the mouse is up or down
let mouseDown = 0;
document.body.onmousedown = () => {
    ++mouseDown;
};
document.body.onmouseup = () => {
    --mouseDown;
};

let touchDown = 0;
document.body.ontouchstart = () => {
    ++touchDown;
};
document.body.ontouchend = () => {
    --touchDown;
};


let session: SDV.ISession;
let viewer: SDV.IStandardViewer;

let dragManager: DragManager;
let hoverManager: HoverManager;

type ShelfDefinition = {
    matrices: {
        transformation: mat4,
        rotation: mat4,
        translation: mat4
    }[],
    output?: SDV.IOutput,
    parameter?: SDV.IParameter<string>,
    counter: number,
    snapPoints: { point: vec3, radius: number, rotation: {axis: vec3, angle: number}}[],
    snapLines: { point1: vec3, point2: vec3, radius: number, rotation: {axis: vec3, angle: number}}[],
}

let bottomShelf: ShelfDefinition = {
    matrices: [],
    counter: 0,
    snapPoints: [
        { point: vec3.fromValues(-2.2, 0, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(-1.6, 0, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(-1.0, 0, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(-0.4, 0, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(0.2, 0, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(0.8, 0, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(1.4, 0, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(2.0, 0, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        
        { point: vec3.fromValues(-2.5, -0.3, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -0.9, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -1.5, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -2.1, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -2.7, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -3.3, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -3.9, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -4.5, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
    ],
    snapLines: [
        { point1: vec3.fromValues(-2.2, -5, 0), point2: vec3.fromValues(2.2, -5, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI } },
        { point1: vec3.fromValues(2.5, -0.3, 0), point2: vec3.fromValues(2.5, -4.7, 0), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: -Math.PI / 2 }},
    ]
};
let topShelf: ShelfDefinition = {
    matrices: [],
    counter: 0,
    snapPoints: [
        { point: vec3.fromValues(-2.2, 0, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(-1.6, 0, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(-1.0, 0, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(-0.4, 0, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(0.2, 0, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(0.8, 0, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(1.4, 0, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        { point: vec3.fromValues(2.0, 0, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: 0 }},
        
        { point: vec3.fromValues(-2.5, -0.3, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -0.9, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -1.5, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -2.1, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -2.7, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -3.3, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -3.9, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
        { point: vec3.fromValues(-2.5, -4.5, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }},
    ],
    snapLines: [
        { point1: vec3.fromValues(-2.2, -5, 1.5), point2: vec3.fromValues(2.2, -5, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: Math.PI } },
        { point1: vec3.fromValues(2.5, -0.3, 1.5), point2: vec3.fromValues(2.5, -4.7, 1.5), radius: 0.5, rotation: { axis: vec3.fromValues(0, 0, 1), angle: -Math.PI / 2 }},
    ]
};

const dragLineConstraintsIDs: string[] = [];
const activateInteractionsToken: {
    start: string, 
    end: string
} = {
    start: '',
    end: ''
}


const updateParameter = async (def: ShelfDefinition) => {
    // convert the matrices into the desired format
    const stringMatrixArray: string[] = [];

    def.matrices.forEach(m => stringMatrixArray.push('[' + m.transformation.toString() + ']'));
    def.parameter!.value = stringMatrixArray.length === 0 ? '{}' : `{matrices:[${stringMatrixArray.join()}]}`;
    await session.customize();
};

const updateInteractions = (interactionTypes: { [key: string]: boolean; }) => {
    const shelves = [topShelf, bottomShelf];
    for(let i = 0; i < shelves.length; i++) {
        for(let j = 0; j < shelves[i].counter; j++) {
            const node = api.sceneTree.getNodeAtPath('root.KitchenConfigurator.' + shelves[i].output!.id + '.scene_undefined.TransformZUpToYUp.no_transformations.mesh_0.primitive_' + j)!;
            if(!node) continue;
    
            // we enable dragging for this node
            const data = new InteractionData(interactionTypes);
                
            // we set an anchor at the bottom back middle of the BB
            const bb = node.boundingBox.clone().applyMatrix(mat4.invert(mat4.create(), shelves[i].matrices[j].rotation))
            const position = vec3.fromValues((bb.max[0] + bb.min[0])/2, bb.max[1], bb.min[2]);

            vec3.transformMat4(position, position, shelves[i].matrices[j].rotation)

            const angle = quat.getAngle(quat.setAxisAngle(quat.create(), vec3.fromValues(0,0,1), 0), mat4.getRotation(quat.create(), shelves[i].matrices[j].rotation))

            data.dragAnchors.push({ position, rotation: {
                axis: vec3.fromValues(0,0,1),
                angle 
            } });
            
            // remove old data
            const old = node.data.filter(d => d instanceof InteractionData);
            old.forEach(dTR => node.data.splice(node.data.indexOf(dTR), 1));
    
            // we add the data and make the node invisible for now
            node.data.push(data);
        }
    }
}

/**
 * Activate the standard interactions
 */
const activateInteractions = () => {
    deactivateInteractions();
    updateInteractions({drag: true, hover: true});

    activateInteractionsToken.start = SDV.api.addListener(SDV.EVENTTYPE.INTERACTION.DRAG_START, async (e) => {
        const dragEvent = <IDragEvent>e;

        dragLineConstraintsIDs.forEach(d => dragManager.removeDragConstraint(d))

        // we search for the right definition and add snap lines
        const shelves = [topShelf, bottomShelf];
        let def: ShelfDefinition;
        for(let i = 0; i < shelves.length; i++) {
            if(dragEvent.node.getPath().includes(shelves[i].output!.id)) {
                def = shelves[i];
                def.snapPoints.forEach(element => dragLineConstraintsIDs.push(dragManager.addDragConstraint(new PointConstraint(element.point, element.radius, element.rotation))));
                def.snapLines.forEach(element => dragLineConstraintsIDs.push(dragManager.addDragConstraint(new LineConstraint(element.point1, element.point2, element.radius, element.rotation))));
                break;
            }
        }

        // once the movement has ended, we update the matrix in the parameter definition
        activateInteractionsToken.end = SDV.api.addListener(SDV.EVENTTYPE.INTERACTION.DRAG_END, async (e) => {
            dragLineConstraintsIDs.forEach(d => dragManager.removeDragConstraint(d));
            const dragEvent = <IDragEvent>e;
            // apply the matrix to the dragged item
            const number = dragEvent.node.getPath().substring(dragEvent.node.getPath().lastIndexOf('_') + 1, dragEvent.node.getPath().length);
            mat4.multiply(def.matrices[+number].translation, def.matrices[+number].translation, mat4.fromTranslation(mat4.create(), mat4.getTranslation(vec3.create(), dragEvent.matrix)));
            mat4.multiply(def.matrices[+number].rotation, def.matrices[+number].rotation, mat4.fromQuat(mat4.create(), mat4.getRotation(quat.create(), dragEvent.matrix)));
            mat4.multiply(def.matrices[+number].transformation, def.matrices[+number].transformation, mat4.transpose(mat4.create(), (<any>e).matrix));
            await updateParameter(def);
            SDV.api.removeListener(activateInteractionsToken.end); 
            activateInteractions();
        })

        SDV.api.removeListener(activateInteractionsToken.start); 
    })
}

/**
 * Deactivate the standard interactions
 */
const deactivateInteractions = () => {
    dragLineConstraintsIDs.forEach(d => dragManager.removeDragConstraint(d))
    SDV.api.removeListener(activateInteractionsToken.start); 
    SDV.api.removeListener(activateInteractionsToken.end); 

    updateInteractions({drag: false, hover: false});
}

/**
 * This is the command that executes the external dragging
 * 
 * @param def 
 */
const addShelf = async (def: ShelfDefinition) => {
    deactivateInteractions();

    // create snap points for this shelf
    const dragConstraintsIDs: string[] = [];
    def.snapPoints.forEach(element => dragConstraintsIDs.push(dragManager.addDragConstraint(new PointConstraint(element.point, element.radius, element.rotation))));
    def.snapLines.forEach(element => dragConstraintsIDs.push(dragManager.addDragConstraint(new LineConstraint(element.point1, element.point2, element.radius, element.rotation))));

    // once the new node is created, this is how we find it
    const newNode = api.sceneTree.getNodeAtPath('root.KitchenConfigurator.' + def.output!.id + '.scene_undefined.TransformZUpToYUp.no_transformations.mesh_0.primitive_' + (def.counter-1))!;

    // we enable dragging for this node
    const data = new InteractionData({drag: true});

    // we set an anchor at the bottom back middle of the BB
    data.dragAnchors.push({ 
        position: vec3.fromValues((newNode.boundingBox.max[0] + newNode.boundingBox.min[0])/2, newNode.boundingBox.max[1], newNode.boundingBox.min[2])
    });
    
    // we add the data and make the node invisible for now
    newNode.data.push(data);
    newNode!.visible = false;
    newNode.updateVersion();

    // we tell the dragManager to drag this node
    dragManager.setNode(newNode!);

    // some things have to be done on the first move in the viewer
    const tokenMove = SDV.api.addListener(SDV.EVENTTYPE.INTERACTION.DRAG_MOVE, async (e) => {
        if(!mouseDown && !touchDown ) {
            // the mouse was released before entering the viewer
            dragManager.removeNode();
            activateInteractions();
        } else {
            // the viewer was entered, make it visible
            newNode!.visible = true;
            viewer.updateNode(newNode);
        }
        SDV.api.removeListener(tokenMove); 
    })

    // once the movement has ended, we update the matrix in the parameter definition
    const tokenEnd = SDV.api.addListener(SDV.EVENTTYPE.INTERACTION.DRAG_END, async (e) => {
        const dragEvent = <IDragEvent>e;
        dragConstraintsIDs.forEach(d => dragManager.removeDragConstraint(d))        
        def.matrices[def.matrices.length-1].translation = mat4.fromTranslation(mat4.create(), mat4.getTranslation(vec3.create(), dragEvent.matrix));
        def.matrices[def.matrices.length-1].rotation = mat4.fromQuat(mat4.create(), mat4.getRotation(quat.create(), dragEvent.matrix));
        mat4.multiply(def.matrices[def.matrices.length-1].transformation, def.matrices[def.matrices.length-1].transformation, mat4.transpose(mat4.create(), dragEvent.matrix));
        
        // add a new matrix and update the parameter
        def.matrices.push({
            transformation: mat4.create(),
            rotation: mat4.create(),
            translation: mat4.create(),
        });
        def.counter++;

        await updateParameter(def);

        const node = api.sceneTree.getNodeAtPath('root.KitchenConfigurator.' + def.output!.id + '.scene_undefined.TransformZUpToYUp.no_transformations.mesh_0.primitive_' + (def.counter - 1))!;
        node.visible = false;
        
        SDV.api.removeListener(tokenEnd); 
        activateInteractions();
    })
};

(<any>window).addTopShelf = async () => {
    addShelf(topShelf);
};

(<any>window).addBottomShelf = async () => {
    addShelf(bottomShelf);
};

(async () => {
    viewer = <SDV.IStandardViewer>await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer', visibility: SDV.VISIBILITYMODE.MANUAL });
    session = await api.createSession({ 
        ticket: '295224def826be64146bccfdb6eea2e054bde5822ba748273c019a5bfc2b2c3a492aef28356cb4c4f8e71687d63443148b2690e41f5174378ae8c5e6ff0e6a4e80b419155d0704f688859bbfa90b1fcb5ce3a2728d1e36e1e639fd81e10c4022b5ec6d285a11c3-44bda6b73439a7d573d2c1bc6d27bb6c', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession'
    });

    // TODO: replace once Alex fixed the bug regarding hidden characters in names
    // normally we could just call `session.getOutputByName()`
    const bottomShelfName = 'bottomShelf';
    const topShelfName = 'topShelf';
    for (let outputId in session.outputs) {
        const outputName = session.outputs[outputId].name.replace(/[\u200B-\u200D\uFEFF]/g, '');
        if (topShelfName === outputName) 
            topShelf.output = session.outputs[outputId];
        if (bottomShelfName === outputName) 
            bottomShelf.output = session.outputs[outputId];
    }
    
    bottomShelf.parameter = session.getParameterByName('bottomShelfMatrices')[0];
    topShelf.parameter = session.getParameterByName('topShelfMatrices')[0];

    bottomShelf.matrices.push({
        transformation: mat4.create(),
        rotation: mat4.create(),
        translation: mat4.create(),
    });
    bottomShelf.counter++;

    topShelf.matrices.push({
        transformation: mat4.create(),
        rotation: mat4.create(),
        translation: mat4.create(),
    });
    topShelf.counter++;

    
    await updateParameter(topShelf);
    await updateParameter(bottomShelf);
    const shelves = [topShelf, bottomShelf];

    for(let i = 0; i < shelves.length; i++) {
            const node = api.sceneTree.getNodeAtPath('root.KitchenConfigurator.' + shelves[i].output!.id + '.scene_undefined.TransformZUpToYUp.no_transformations.mesh_0.primitive_' + (shelves[i].counter - 1))!;
            if(!node) continue;
            node.visible = false;
    }

    viewer.show = true;

    // create the interaction engine and the managers
    const interactionEngine = new InteractionEngine(viewer);
    hoverManager = new HoverManager();
    hoverManager.effectMaterial = new SDV.MaterialData({ color: '#dddddd', opacity: 0.25, alphaMode: SDV.MATERIAL_ALPHA.BLEND })
    interactionEngine.addInteractionManager(hoverManager);
    dragManager = new DragManager();
    interactionEngine.addInteractionManager(dragManager);

    // create a default plane where objects are dragged
    dragManager.addDragConstraint(new PlaneConstraint(vec3.fromValues(0, -1, 0), vec3.fromValues(0, -0.3, 0)))
    dragManager.addDragConstraint(new PlaneConstraint(vec3.fromValues(1, 0, 0), vec3.fromValues(-2.5, 0, 0), { axis: vec3.fromValues(0, 0, 1), angle: Math.PI / 2 }))
    dragManager.addDragConstraint(new PlaneConstraint(vec3.fromValues(0, 0, 1), vec3.fromValues(0, 0, 0)))
})();