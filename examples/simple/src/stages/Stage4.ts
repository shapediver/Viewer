import {
  addListener,
  EVENTTYPE,
  EVENTTYPE_INTERACTION,
  HTMLElementAnchorCustomData,
  IEvent,
  ITreeNode,
  removeListener,
  sceneTree,
  ThreejsData,
  TreeNode
} from "@shapediver/viewer";
import { vec3 } from "gl-matrix";
import { IDragEvent } from "@shapediver/viewer.features.interaction";
import { IStageData, Stage } from "../core/StageManager";
import * as THREE from "three";
import {
  anchorData,
  createDraggableHTMLAnchor,
  createHTMLAnchor,
  enableImageInteraction
} from "../core/HTMLAnchorElementManager";
import { createStageMenu } from "../utils/ui";

let moveListenerToken: string;
let endListenerToken: string;
let topControlNode: ITreeNode,
  bottomControlNode: ITreeNode,
  sideControlNode: ITreeNode,
  sideControlNodeMirrored: ITreeNode;
let topControlNodeAnchorData: HTMLElementAnchorCustomData,
  bottomControlNodeAnchorData: HTMLElementAnchorCustomData,
  sideControlNodeAnchorData: HTMLElementAnchorCustomData,
  sideControlNodeAnchorDataMirrored: HTMLElementAnchorCustomData;

/**
 * Helper function to get the center of a circle with three points on the cirle,
 * two directions between those points and the normal that these points are on.
 *
 * @param pointA
 * @param pointB
 * @param pointC
 * @param dir_A_B
 * @param dir_B_C
 * @param planeNormal
 * @returns
 */
const getCircleCenter = (
  pointA: vec3,
  pointB: vec3,
  pointC: vec3,
  dir_A_B: vec3,
  dir_B_C: vec3,
  planeNormal: vec3
) => {
  const ABHalf = vec3.divide(
    vec3.create(),
    vec3.add(vec3.create(), pointA, pointB),
    vec3.fromValues(2, 2, 2)
  );
  const dir_ABHalf_O = vec3.normalize(
    vec3.create(),
    vec3.cross(vec3.create(), planeNormal, dir_A_B)
  );

  const BCHalf = vec3.divide(
    vec3.create(),
    vec3.add(vec3.create(), pointB, pointC),
    vec3.fromValues(2, 2, 2)
  );
  const dir_BCHalf_O = vec3.normalize(
    vec3.create(),
    vec3.cross(vec3.create(), planeNormal, dir_B_C)
  );

  const dx = BCHalf[0] - ABHalf[0];
  const dy = BCHalf[1] - ABHalf[1];
  const det =
    dir_BCHalf_O[0] * dir_ABHalf_O[1] - dir_BCHalf_O[1] * dir_ABHalf_O[0];
  const u = (dy * dir_BCHalf_O[0] - dx * dir_BCHalf_O[1]) / det;
  const v = (dy * dir_ABHalf_O[0] - dx * dir_ABHalf_O[1]) / det;

  return vec3.add(
    vec3.create(),
    ABHalf,
    vec3.multiply(vec3.create(), dir_ABHalf_O, vec3.fromValues(u, u, u))
  );
};

/**
 * Create a three.js curve object with the points provided.
 *
 * @param points
 * @returns
 */
const createCurveObject = (
  points: vec3[] | THREE.Vector2[] | THREE.Vector3[]
) => {
  const threePoints = points.map((p) =>
    p instanceof THREE.Vector2
      ? new THREE.Vector3(p.x, p.y, 0)
      : p instanceof THREE.Vector3
      ? p
      : new THREE.Vector3(p[0], p[1], p[2])
  );

  const geometry = new THREE.BufferGeometry().setFromPoints(threePoints);

  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const curveObject = new THREE.Line(geometry, material);

  curveObject.renderOrder = 999;
  curveObject.material.depthTest = false;
  curveObject.material.depthWrite = false;

  return curveObject;
};

/**
 * Create a mirrored version of the provided curve.
 *
 * @param curve
 * @returns
 */
const mirrorCurve = (curve: THREE.Line) => {
  const mirroredCurve = curve.clone();
  mirroredCurve.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI));
  (<THREE.LineBasicMaterial>mirroredCurve.material).color = new THREE.Color(
    "#880000"
  );
  (<THREE.LineBasicMaterial>mirroredCurve.material).needsUpdate = true;
  return mirroredCurve;
};

/**
 * Create a curve from the three points that lie on it.
 *
 * @param pointA
 * @param pointB
 * @param pointC
 * @param mirror
 * @returns
 */
const createCurve = (
  pointA: vec3,
  pointB: vec3,
  pointC: vec3,
  mirror: boolean = false
) => {
  const obj = new THREE.Object3D();

  // the half point between A and C
  const pointD = vec3.divide(
    vec3.create(),
    vec3.add(vec3.create(), pointC, pointA),
    vec3.fromValues(2, 2, 2)
  );

  const dir_A_B = vec3.normalize(
    vec3.create(),
    vec3.sub(vec3.create(), pointB, pointA)
  );
  const dir_A_C = vec3.normalize(
    vec3.create(),
    vec3.sub(vec3.create(), pointC, pointA)
  );
  const dir_B_C = vec3.normalize(
    vec3.create(),
    vec3.sub(vec3.create(), pointC, pointB)
  );
  const planeNormal = vec3.normalize(
    vec3.create(),
    vec3.cross(vec3.create(), dir_A_B, dir_A_C)
  );

  const dot_AB_BC = vec3.dot(dir_A_B, dir_B_C);
  if (Math.abs(dot_AB_BC) > 0.999999) {
    const curveObject = createCurveObject([pointA, pointC]);
    obj.add(curveObject);
    if (mirror) obj.add(mirrorCurve(curveObject));
    return obj;
  }

  const origin = getCircleCenter(
    pointA,
    pointB,
    pointC,
    dir_A_B,
    dir_B_C,
    planeNormal
  );
  const arcRadius = vec3.dist(origin, pointA);

  const dir_O_B = vec3.normalize(
    vec3.create(),
    vec3.sub(vec3.create(), pointB, origin)
  );
  const dir_O_D = vec3.normalize(
    vec3.create(),
    vec3.sub(vec3.create(), pointD, origin)
  );
  const dir_O_A = vec3.normalize(
    vec3.create(),
    vec3.sub(vec3.create(), pointA, origin)
  );
  const dir_O_C = vec3.normalize(
    vec3.create(),
    vec3.sub(vec3.create(), pointC, origin)
  );

  const dot_OB_OD = vec3.dot(dir_O_B, dir_O_D);

  const rotationOffset =
    2 * Math.PI - Math.acos(vec3.dot(dir_A_C, vec3.fromValues(1, 0, 0)));

  let angleStart,
    angle,
    clockwise = false;
  if (planeNormal[2] > 0) {
    if (dot_OB_OD < 0) {
      clockwise = true;
      angleStart = Math.acos(
        vec3.dot(
          dir_O_A,
          vec3.multiply(vec3.create(), dir_A_C, vec3.fromValues(-1, -1, -1))
        )
      );
      angle = Math.acos(vec3.dot(dir_O_A, dir_O_C)) + angleStart;
    } else {
      clockwise = false;
      angleStart = 2 * Math.PI - Math.acos(vec3.dot(dir_O_A, dir_A_C));
      angle = Math.acos(vec3.dot(dir_O_A, dir_O_C)) + angleStart;
    }
  } else {
    if (dot_OB_OD < 0) {
      clockwise = true;
      angleStart = 2 * Math.PI - Math.acos(vec3.dot(dir_O_A, dir_A_C));
      angle = Math.acos(vec3.dot(dir_O_A, dir_O_C)) + angleStart;
    } else {
      clockwise = false;
      angleStart = Math.acos(
        vec3.dot(
          dir_O_A,
          vec3.multiply(vec3.create(), dir_A_C, vec3.fromValues(-1, -1, -1))
        )
      );
      angle = Math.acos(vec3.dot(dir_O_A, dir_O_C)) + angleStart;
    }
  }

  const curve = new THREE.EllipseCurve(
    origin[0], // ax
    origin[1], // aY
    arcRadius, // xRadius
    arcRadius, // yRadius
    angleStart, // aStartAngle
    angle, // aEndAngle
    clockwise, // aClockwise
    rotationOffset // aRotation
  );

  const points = curve.getPoints(50);
  const curveObject = createCurveObject(points);

  obj.add(curveObject);
  if (mirror) obj.add(mirrorCurve(curveObject));
  return obj;
};

const createNurbsCurve = (
  pointA: vec3,
  pointB: vec3,
  pointC: vec3,
  mirror: boolean
) => {
  const obj = new THREE.Object3D();
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(pointA[0], pointA[1], pointA[2]),
    new THREE.Vector3(pointB[0], pointB[1], pointB[2]),
    new THREE.Vector3(pointC[0], pointC[1], pointC[2])
  );

  const points = curve.getPoints(50);
  const curveObject = createCurveObject(points);

  obj.add(curveObject);
  if (mirror) obj.add(mirrorCurve(curveObject));
  return obj;
};

/**
 * STAGE 4
 *
 * This makes it possible to move three nodes that create curves that are used to fit to the boat.
 */
export const stage4 = new Stage(
  "Adjust Curves",
  "./icons/vector-curve.svg",
  async (data: IStageData, backward: boolean) => {
    const mainDiv = <HTMLDivElement>document.getElementById("main-div")!;

    // NOTE UI: Add the forwardDiv, which contains a button that executes the goForward-function of the StageManager.
    mainDiv.appendChild(data.forwardDiv);
    // NOTE UI: Add the backwardDiv, which contains a button that executes the goBackward-function of the StageManager.
    mainDiv.appendChild(data.backwardDiv);

    // create the menu for this stage
    createStageMenu(data.session, data.viewport, mainDiv, 3, data.uiData);

    // Create the node for the top curve
    const topHalfPoint = vec3.divide(
      vec3.create(),
      vec3.add(
        vec3.create(),
        data.topNodeAnchorData!.location,
        data.topNodeAnchorDataMirrored!.location
      ),
      vec3.fromValues(2, 2, 2)
    );

    if (!data.interactionParentNode.hasChild(data.topNode!))
      data.interactionParentNode.addChild(data.topNode!);

    if (!data.interactionParentNode.hasChild(data.topNodeMirrored!))
      data.interactionParentNode.addChild(data.topNodeMirrored!);

    if (!data.interactionParentNode.hasChild(data.bottomNode!))
      data.interactionParentNode.addChild(data.bottomNode!);

    if (!data.interactionParentNode.hasChild(data.bottomNodeMirrored!))
      data.interactionParentNode.addChild(data.bottomNodeMirrored!);

    if (!topControlNode) {
      const {
        dragNode: dragNode0,
        anchorData: anchorData0
      } = createDraggableHTMLAnchor(
        topHalfPoint,
        "./icons/atom-variant.svg",
        "position"
      );
      topControlNode = dragNode0;
      data.topControlNode = dragNode0;
      topControlNodeAnchorData = anchorData0;
      data.topControlNodeAnchorData = anchorData0;
      anchorData.push(topControlNodeAnchorData);
    }
    data.interactionParentNode.addChild(topControlNode);

    const bottomHalfPoint = vec3.divide(
      vec3.create(),
      vec3.add(
        vec3.create(),
        data.bottomNodeAnchorData!.location,
        data.bottomNodeAnchorDataMirrored!.location
      ),
      vec3.fromValues(2, 2, 2)
    );

    if (!bottomControlNode) {
      const {
        dragNode: dragNode1,
        anchorData: anchorData1
      } = createDraggableHTMLAnchor(
        bottomHalfPoint,
        "./icons/atom-variant.svg",
        "position"
      );
      bottomControlNode = dragNode1;
      data.bottomControlNode = dragNode1;
      bottomControlNodeAnchorData = anchorData1;
      data.bottomControlNodeAnchorData = anchorData1;
      anchorData.push(bottomControlNodeAnchorData);
    }
    data.interactionParentNode.addChild(bottomControlNode);

    const sideHalfPoint = vec3.divide(
      vec3.create(),
      vec3.add(
        vec3.create(),
        data.bottomNodeAnchorData!.location,
        data.topNodeAnchorData!.location
      ),
      vec3.fromValues(2, 2, 2)
    );

    if (!sideControlNode) {
      const {
        dragNode: dragNode2,
        anchorData: anchorData2
      } = createDraggableHTMLAnchor(
        sideHalfPoint,
        "./icons/atom-variant.svg",
        "position"
      );
      sideControlNode = dragNode2;
      data.sideControlNode = dragNode2;
      sideControlNodeAnchorData = anchorData2;
      data.sideControlNodeAnchorData = anchorData2;
      anchorData.push(sideControlNodeAnchorData);
    }
    data.interactionParentNode.addChild(sideControlNode);

    if (!sideControlNodeMirrored) {
      const { dragNode: dragNode3, anchorData: anchorData3 } = createHTMLAnchor(
        vec3.fromValues(-sideHalfPoint[0], sideHalfPoint[1], sideHalfPoint[2]),
        "./icons/atom-variant.svg",
        "position"
      );
      sideControlNodeMirrored = dragNode3;
      data.sideControlNodeMirrored = dragNode3;
      sideControlNodeAnchorDataMirrored = anchorData3;
      data.sideControlNodeAnchorDataMirrored = anchorData3;
    }
    data.interactionParentNode.addChild(sideControlNodeMirrored);

    // Create a visualization helper node where we store the intermediate curves
    const node = new TreeNode();
    data.interactionParentNode!.addChild(node);

    // helper node for the top curve
    const threeJsDataTop = new ThreejsData(new THREE.Object3D());
    node.addData(threeJsDataTop);
    // helper node for the side curve
    const threeJsDataSide = new ThreejsData(new THREE.Object3D());
    node.addData(threeJsDataSide);
    // helper node for the bottom curve
    const threeJsDataBottom = new ThreejsData(new THREE.Object3D());
    node.addData(threeJsDataBottom);

    // get the initial point array for the top curve and create it
    threeJsDataTop.obj = createCurve(
      data.topNodeAnchorData!.location,
      data.topControlNodeAnchorData!.location,
      data.topNodeAnchorDataMirrored!.location
    );

    // get the initial point array for the bottom curve and create it
    threeJsDataSide.obj = createNurbsCurve(
      data.topNodeAnchorData!.location,
      data.sideControlNodeAnchorData!.location,
      data.bottomNodeAnchorData!.location,
      true
    );

    // get the initial point array for the side curve and create it
    threeJsDataBottom.obj = createCurve(
      data.bottomNodeAnchorData!.location,
      data.bottomControlNodeAnchorData!.location,
      data.bottomNodeAnchorDataMirrored!.location
    );

    /**
     * The callback that is executed when one of the anchors is moved.
     *
     * The case separation is done depending on which anchor is moved.
     *
     * @param e
     */
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

      let updateCurve = {
        top: false,
        side: false,
        bottom: false
      };

      switch (anchorData) {
        case data.topNodeAnchorData:
          newPosition[0] = Math.min(0, newPosition[0]);
          anchorData.location = newPosition;
          data.topNodeAnchorDataMirrored!.location = vec3.fromValues(
            -anchorData.location[0],
            anchorData.location[1],
            anchorData.location[2]
          );
          updateCurve.top = true;
          updateCurve.side = true;
          break;

        case data.bottomNodeAnchorData:
          newPosition[0] = Math.min(0, newPosition[0]);
          anchorData.location = newPosition;
          data.bottomNodeAnchorDataMirrored!.location = vec3.fromValues(
            -anchorData.location[0],
            anchorData.location[1],
            anchorData.location[2]
          );
          updateCurve.side = true;
          updateCurve.bottom = true;
          break;

        case data.topControlNodeAnchorData:
          newPosition[0] = 0;
          anchorData.location = newPosition;
          updateCurve.top = true;
          break;

        case data.sideControlNodeAnchorData:
          anchorData.location = newPosition;
          data.sideControlNodeAnchorDataMirrored!.location = vec3.fromValues(
            -anchorData.location[0],
            anchorData.location[1],
            anchorData.location[2]
          );
          updateCurve.side = true;
          break;

        case data.bottomControlNodeAnchorData:
          newPosition[0] = 0;
          anchorData.location = newPosition;
          updateCurve.bottom = true;
          break;
      }

      if (updateCurve.top) {
        threeJsDataTop.obj = createCurve(
          data.topNodeAnchorData!.location,
          data.topControlNodeAnchorData!.location,
          data.topNodeAnchorDataMirrored!.location
        );
        threeJsDataTop.updateVersion();
      }

      if (updateCurve.side) {
        threeJsDataSide.obj = createNurbsCurve(
          data.topNodeAnchorData!.location,
          data.sideControlNodeAnchorData!.location,
          data.bottomNodeAnchorData!.location,
          true
        );
        threeJsDataSide.updateVersion();
      }

      if (updateCurve.bottom) {
        threeJsDataBottom.obj = createCurve(
          data.bottomNodeAnchorData!.location,
          data.bottomControlNodeAnchorData!.location,
          data.bottomNodeAnchorDataMirrored!.location
        );
        threeJsDataBottom.updateVersion();
      }

      data.interactionParentNode.updateVersion();
      data.viewport.updateNode(data.interactionParentNode);
    };

    // add the callback to the move  and end events
    moveListenerToken = addListener(EVENTTYPE_INTERACTION.DRAG_MOVE, callback);

    const endCallback = async () => {
      // update with the specified controlpoints

      const simplifyParam = data.session.getParameterByName(
        "Deckpad Color Schemes"
      )[0];
      simplifyParam.value = simplifyParam.choices!.indexOf("Super Simple");

      const points = [
        [
          data.bottomControlNodeAnchorData!.location[0],
          data.bottomControlNodeAnchorData!.location[1],
          data.bottomControlNodeAnchorData!.location[2]
        ],
        [
          data.bottomNodeAnchorDataMirrored!.location[0],
          data.bottomNodeAnchorDataMirrored!.location[1],
          data.bottomNodeAnchorDataMirrored!.location[2]
        ],
        [
          data.sideControlNodeAnchorDataMirrored!.location[0],
          data.sideControlNodeAnchorDataMirrored!.location[1],
          data.sideControlNodeAnchorDataMirrored!.location[2]
        ],
        [
          data.topNodeAnchorDataMirrored!.location[0],
          data.topNodeAnchorDataMirrored!.location[1],
          data.topNodeAnchorDataMirrored!.location[2]
        ],
        [
          data.topControlNodeAnchorData!.location[0],
          data.topControlNodeAnchorData!.location[1],
          data.topControlNodeAnchorData!.location[2]
        ]
      ];

      data.session.getParameterByName("masterPnts")[0].value = JSON.stringify(
        points
      );

      data.session.getParameterByName("Use JSON for Mstr CRV")[0].value = true;
      await data.session.customize();
    };

    endListenerToken = addListener(
      EVENTTYPE_INTERACTION.DRAG_END,
      async (e) => {
        enableImageInteraction();
        callback(e);
        endCallback();
      }
    );

    sceneTree.root.updateVersion();
    data.viewport.update();

    await endCallback();

    for (let o in data.session.outputs)
      if (data.session.outputs[o].node)
        data.session.outputs[o].node!.visible = true;
    data.viewport.update();

    data.topNodeAnchorData!.data.imageElement.style.visibility = "";
    data.topNodeAnchorDataMirrored!.data.imageElement.style.visibility = "";
    data.bottomNodeAnchorData!.data.imageElement.style.visibility = "";
    data.bottomNodeAnchorDataMirrored!.data.imageElement.style.visibility = "";
    data.topControlNodeAnchorData!.data.imageElement.style.visibility = "";
    data.sideControlNodeAnchorData!.data.imageElement.style.visibility = "";
    data.sideControlNodeAnchorDataMirrored!.data.imageElement.style.visibility =
      "";
    data.bottomControlNodeAnchorData!.data.imageElement.style.visibility = "";
  },
  async (data: IStageData) => {
    // remove the listeners
    removeListener(moveListenerToken);
    removeListener(endListenerToken);

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
    data.topControlNodeAnchorData!.data.imageElement.style.visibility =
      "hidden";
    data.sideControlNodeAnchorData!.data.imageElement.style.visibility =
      "hidden";
    data.sideControlNodeAnchorDataMirrored!.data.imageElement.style.visibility =
      "hidden";
    data.bottomControlNodeAnchorData!.data.imageElement.style.visibility =
      "hidden";

    // Cleaning up of the main div.
    const mainDiv = document.getElementById("main-div")!;
    while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.firstChild);
  },
  async (data: IStageData) => {
    // remove the listeners
    removeListener(moveListenerToken);
    removeListener(endListenerToken);

    // Cleaning up of the main div.
    const mainDiv = document.getElementById("main-div")!;
    while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.firstChild);

    // remove the children of the interaction node alltogether
    while (data.interactionParentNode.children.length > 0)
      data.interactionParentNode.removeChild(
        data.interactionParentNode.children[0]
      );
    sceneTree.root.updateVersion();
    data.viewport.update();

    for (let o in data.session.outputs)
      if (data.session.outputs[o].name !== "hull")
        if (data.session.outputs[o].node)
          data.session.outputs[o].node!.visible = false;

    // we added the image elements directly, so we have to remove them manually
    data.topNodeAnchorData!.data.imageElement.style.visibility = "hidden";
    data.topNodeAnchorDataMirrored!.data.imageElement.style.visibility =
      "hidden";
    data.bottomNodeAnchorData!.data.imageElement.style.visibility = "hidden";
    data.bottomNodeAnchorDataMirrored!.data.imageElement.style.visibility =
      "hidden";
    data.topControlNodeAnchorData!.data.imageElement.style.visibility =
      "hidden";
    data.sideControlNodeAnchorData!.data.imageElement.style.visibility =
      "hidden";
    data.sideControlNodeAnchorDataMirrored!.data.imageElement.style.visibility =
      "hidden";
    data.bottomControlNodeAnchorData!.data.imageElement.style.visibility =
      "hidden";
  }
);
