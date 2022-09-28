
import * as SDV from '@shapediver/viewer';
import { HTMLElementAnchorCustomData, ITreeNode, MaterialStandardData, ThreejsData } from '@shapediver/viewer';
import { InteractionEngine, DragManager, PlaneConstraint, IDragEvent, InteractionData } from '@shapediver/viewer.features.interaction';
import { vec3, mat4, vec2 } from 'gl-matrix';
import * as THREE from "three"

(<any>window).SDV = SDV;

/**
 * Create a three.js curve object with the points provided.
 * 
 * @param points 
 * @returns 
 */
const createCurveObject = (points: THREE.Vector3[]) => {
    // const threePoints = points.map(p => p instanceof THREE.Vector2 ? new THREE.Vector3(p.x, p.y, 0) : new THREE.Vector3(p[0], p[1], p[2]));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const curveObject = new THREE.Line(geometry, material);

    curveObject.renderOrder = 999;
    curveObject.material.depthTest = false;
    curveObject.material.depthWrite = false;

    return curveObject;
}

/**
 * Create a curve from the three points that lie on it.
 * 
 * @param pointA 
 * @param pointB 
 * @param pointC 
 * @param mirror 
 * @returns 
 */
const createCurve = (pointA: vec3, pointB: vec3, pointC: vec3) => {
    const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(pointA[0], pointA[1], pointA[2]),
        new THREE.Vector3(pointB[0], pointB[1], pointB[2]),
        new THREE.Vector3(pointC[0], pointC[1], pointC[2])
    );

    const points = curve.getPoints(50);
    const curveObject = createCurveObject(points);

    return curveObject;
}

let dragManager: DragManager;

let anchorData: HTMLElementAnchorCustomData[] = [];

const create = (properties: { anchor: SDV.HTMLElementAnchorData, parent: HTMLDivElement }) => {
    const img = document.createElement('img');
    img.style.position = 'absolute'
    document.getElementById('canvas')!.parentElement!.appendChild(img);
    properties.anchor.data.imageElement = img;

    const imageData: SDV.IAnchorDataImage = properties.anchor.data.image;
    img.src = imageData.src;
    if (imageData.height) img.height = imageData.height;
    if (imageData.width) img.width = imageData.width;
    if (imageData.alt) img.alt = imageData.alt;

    const clickCallback = () => {
        console.log(properties)
        dragManager.setNode(properties.anchor.data.node)
        disableImageInteraction()
        return false;
    }

    img.ontouchstart = clickCallback;
    img.ondragstart = clickCallback;
}

const update = (properties: {
    anchor: SDV.IHTMLElementAnchorData,
    page: vec2,
    container: vec2,
    client: vec2,
    scale: vec2,
    hidden: boolean
}) => {
    const image = properties.anchor.data.imageElement;
    image.style.display = '';
    if (properties.anchor.hideable && properties.hidden) image.style.display = 'none';

    let             x = properties.container[0] - image.offsetWidth / 2;

    let y = properties.container[1] / properties.scale[1] - image.offsetHeight / 2;
    image.style.left = x + 'px';
    image.style.top = y + 'px';
}

const createHTMLAnchor = (location: vec3, imageSrc: string, imageAlt: string) => {
    const dragNode = new SDV.TreeNode();
    const iData = new InteractionData({ drag: true })
    iData.dragOrigin = vec3.create();
    dragNode.addData(iData)

    const anchorData = new SDV.HTMLElementAnchorCustomData({
        location,
        data: {
            name: imageAlt,
            image: <SDV.IAnchorDataImage>{
                alt: imageAlt,
                src: imageSrc,
                width: 50,
                height: 50
            },
            node: dragNode
        },
        hideable: false,
        create,
        update
    });

    dragNode.data.push(anchorData);
    return {
        dragNode, anchorData
    };
}

const enableImageInteraction = () => {
    for (let i = 0; i < anchorData.length; i++) {
        anchorData[i].data.imageElement.style.userSelect = '';
        anchorData[i].data.imageElement.style.cursor = '';
        anchorData[i].data.imageElement.style.pointerEvents = '';
    }
}

const disableImageInteraction = () => {
    for (let i = 0; i < anchorData.length; i++) {
        anchorData[i].data.imageElement.style.userSelect = 'none';
        anchorData[i].data.imageElement.style.cursor = 'default';
        anchorData[i].data.imageElement.style.pointerEvents = 'none';
    }
}


(async () => {
    let viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    })
    let session = await SDV.createSession({
        id: 'mySession',
        ticket: 'b208dd9fe03135e5d735f05f8aa2a45972a127cb03b2189392f74d3afb2dd6f708b4cb3282997271b8cc0f0e20fd4698c92d285116a8c425becee8092c2db60e8570513e97cec0e0d0f9063eb35c996fa95bdb2d9d6c05f5285c94edca273ce520abc28f3a9c52-befbca912b1fe2c0470c81e5aba44127',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com'
    })

    viewport.camera!.zoomTo(new SDV.Box(vec3.fromValues(0,0,0), vec3.fromValues(1, 1, 1)))

    // create the interactionEngine and provide it the viewport object
    const interactionEngine = new InteractionEngine(viewport);

    // create the dragManager and add it
    dragManager = new DragManager();
    dragManager.effectMaterial = new MaterialStandardData({ color: "#00ff00" });
    interactionEngine.addInteractionManager(dragManager);

    // add a plane constraint
    const planeConstraint = new PlaneConstraint([0, 0, 1], [0, 0, 0]);
    // use the token to remove the constraint again (removeDragConstraint)
    const token = dragManager.addDragConstraint(planeConstraint);

    const node = new SDV.TreeNode();
    SDV.sceneTree.root.addChild(node);



    const { dragNode: dragNode0, anchorData: anchorData0 } = createHTMLAnchor(vec3.create(), "https://viewer.shapediver.com/v3/graphics/crosshairs_black.png", "position");
    anchorData.push(anchorData0)
    node.addChild(dragNode0)

    const { dragNode: dragNode1, anchorData: anchorData1 } = createHTMLAnchor(vec3.fromValues(1, 0, 0), "https://viewer.shapediver.com/v3/graphics/crosshairs_black.png", "position");
    anchorData.push(anchorData1)
    node.addChild(dragNode1)

    const { dragNode: dragNode2, anchorData: anchorData2 } = createHTMLAnchor(vec3.fromValues(0, 1, 0), "https://viewer.shapediver.com/v3/graphics/crosshairs_black.png", "position");
    anchorData.push(anchorData2)
    node.addChild(dragNode2)

    const threeJsData = new ThreejsData(new THREE.Object3D());
    SDV.sceneTree.root.addData(threeJsData);

    const dragMoveListenerToken = SDV.addListener(SDV.EVENTTYPE.INTERACTION.DRAG_MOVE, (e) => {
        const dragEvent = <IDragEvent>e;
        const anchorData = <SDV.HTMLElementAnchorCustomData>dragEvent.node.data.find(d => d instanceof SDV.HTMLElementAnchorCustomData);
        const newPosition = vec3.transformMat4(vec3.create(), vec3.create(), dragEvent.matrix);
        anchorData.location = newPosition;

        threeJsData.obj = createCurve(anchorData0.location, anchorData1.location, anchorData2.location);
    })

    const dragEndListenerToken = SDV.addListener(SDV.EVENTTYPE.INTERACTION.DRAG_END, () => {
        enableImageInteraction();
        session.getParameterByName('Point A')[0].value = `${anchorData0.location[0]}, ${anchorData0.location[1]}, ${anchorData0.location[2]}`
        session.getParameterByName('Point B')[0].value = `${anchorData1.location[0]}, ${anchorData1.location[1]}, ${anchorData1.location[2]}`
        session.getParameterByName('Point C')[0].value = `${anchorData2.location[0]}, ${anchorData2.location[1]}, ${anchorData2.location[2]}`
        session.customize();
    })

    SDV.sceneTree.root.updateVersion();
    viewport.update();

})();