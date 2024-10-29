import * as SDV from '@shapediver/viewer';
import {
    addListener,
    Box,
    createSession,
    createViewport,
    EVENTTYPE,
    GeometryData,
    IParameterApi,
    ISessionApi,
    IViewportApi,
    MaterialStandardData,
    removeListener,
    VISIBILITY_MODE
} from '@shapediver/viewer';
import { bottomShelf, ShelfDefinition, topShelf } from './definition';
import {
    DragManager,
    HoverManager,
    IDragEvent,
    InteractionData,
    InteractionEngine,
    LineConstraint,
    PlaneConstraint,
    PointConstraint
} from '@shapediver/viewer.features.interaction';
import { mat4, quat, vec3 } from 'gl-matrix';

(<any>window).SDV = SDV;

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

let session: ISessionApi;
let viewport: IViewportApi;

let dragManager: DragManager;
let hoverManager: HoverManager;

let customizationInProgress: boolean = false;

const dragLineConstraintsIDs: string[] = [];
const activateInteractionsToken: {
    start: string;
    end: string;
} = {
    start: '',
    end: ''
};

const updateParameter = async () => {
    const shelves = [topShelf, bottomShelf];
    for (let i = 0; i < shelves.length; i++) {
        const def = shelves[i];
        // convert the matrices into the desired format
        const stringMatrixArray: string[] = [];

        def.matrices.forEach((m) =>
            stringMatrixArray.push('[' + m.toString() + ']')
        );
        console.log(stringMatrixArray);
        def.parameter!.value =
            stringMatrixArray.length === 0
                ? '{matrices:[]}'
                : `{matrices:[${stringMatrixArray.join()}]}`;

    }
    await session.customize();


    for (let i = 0; i < shelves.length; i++) {
        const node = shelves[i].output!.node!.getNodesByName(shelves[i].output!.name + '_' + (shelves[i].counter - 1))[0]!;
        node.visible = false;
        node.updateVersion();
    }
    viewport.update();
};

const updateInteractions = (interactionTypes: { [key: string]: boolean }) => {
    const shelves = [topShelf, bottomShelf];
    for (let i = 0; i < shelves.length; i++) {
        for (let j = 0; j < shelves[i].counter; j++) {
            const node = shelves[i].output!.node!.getNodesByName(shelves[i].output!.name + '_' + j)[0]!;
            if (!node) continue;

            // we enable dragging for this node
            const data = new InteractionData(interactionTypes);

            const trueBB = new Box();
            node.traverseData(d => {
                if (d instanceof GeometryData) {
                    trueBB.union(d.boundingBox);
                }
            });


            // PART 1 - get the transformation matrix of the node that is applied in GH
            let transformationMatrix: mat4 = mat4.create();
            node.traverse(c => {
                if (c.name.startsWith('mesh_') && c.parent)
                    transformationMatrix = mat4.clone(c.parent.nodeMatrix);
            });

            // PART 2 - get the bounding box of the node and apply the inverse transformation matrix
            // we now have the original bounding box in the object space
            const bb = trueBB;

            // PART 3 - get the position by using the middle of the bottom back of the bounding box
            // and then apply the transformation matrix to get the position in the world space
            const position = vec3.fromValues(
                (bb.max[0] + bb.min[0]) / 2,
                bb.max[1],
                bb.min[2]
            );
            console.log(position);
            vec3.transformMat4(position, position, transformationMatrix);

            // PART 4 - get the rotation by using the rotation of the transformation matrix
            const angle = quat.getAngle(
                quat.setAxisAngle(quat.create(), vec3.fromValues(0, 0, 1), 0),
                mat4.getRotation(quat.create(), transformationMatrix)
            );

            data.dragAnchors.push({
                position,
                rotation: {
                    axis: vec3.fromValues(0, 0, 1),
                    angle
                }
            });

            // remove old data
            const old = node.data.filter((d) => d instanceof InteractionData);
            old.forEach((dTR) => node.data.splice(node.data.indexOf(dTR), 1));

            // we add the data and make the node invisible for now
            node.data.push(data);
            node.updateVersion();
        }
    }
};

/**
 * Deactivate the standard interactions
 */
const deactivateInteractions = () => {
    dragLineConstraintsIDs.forEach((d) => dragManager.removeDragConstraint(d));
    removeListener(activateInteractionsToken.start);
    removeListener(activateInteractionsToken.end);

    updateInteractions({ drag: false, hover: false });
};

/**
 * Activate the standard interactions
 */
const activateInteractions = () => {
    deactivateInteractions();
    updateInteractions({ drag: true, hover: true });

    activateInteractionsToken.start = addListener(
        EVENTTYPE.INTERACTION.DRAG_START,
        async (e) => {
            if (customizationInProgress) {
                dragManager.removeNode();
                return;
            }
            const dragEvent = <IDragEvent>e;

            dragLineConstraintsIDs.forEach((d) =>
                dragManager.removeDragConstraint(d)
            );

            // we search for the right definition and add snap lines
            const shelves = [topShelf, bottomShelf];
            let def: ShelfDefinition;
            for (let i = 0; i < shelves.length; i++) {
                if (dragEvent.node.getPath().includes(shelves[i].output!.id)) {
                    def = shelves[i];
                    def.snapPoints.forEach((element) =>
                        dragLineConstraintsIDs.push(
                            dragManager.addDragConstraint(
                                new PointConstraint(
                                    element.point,
                                    element.radius,
                                    element.rotation
                                )
                            )
                        )
                    );
                    def.snapLines.forEach((element) =>
                        dragLineConstraintsIDs.push(
                            dragManager.addDragConstraint(
                                new LineConstraint(
                                    element.point1,
                                    element.point2,
                                    element.radius,
                                    element.rotation
                                )
                            )
                        )
                    );
                    break;
                }
            }

            // once the movement has ended, we update the matrix in the parameter definition
            activateInteractionsToken.end = addListener(
                EVENTTYPE.INTERACTION.DRAG_END,
                async (e) => {
                    dragLineConstraintsIDs.forEach((d) =>
                        dragManager.removeDragConstraint(d)
                    );
                    const dragEvent = <IDragEvent>e;
                    // apply the matrix to the dragged item
                    const number = dragEvent.node
                        .getPath()
                        .substring(
                            dragEvent.node.getPath().lastIndexOf('_') + 1,
                            dragEvent.node.getPath().length
                        );
                    // mat4.multiply(
                    //     def.matrices[+number].translation,
                    //     def.matrices[+number].translation,
                    //     mat4.fromTranslation(
                    //         mat4.create(),
                    //         mat4.getTranslation(vec3.create(), dragEvent.matrix)
                    //     )
                    // );
                    // mat4.multiply(
                    //     def.matrices[+number].rotation,
                    //     def.matrices[+number].rotation,
                    //     mat4.fromQuat(
                    //         mat4.create(),
                    //         mat4.getRotation(quat.create(), dragEvent.matrix)
                    //     )
                    // );
                    mat4.multiply(
                        def.matrices[+number],
                        def.matrices[+number],
                        mat4.transpose(mat4.create(), (<any>e).matrix)
                    );
                    removeListener(activateInteractionsToken.end);
                    updateInteractions({ drag: true, hover: true });
                    activateInteractions();
                }
            );

            removeListener(activateInteractionsToken.start);
        }
    );
};

/**
 * This is the command that executes the external dragging
 *
 * @param def
 */
const addShelf = async (def: ShelfDefinition) => {
    if (customizationInProgress) return;
    deactivateInteractions();

    // create snap points for this shelf
    const dragConstraintsIDs: string[] = [];
    def.snapPoints.forEach((element) =>
        dragConstraintsIDs.push(
            dragManager.addDragConstraint(
                new PointConstraint(element.point, element.radius, element.rotation)
            )
        )
    );
    def.snapLines.forEach((element) =>
        dragConstraintsIDs.push(
            dragManager.addDragConstraint(
                new LineConstraint(
                    element.point1,
                    element.point2,
                    element.radius,
                    element.rotation
                )
            )
        )
    );

    // find the node with the last id, this one is currently hidden
    const newNode = def.output!.node!.getNodesByName(def.output!.name + '_' + (def.counter - 1))[0]!;

    // we enable dragging for this node
    const data = new InteractionData({ drag: true });

    // we set an anchor at the bottom back middle of the BB
    data.dragOrigin = vec3.fromValues((newNode.boundingBox.max[0] + newNode.boundingBox.min[0]) / 2, newNode.boundingBox.max[1], newNode.boundingBox.min[2]);

    // we add the data and make the node invisible for now
    newNode.data.push(data);
    newNode.updateVersion();
    newNode!.visible = false;
    viewport.update();

    // we tell the dragManager to drag this node
    dragManager.setNode(newNode!);

    // some things have to be done on the first move in the viewer
    const tokenMove = addListener(EVENTTYPE.INTERACTION.DRAG_MOVE, async (e) => {
        if (!mouseDown && !touchDown) {
            // the mouse was released before entering the viewer
            dragManager.removeNode();
            activateInteractions();
        } else {
            // the viewer was entered, make it visible
            newNode!.visible = true;
            newNode.updateVersion();
            viewport.updateNode(newNode);
        }
        removeListener(tokenMove);
    });

    // once the movement has ended, we update the matrix in the parameter definition
    const tokenEnd = addListener(EVENTTYPE.INTERACTION.DRAG_END, async (e) => {
        const dragEvent = <IDragEvent>e;
        dragConstraintsIDs.forEach((d) => dragManager.removeDragConstraint(d));
        // def.matrices[def.matrices.length - 1].translation = mat4.fromTranslation(
        //     mat4.create(),
        //     mat4.getTranslation(vec3.create(), dragEvent.matrix)
        // );
        // def.matrices[def.matrices.length - 1].rotation = mat4.fromQuat(
        //     mat4.create(),
        //     mat4.getRotation(quat.create(), dragEvent.matrix)
        // );
        mat4.multiply(
            def.matrices[def.matrices.length - 1],
            def.matrices[def.matrices.length - 1],
            mat4.transpose(mat4.create(), dragEvent.matrix)
        );

        // add a new matrix and update the parameter
        def.matrices.push(mat4.create());
        def.counter++;

        removeListener(tokenEnd);
        updateInteractions({ drag: true, hover: true });
        activateInteractions();
    });
};

(<any>window).addTopShelf = async () => {
    addShelf(topShelf);
};

(<any>window).addBottomShelf = async () => {
    addShelf(bottomShelf);
};

document.addEventListener('keydown', async (e) => {
    if(e.key === 'Enter') {
        customizationInProgress = true;
        await updateParameter();
        customizationInProgress = false;
    }
});

(async () => {
    customizationInProgress = true;
    viewport = await createViewport({
        canvas: <HTMLCanvasElement>document.getElementById('canvas'),
        id: 'myViewport',
        visibility: VISIBILITY_MODE.MANUAL
    });
    session = await createSession({
        ticket:
            '500b3308fd039ca7e9d171ee5e84b62e680f86ee57560d46e3e394f4932814b7f57e29a43e22210e8efd08f4e09e6ff77efe78d274bea6c003bfd24fd3eb7460385114bb8dc88e1d0cfee8016e04ad445d533db69863d1f4af4a8cd9cd4c605f9dd159604515cb-70504b7d529584165df2df27becd58df',
        modelViewUrl: 'https://sdr8euc1.eu-central-1.shapediver.com',
        id: 'mySession'
    });

    // we change some light properties as this scene is quite big
    const directionalLight = Object.values(viewport.lightScene!.lights).find(l => l.type === SDV.LIGHT_TYPE.DIRECTIONAL) as SDV.IDirectionalLightApi;
    directionalLight.shadowMapResolution = 4096;
    directionalLight.shadowMapBias = -0.0005;

    topShelf.output = session.getOutputByName('topShelf')[0];
    bottomShelf.output = session.getOutputByName('bottomShelf')[0];

    topShelf.parameter = session.getParameterByName('topShelfMatrices')[0] as IParameterApi<string>;
    bottomShelf.parameter = session.getParameterByName('bottomShelfMatrices')[0] as IParameterApi<string>;

    await updateParameter();
    const shelves = [topShelf, bottomShelf];

    for (let i = 0; i < shelves.length; i++) {
        const node = shelves[i].output!.node!.getNodesByName(shelves[i].output!.name + '_0')[0]!;
        node.visible = false;
        node.updateVersion();
    }
    viewport.update();

    viewport.show = true;

    // create the interaction engine and the managers
    const interactionEngine = new InteractionEngine(viewport);
    hoverManager = new HoverManager();
    hoverManager.effectMaterial = new MaterialStandardData({ color: '#dddddd' });
    interactionEngine.addInteractionManager(hoverManager);
    dragManager = new DragManager();
    dragManager.effectMaterial = new MaterialStandardData({ color: '#dddddd' });
    interactionEngine.addInteractionManager(dragManager);

    // create a default plane where objects are dragged
    dragManager.addDragConstraint(
        new PlaneConstraint(vec3.fromValues(0, -1, 0), vec3.fromValues(0, -0.3, 0))
    );
    dragManager.addDragConstraint(
        new PlaneConstraint(vec3.fromValues(1, 0, 0), vec3.fromValues(-2.5, 0, 0), {
            axis: vec3.fromValues(0, 0, 1),
            angle: Math.PI / 2
        })
    );
    dragManager.addDragConstraint(
        new PlaneConstraint(vec3.fromValues(0, 0, 1), vec3.fromValues(0, 0, 0))
    );
    customizationInProgress = false;
})();
