import {
  addListener,
  CAMERA_TYPE,
  EVENTTYPE,
  EVENTTYPE_INTERACTION,
  HTMLElementAnchorCustomData,
  HTMLElementAnchorData,
  IAnchorDataImage,
  IEvent,
  IHTMLElementAnchorData,
  ITreeNode,
  MaterialStandardData,
  ORTHOGRAPHIC_CAMERA_DIRECTION,
  removeListener,
  sceneTree,
  ThreejsData,
  TreeNode
} from "@shapediver/viewer";
import { IStageData, Stage } from "../core/StageManager";
import * as THREE from "three";
import {
  DragManager,
  IDragEvent,
  InteractionData,
  InteractionEngine,
  PlaneConstraint
} from "@shapediver/viewer.features.interaction";
import { mat4, vec3, vec2 } from "gl-matrix";
import {
  anchorData,
  createDraggableHTMLAnchor,
  createHTMLAnchor,
  enableImageInteraction,
  setDragManager
} from "../core/HTMLAnchorElementManager";
import { createStageMenu } from "../utils/ui";

let moveListenerToken: string;
let endListenerToken: string;
let dragManager: DragManager;
let interactionEngine: InteractionEngine;
let gridNode: ITreeNode,
  topNode: ITreeNode,
  topNodeMirrored: ITreeNode,
  bottomNode: ITreeNode,
  bottomNodeMirrored: ITreeNode;
let topNodeAnchorData: HTMLElementAnchorCustomData,
  topNodeAnchorDataMirrored: HTMLElementAnchorCustomData,
  bottomNodeAnchorData: HTMLElementAnchorCustomData,
  bottomNodeAnchorDataMirrored: HTMLElementAnchorCustomData;

/**
 * Create a simple helper grid on the floor.
 *
 * @param node
 * @returns
 */
const createHelperGrid = (node: ITreeNode) => {
  const width = node.boundingBox.max[0] - node.boundingBox.min[0];
  const height = node.boundingBox.max[1] - node.boundingBox.min[1];
  const max = Math.max(width, height);

  const obj = new THREE.Object3D();

  const grid = new THREE.GridHelper(max, 10);
  grid.rotateX(Math.PI / 2);
  grid.position.set(0, node.boundingBox.boundingSphere.center[1], 0);
  obj.add(grid);

  const gridNode = new TreeNode();
  gridNode.addData(new ThreejsData(obj));
  return gridNode;
};

/**
 * STAGE 3
 *
 * This stage moves the camera into top view and makes it possible to move two nodes (and their mirrored counterparts) into the correct position.
 */
export const stage3 = new Stage(
  "Position Point Outline",
  "./icons/vector-polyline-edit.svg",
  async (data: IStageData) => {
    const mainDiv = <HTMLDivElement>document.getElementById("main-div")!;

    data.session.updateCallback = () => {
      for (let o in data.session.outputs)
        if (data.session.outputs[o].name !== "hull")
          if (data.session.outputs[o].node)
            data.session.outputs[o].node!.visible = false;
    };

    // NOTE UI: Add the forwardDiv, which contains a button that executes the goForward-function of the StageManager.
    mainDiv.appendChild(data.forwardDiv);
    // NOTE UI: Add the backwardDiv, which contains a button that executes the goBackward-function of the StageManager.
    mainDiv.appendChild(data.backwardDiv);

    // create the menu for this stage
    createStageMenu(data.session, data.viewport, mainDiv, 2, data.uiData);

    // Create an orthographic camera in the top view.
    const topCamera = data.viewport.createOrthographicCamera();
    topCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;
    data.viewport.assignCamera(topCamera.id);

    // And zoom that camera to the boat mesh
    topCamera.zoomToFactor = 1.5;
    topCamera.zoomTo(data.boatNode!.boundingBox, { duration: 0 });

    // Create a grid
    gridNode = createHelperGrid(data.boatNode!);
    data.interactionParentNode.addChild(gridNode);

    if (!topNode) {
      const {
        dragNode: dragNode0,
        anchorData: anchorData0
      } = createDraggableHTMLAnchor(
        vec3.create(),
        "./icons/record-circle-outline.svg",
        "position"
      );
      topNode = dragNode0;
      data.topNode = dragNode0;
      topNodeAnchorData = anchorData0;
      data.topNodeAnchorData = topNodeAnchorData;
      anchorData.push(topNodeAnchorData);
    }
    data.interactionParentNode.addChild(topNode);

    if (!topNodeMirrored) {
      const { dragNode: dragNode1, anchorData: anchorData1 } = createHTMLAnchor(
        vec3.create(),
        "./icons/record-circle-outline.svg",
        "position"
      );
      topNodeMirrored = dragNode1;
      data.topNodeMirrored = dragNode1;
      topNodeAnchorDataMirrored = anchorData1;
      data.topNodeAnchorDataMirrored = anchorData1;
    }
    data.interactionParentNode.addChild(topNodeMirrored);

    const height =
      data.boatNode!.boundingBox.max[1] - data.boatNode!.boundingBox.min[1];

    if (!bottomNode) {
      const {
        dragNode: dragNode2,
        anchorData: anchorData2
      } = createDraggableHTMLAnchor(
        vec3.fromValues(0, -height / 2, 0),
        "./icons/record-circle-outline.svg",
        "position"
      );
      bottomNode = dragNode2;
      data.bottomNode = dragNode2;
      bottomNodeAnchorData = anchorData2;
      data.bottomNodeAnchorData = bottomNodeAnchorData;
      anchorData.push(bottomNodeAnchorData);
    }
    data.interactionParentNode.addChild(bottomNode);

    if (!bottomNodeMirrored) {
      const { dragNode: dragNode3, anchorData: anchorData3 } = createHTMLAnchor(
        vec3.fromValues(0, -height / 2, 0),
        "./icons/record-circle-outline.svg",
        "position"
      );
      bottomNodeMirrored = dragNode3;
      data.bottomNodeMirrored = dragNode3;
      bottomNodeAnchorDataMirrored = anchorData3;
      data.bottomNodeAnchorDataMirrored = bottomNodeAnchorDataMirrored;
    }
    data.interactionParentNode.addChild(bottomNodeMirrored);

    const callback = (e: IEvent) => {
      const dragEvent = <IDragEvent>e;
      const anchorData = <HTMLElementAnchorCustomData>(
        dragEvent.node.data.find(
          (d) => d instanceof HTMLElementAnchorCustomData
        )
      );
      const newPosition = vec3.transformMat4(
        vec3.create(),
        vec3.create(),
        dragEvent.matrix
      );
      newPosition[0] = Math.min(0, newPosition[0]);
      anchorData.location = newPosition;

      if (anchorData === topNodeAnchorData)
        topNodeAnchorDataMirrored.location = vec3.fromValues(
          -newPosition[0],
          newPosition[1],
          newPosition[2]
        );

      if (anchorData === bottomNodeAnchorData)
        bottomNodeAnchorDataMirrored.location = vec3.fromValues(
          -newPosition[0],
          newPosition[1],
          newPosition[2]
        );

      data.interactionParentNode.updateVersion();
      data.viewport.updateNode(data.interactionParentNode);
    };

    moveListenerToken = addListener(EVENTTYPE.INTERACTION.DRAG_MOVE, (e) => {
      callback(e);
    });

    endListenerToken = addListener(EVENTTYPE.INTERACTION.DRAG_END, (e) => {
      enableImageInteraction();
      callback(e);
    });

    sceneTree.root.updateVersion();
    data.viewport.update();

    data.topNodeAnchorData!.data.imageElement.style.visibility = "";
    data.topNodeAnchorDataMirrored!.data.imageElement.style.visibility = "";
    data.bottomNodeAnchorData!.data.imageElement.style.visibility = "";
    data.bottomNodeAnchorDataMirrored!.data.imageElement.style.visibility = "";

    if (!interactionEngine) {
      // create the interactionEngine and provide it the viewport object
      interactionEngine = new InteractionEngine(data.viewport);

      // create the dragManager and add it
      dragManager = new DragManager();
      data.dragManager = dragManager;
      setDragManager(dragManager);
      dragManager.effectMaterial = new MaterialStandardData({
        color: "#00ff00"
      });
      interactionEngine.addInteractionManager(dragManager);

      // add a plane constraint
      const planeConstraint = new PlaneConstraint([0, 0, 1], [0, 0, 0]);
      // use the token to remove the constraint again (removeDragConstraint)
      const token = dragManager.addDragConstraint(planeConstraint);
    }
  },
  async (data: IStageData) => {
    (<any>data.session.updateCallback) = undefined;

    // remove the listeners
    removeListener(moveListenerToken);
    removeListener(endListenerToken);

    // Cleaning up of the main div.
    const mainDiv = document.getElementById("main-div")!;
    while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.firstChild);
  },
  async (data: IStageData) => {
    (<any>data.session.updateCallback) = undefined;

    // remove the listeners
    removeListener(moveListenerToken);
    removeListener(endListenerToken);

    // Cleaning up of the main div.
    const mainDiv = document.getElementById("main-div")!;
    while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.firstChild);

    // reset camera
    const camera = Object.values(data.viewport.cameras).find(
      (c) => c.type === CAMERA_TYPE.PERSPECTIVE
    )!;
    data.viewport.assignCamera(camera.id);

    // remove the children of the interaction node alltogether
    while (data.interactionParentNode.children.length > 0)
      data.interactionParentNode.removeChild(
        data.interactionParentNode.children[0]
      );
    sceneTree.root.updateVersion();
    data.viewport.update();

    // we added the image elements directly, so we have to remove them manually
    data.topNodeAnchorData!.data.imageElement.style.visibility = "hidden";
    data.topNodeAnchorDataMirrored!.data.imageElement.style.visibility =
      "hidden";
    data.bottomNodeAnchorData!.data.imageElement.style.visibility = "hidden";
    data.bottomNodeAnchorDataMirrored!.data.imageElement.style.visibility =
      "hidden";
  }
);
