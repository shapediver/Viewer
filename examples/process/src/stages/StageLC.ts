import { IStageData, Stage } from "../core/StageManager";
import { addListener, createSession, createViewport, DataEngine, EVENTTYPE, HTMLElementAnchorCustomData, HTMLElementAnchorData, IAnchorDataImage, IDirectionalLightApi, IHTMLElementAnchorData, ILightApi, IPointLightApi, ISessionApi, ISpotLightApi, ITreeNode, IViewportApi, LIGHT_TYPE, removeListener, sceneTree, TreeNode } from "@shapediver/viewer";
import { CameraPlaneConstraint, DragManager, IDragEvent, InteractionData, InteractionEngine } from "@shapediver/viewer.features.interaction";
import { vec2, vec3 } from "gl-matrix";

let viewport: IViewportApi;
let session: ISessionApi;
let dragManager: DragManager;
let interactionEngine: InteractionEngine;
let dragManagerToken: string;

let activeLight: {
    lightNode: ITreeNode,
    dragNodePosition: ITreeNode,
    dragNodeTarget?: ITreeNode,
    anchorDataPosition: HTMLElementAnchorCustomData,
    anchorDataTarget?: HTMLElementAnchorCustomData,
    dragMoveListenerToken: string,
    dragEndListenerToken: string,
} | undefined;

const disableImageInteraction = () => {
    if (!activeLight) return;
    if (activeLight.anchorDataPosition) {
        activeLight.anchorDataPosition.data.imageElement.style.userSelect = 'none';
        activeLight.anchorDataPosition.data.imageElement.style.cursor = 'default';
        activeLight.anchorDataPosition.data.imageElement.style.pointerEvents = 'none';
    }
    if (activeLight.anchorDataTarget) {
        activeLight.anchorDataTarget.data.imageElement.style.userSelect = 'none';
        activeLight.anchorDataTarget.data.imageElement.style.cursor = 'default';
        activeLight.anchorDataTarget.data.imageElement.style.pointerEvents = 'none';
    }
}
const enableImageInteraction = () => {
    if (!activeLight) return;
    if (activeLight.anchorDataPosition) {
        activeLight.anchorDataPosition.data.imageElement.style.userSelect = '';
        activeLight.anchorDataPosition.data.imageElement.style.cursor = '';
        activeLight.anchorDataPosition.data.imageElement.style.pointerEvents = '';
    }
    if (activeLight.anchorDataTarget) {
        activeLight.anchorDataTarget.data.imageElement.style.userSelect = '';
        activeLight.anchorDataTarget.data.imageElement.style.cursor = '';
        activeLight.anchorDataTarget.data.imageElement.style.pointerEvents = '';
    }
}


const create = (properties: { anchor: HTMLElementAnchorData, parent: HTMLDivElement }) => {
    const img = document.createElement('img');
    img.style.position = 'absolute'
    document.getElementById('canvas')!.parentElement!.appendChild(img);
    properties.anchor.data.imageElement = img;

    const imageData: IAnchorDataImage = properties.anchor.data.image;
    img.src = imageData.src;
    if (imageData.height) img.height = imageData.height;
    if (imageData.width) img.width = imageData.width;
    if (imageData.alt) img.alt = imageData.alt;

    const clickCallback = () => {
        dragManager.setNode(properties.anchor.data.node)
        disableImageInteraction()
        return false;
    }

    img.ondragstart = clickCallback;
    img.onclick = clickCallback;
}

const update = (properties: {
    anchor: IHTMLElementAnchorData,
    page: vec2,
    container: vec2,
    client: vec2,
    scale: vec2,
    hidden: boolean
}) => {
    const image = properties.anchor.data.imageElement;
    image.style.display = '';
    if (properties.anchor.hideable && properties.hidden) image.style.display = 'none';

    let x = properties.container[0] / properties.scale[0] - image.offsetWidth / 2;
    let y = properties.container[1] / properties.scale[1] - image.offsetHeight / 2;
    image.style.left = x + 'px';
    image.style.top = y + 'px';
}

const createHTMLAnchor = (location: vec3, lightNode: ITreeNode, imageSrc: string, imageAlt: string) => {
    const dragNode = new TreeNode();
    const iData = new InteractionData({ drag: true })
    iData.dragOrigin = location;
    dragNode.addData(iData)
    lightNode!.addChild(dragNode)

    const anchorData = new HTMLElementAnchorCustomData({
        location,
        data: {
            name: imageAlt,
            image: <IAnchorDataImage>{
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
    lightNode.updateVersion();
    return {
        dragNode, anchorData
    };
}

const selectLight = async (light: ILightApi) => {
    if (activeLight) return;

    const lightNode = viewport.lightScene!.node.children.find(c => c.name === light.id)!;

    if (light.type === LIGHT_TYPE.DIRECTIONAL) {
        const directionalLight = <IDirectionalLightApi>light;

        const originalPosition = vec3.clone(directionalLight.direction);
        const { dragNode: dragNodePosition, anchorData: anchorDataPosition } = createHTMLAnchor(originalPosition, lightNode!, "https://viewer.shapediver.com/v3/graphics/crosshairs_black.png", "position");

        const dragMoveListenerToken = addListener(EVENTTYPE.INTERACTION.DRAG_MOVE, (e) => {
            const dragEvent = <IDragEvent>e;
            const anchorData = <HTMLElementAnchorCustomData>dragEvent.node.data.find(d => d instanceof HTMLElementAnchorCustomData);
            const newPosition = vec3.transformMat4(vec3.create(), originalPosition, dragEvent.matrix);
            const newDirection = vec3.normalize(vec3.create(), newPosition)

            directionalLight.direction = newDirection
            anchorData.location = newPosition;
        })
        const dragEndListenerToken = addListener(EVENTTYPE.INTERACTION.DRAG_END, enableImageInteraction)

        activeLight = { lightNode, dragNodePosition, anchorDataPosition, dragMoveListenerToken, dragEndListenerToken }
    } else if (light.type === LIGHT_TYPE.POINT) {
        const pointLight = <IPointLightApi>light;

        const originalPosition = vec3.clone(pointLight.position);
        const { dragNode: dragNodePosition, anchorData: anchorDataPosition } = createHTMLAnchor(originalPosition, lightNode!, "https://viewer.shapediver.com/v3/graphics/crosshairs_black.png", "position");

        const dragMoveListenerToken = addListener(EVENTTYPE.INTERACTION.DRAG_MOVE, (e) => {
            const dragEvent = <IDragEvent>e;
            const anchorData = <HTMLElementAnchorCustomData>dragEvent.node.data.find(d => d instanceof HTMLElementAnchorCustomData);
            pointLight.position = vec3.transformMat4(vec3.create(), originalPosition, dragEvent.matrix);
            anchorData.location = pointLight.position;
        })
        const dragEndListenerToken = addListener(EVENTTYPE.INTERACTION.DRAG_END, enableImageInteraction)

        activeLight = { lightNode, dragNodePosition, anchorDataPosition, dragMoveListenerToken, dragEndListenerToken }
    } else if (light.type === LIGHT_TYPE.SPOT) {
        const spotLight = <ISpotLightApi>light;

        const originalPosition = vec3.clone(spotLight.position);
        const { dragNode: dragNodePosition, anchorData: anchorDataPosition } = createHTMLAnchor(originalPosition, lightNode!, "https://viewer.shapediver.com/v3/graphics/crosshairs_black.png", "position");

        const originalTarget = vec3.clone(spotLight.target);
        const { dragNode: dragNodeTarget, anchorData: anchorDataTarget } = createHTMLAnchor(originalTarget, lightNode!, "https://viewer.shapediver.com/v3/graphics/target_black.png", "target");

        const dragMoveListenerToken = addListener(EVENTTYPE.INTERACTION.DRAG_MOVE, (e) => {
            const dragEvent = <IDragEvent>e;
            const anchorData = <HTMLElementAnchorCustomData>dragEvent.node.data.find(d => d instanceof HTMLElementAnchorCustomData);
            if (anchorData.data.name === 'position') {
                spotLight.position = vec3.transformMat4(vec3.create(), originalPosition, dragEvent.matrix);
                anchorData.location = spotLight.position;
            }
            if (anchorData.data.name === 'target') {
                spotLight.target = vec3.transformMat4(vec3.create(), originalTarget, dragEvent.matrix);
                anchorData.location = spotLight.target;
            }
        })
        const dragEndListenerToken = addListener(EVENTTYPE.INTERACTION.DRAG_END, enableImageInteraction)
        activeLight = { lightNode, dragNodePosition, dragNodeTarget, anchorDataPosition, anchorDataTarget, dragMoveListenerToken, dragEndListenerToken }
    }
}

const deselectLight = () => {
    if (!activeLight) return;

    if (activeLight.dragNodePosition) activeLight.lightNode.removeChild(activeLight.dragNodePosition)
    if (activeLight.anchorDataPosition) (<HTMLImageElement>activeLight.anchorDataPosition.data.imageElement).parentElement!.removeChild(activeLight.anchorDataPosition.data.imageElement);
    if (activeLight.dragNodeTarget) activeLight.lightNode.removeChild(activeLight.dragNodeTarget)
    if (activeLight.anchorDataTarget) (<HTMLImageElement>activeLight.anchorDataTarget.data.imageElement).parentElement!.removeChild(activeLight.anchorDataTarget.data.imageElement);

    removeListener(activeLight.dragMoveListenerToken)
    removeListener(activeLight.dragEndListenerToken)

    activeLight = undefined;
}


const onStartCallback = async (data: IStageData) => {
    data.goForwardDiv.style.visibility = "hidden";


    (<any>window).selectLight = selectLight;
    (<any>window).deselectLight = deselectLight;

    (async () => {
        // create a viewport
        viewport = await createViewport({
            canvas: <HTMLCanvasElement>document.getElementById("canvas"),
            id: "myViewport"
        });

        // create a session
        session = await createSession({
            ticket:
                "319f14f08c1e67a874fd843acecfd321049772deb0cdb5a0dbb39385592a156e83730e45c5e7af5eab52e15b1e36d44a092f71ada1331e1935b0f25d9448af34d0add0bd5abf8984325b97ee9e6106b25216446d15a86bb18b40114df89d2f5909b08e8c8b9eeb-7516be37cb2d968a0b3c545baf3ae51e",
            modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
            id: "mySession"
        });
        const s1 = viewport.lightScene!.addPointLight({ color: '#ff0000' })
        const s2 = viewport.lightScene!.addSpotLight({ color: '#00ff00' })

        // create the interactionEngine and provide it the viewport object
        interactionEngine = new InteractionEngine(viewport);

        // create the dragManager and add it
        dragManager = new DragManager();
        dragManagerToken = interactionEngine.addInteractionManager(dragManager);
        // add a plane constraint
        const planeConstraint = new CameraPlaneConstraint();
        // use the token to remove the constraint again (removeDragConstraint)
        const token = dragManager.addDragConstraint(planeConstraint);

        selectLight(s1)
    })();


};

const onEndCallback = async (data: IStageData) => {
    deselectLight();
    interactionEngine.removeInteractionManager(dragManagerToken);

    viewport.show = false;
    await session.close();
    await viewport.close();

    data.goForwardDiv.style.visibility = "";
};

export const stageLightControls = new Stage(
    "Light Controls",
    'https://shapediverviewer.s3.amazonaws.com/v3/images/SD_grayscale.png',
    onStartCallback,
    onEndCallback,
    onEndCallback
)