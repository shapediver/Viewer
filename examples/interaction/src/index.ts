import 'reflect-metadata'

import { api } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'
import {  HoverManager, DragManager, PointConstraint, InteractionData, LineConstraint, PlaneConstraint, IDragEvent } from '@shapediver/viewer.features.interaction'
import { createInteractionEngine } from '@shapediver/viewer.features.interaction';
import { mat4, vec3 } from 'gl-matrix';
(<any>window).api = SDV.api;

// monitor if the mouse is up or down
let mouseDown = 0;
document.body.onmousedown = () => {
    ++mouseDown;
};
document.body.onmouseup = () => {
    --mouseDown;
};


let session: SDV.ISession;
let viewer: SDV.IStandardViewer;

let dragManager: DragManager;
let hoverManager: HoverManager;

type ShelfDefinition = {
    matrices: mat4[],
    output?: SDV.IOutput,
    parameter?: SDV.IParameter<string>,
    counter: number,
    snapPoints: { point: vec3, radius: number}[],
    snapLines: { point1: vec3, point2: vec3, radius: number}[],
}

let bottomShelf: ShelfDefinition = {
    matrices: [],
    counter: 0,
    snapPoints: [
        { point: vec3.fromValues(-1.8, 0, 0), radius: 0.5 },
        { point: vec3.fromValues(-1.2, 0, 0), radius: 0.5 },
        { point: vec3.fromValues(-0.6, 0, 0), radius: 0.5 },
        { point: vec3.fromValues(0, 0, 0), radius: 0.5 },
        { point: vec3.fromValues(0.6, 0, 0), radius: 0.5 },
        { point: vec3.fromValues(1.2, 0, 0), radius: 0.5 },
        { point: vec3.fromValues(1.8, 0, 0), radius: 0.5 },
    ],
    snapLines: [
        { point1: vec3.fromValues(-2.2, 0, 0), point2: vec3.fromValues(2.2, 0, 0), radius: 0.5 }
    ]
};
let topShelf: ShelfDefinition = {
    matrices: [],
    counter: 0,
    snapPoints: [
        { point: vec3.fromValues(-1.8, 0, 1.5), radius: 0.5 },
        { point: vec3.fromValues(-1.2, 0, 1.5), radius: 0.5 },
        { point: vec3.fromValues(-0.6, 0, 1.5), radius: 0.5 },
        { point: vec3.fromValues(0, 0, 1.5), radius: 0.5 },
        { point: vec3.fromValues(0.6, 0, 1.5), radius: 0.5 },
        { point: vec3.fromValues(1.2, 0, 1.5), radius: 0.5 },
        { point: vec3.fromValues(1.8, 0, 1.5), radius: 0.5 },
    ],
    snapLines: [
        { point1: vec3.fromValues(-2.2, 0, 1.5), point2: vec3.fromValues(2.2, 0, 1.5), radius: 0.5 }
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

    // TODO: multiply with current value
    def.matrices.forEach(m => stringMatrixArray.push('[' + m.toString() + ']'));
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
            data.dragAnchors.push({ 
                position: vec3.fromValues((node.boundingBox.max[0] + node.boundingBox.min[0])/2, node.boundingBox.max[1], node.boundingBox.min[2])
            });
            
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
                shelves[i].snapLines.forEach(element => dragLineConstraintsIDs.push(dragManager.addDragConstraint(new LineConstraint(element.point1, element.point2, element.radius))));
                break;
            }
        }

        // once the movement has ended, we update the matrix in the parameter definition
        activateInteractionsToken.end = SDV.api.addListener(SDV.EVENTTYPE.INTERACTION.DRAG_END, async (e) => {
            dragLineConstraintsIDs.forEach(d => dragManager.removeDragConstraint(d));
            const dragEvent = <IDragEvent>e;
            // apply the matrix to the dragged item
            const number = dragEvent.node.getPath().substring(dragEvent.node.getPath().lastIndexOf('_') + 1, dragEvent.node.getPath().length)
            mat4.multiply(def.matrices[+number], def.matrices[+number], mat4.transpose(mat4.create(), (<any>e).matrix));
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
    def.snapPoints.forEach(element => dragConstraintsIDs.push(dragManager.addDragConstraint(new PointConstraint(element.point, element.radius))));

    // add a new matrix and update the parameter
    def.matrices.push(mat4.create());
    def.counter++;
    await updateParameter(def);

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
        if(!mouseDown) {
            // the mouse was released before entering the viewer
            dragManager.removeNode();
            def.matrices.pop();
            def.counter--;
            await updateParameter(def);
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
        dragConstraintsIDs.forEach(d => dragManager.removeDragConstraint(d))        
        mat4.multiply(def.matrices[def.matrices.length-1], def.matrices[def.matrices.length-1], mat4.transpose(mat4.create(), (<any>e).matrix));
        await updateParameter(def);
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
    viewer = <SDV.IStandardViewer>await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    session = await api.createSession({ 
        ticket: 'd517363654d6ee0d4fb680839557072364ab64556f04cbbfa82b14252eb283e49a16f24e7dfd4de26ac5420fd25b5cbd21ccca2d3139dda29604b08ef69e3002277d3ff9ceb4e96ae0caca86f0bccc63363c732bce217c097262e9734c2b89800e45210b75d8a1-8b178146df58fca61ebcabafd67113e5', 
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

    // create the interaction engine and the managers
    const interactionEngine = createInteractionEngine(viewer);
    hoverManager = new HoverManager();
    hoverManager.effectMaterial = new SDV.MaterialData({ color: '#dddddd', opacity: 0.25, alphaMode: SDV.MATERIAL_ALPHA.BLEND })
    interactionEngine.addInteractionManager(hoverManager);
    dragManager = new DragManager();
    interactionEngine.addInteractionManager(dragManager);

    // create a default plane where objects are dragged
    dragManager.addDragConstraint(new PlaneConstraint(vec3.fromValues(0, -1, 0), vec3.fromValues(0,-0.3,0)))
})();