import {
  ITreeNode,
  sceneTree,
  ThreejsData,
  TreeNode
} from "@shapediver/viewer";
import { mat4, quat, vec3 } from "gl-matrix";
import { IStageData, Stage } from "../core/StageManager";
import {
  createCustomUi,
  IDropdownElement,
  ISliderElement
} from "../utils/CustomUI";
import * as THREE from "three";
import { createStageMenu } from "../utils/ui";

let rotationX = 0,
  rotationY = 0,
  rotationZ = 0;
let translationX = 0,
  translationY = 0,
  translationZ = 0;
let scale = 1;

let threeJsDataGrid: ThreejsData;
let gridNode: ITreeNode;

/**
 * The options that are displayed in the scaling dropdown.
 *
 * NOTE CHRIS: You can of course add new options here. As long as they have the same format (string: number), this will be shown in the dropdown and applied automatically.
 */
const ScalingOptions = {
  none: 1,
  "m -> mm": 1000,
  "mm -> m": 0.001,
  "inch -> mm": 25.4
};

/**
 * Create a transformation matrix with the translation, rotation and scaling values that were specified in the UI.
 *
 * @returns the transformation matrix
 */
const createTransformationMatrix = () => {
  const rotationMatrix = mat4.fromQuat(
    mat4.create(),
    quat.fromEuler(quat.create(), rotationX, rotationY, rotationZ)
  );
  const translationMatrix = mat4.fromTranslation(
    mat4.create(),
    vec3.fromValues(translationX, translationY, translationZ)
  );
  const scalingMatrix = mat4.fromScaling(
    mat4.create(),
    vec3.fromValues(scale, scale, scale)
  );

  return mat4.multiply(
    mat4.create(),
    mat4.multiply(mat4.create(), translationMatrix, rotationMatrix),
    scalingMatrix
  );
};

/**
 * Apply the transformation matrix to the boat.
 *
 * @param node
 * @param matrix
 */
const applyTransformationMatrix = (node: ITreeNode, matrix: mat4) => {
  let transformation = node.getTransformation("boat_transformation");
  if (!transformation) {
    node.addTransformation({
      id: "boat_transformation",
      matrix
    });
  } else {
    transformation.matrix = matrix;
  }
  node.updateVersion();
};

/**
 * Helper function to get a string of the bounding box size to display in the menu.
 *
 * @param node
 * @returns
 */
const boundingBoxSizeToString = (node: ITreeNode) => {
  const x =
    Math.round((node.boundingBox.max[0] - node.boundingBox.min[0]) * 100) / 100;
  const y =
    Math.round((node.boundingBox.max[1] - node.boundingBox.min[1]) * 100) / 100;
  const z =
    Math.round((node.boundingBox.max[2] - node.boundingBox.min[2]) * 100) / 100;
  return `${x} x ${y} x ${z}`;
};

/**
 * Create helper grids to visualize the X, Y & Z axis.
 *
 * @param node
 */
const createHelperGrid = (node: ITreeNode) => {
  const width = node.boundingBox.max[0] - node.boundingBox.min[0];
  const height = node.boundingBox.max[1] - node.boundingBox.min[1];
  const max = Math.max(width, height);

  const obj = new THREE.Object3D();

  const gridX = new THREE.GridHelper(
    max * 2,
    40,
    new THREE.Color("#ff0000"),
    new THREE.Color("#660000")
  );
  const gridY = new THREE.GridHelper(
    max * 2,
    40,
    new THREE.Color("#00ff00"),
    new THREE.Color("#006600")
  );
  const gridZ = new THREE.GridHelper(
    max * 2,
    40,
    new THREE.Color("#0000ff"),
    new THREE.Color("#000066")
  );

  gridX.rotateX(Math.PI / 2);
  obj.add(gridX);

  gridY.rotateZ(Math.PI / 2);
  obj.add(gridY);

  obj.add(gridZ);

  threeJsDataGrid.obj = obj;
};

/**
 * STAGE 2
 *
 * This stage can translate, rotate and scale the boat mesh.
 * Helper grids are shown on the X, Y and Z axis to help with the alignment.
 */
export const stage2 = new Stage(
  "Position Scan",
  "./icons/axis-z-rotate-counterclockwise.svg",
  async (data: IStageData) => {
    const mainDiv = <HTMLDivElement>document.getElementById("main-div")!;

    data.session.updateCallback = () => {
      for (let o in data.session.outputs)
        if (data.session.outputs[o].name !== "hull")
          if (data.session.outputs[o].node)
            data.session.outputs[o].node!.visible = false;
    };

    // create the menu for this stage
    createStageMenu(data.session, data.viewport, mainDiv, 1, data.uiData);

    // NOTE UI: Add the forwardDiv, which contains a button that executes the goForward-function of the StageManager.
    mainDiv.appendChild(data.forwardDiv);
    // NOTE UI: Add the backwardDiv, which contains a button that executes the goBackward-function of the StageManager.
    mainDiv.appendChild(data.backwardDiv);

    // NOTE UI: Create the menu div.
    const menuElement = document.createElement("div");
    menuElement.style.position = "absolute";
    menuElement.style.width = "20rem";
    mainDiv.appendChild(menuElement);

    // Create the grids that are used for visualization of the axis and add them to the scene.
    gridNode = new TreeNode();
    threeJsDataGrid = new ThreejsData(new THREE.Object3D());
    gridNode.addData(threeJsDataGrid);
    data.interactionParentNode.addChild(gridNode);
    createHelperGrid(data.boatNode!);
    sceneTree.root.updateVersion();
    data.viewport.update();

    // Create the label that is shown on top of the menu that shows the current bounding box.
    const valueLabel: HTMLLabelElement = document.createElement("label");
    valueLabel.classList.value =
      "mt-2 text-sm font-medium text-gray-900 dark:text-gray-300";
    valueLabel.innerHTML = boundingBoxSizeToString(data.boatNode!);
    menuElement.appendChild(valueLabel);

    // Create the UI
    createCustomUi(
      [
        <IDropdownElement>{
          name: "Scale",
          type: "dropdown",
          onChangeCallback: (value: string) => {
            scale = Object.values(ScalingOptions)[+value];

            // When the scale value changes, we also have to update the grids to not be over/under sized.
            const matrix = createTransformationMatrix();
            data.boatTransformationMatrix = matrix;
            applyTransformationMatrix(data.boatNode!, matrix);
            data.viewport.update();
            createHelperGrid(data.boatNode!);
            data.viewport.update();

            // When all is updated, we move the camera closer to the new bounding box.
            const cameraData = data.viewport.camera!.calculateZoomTo(
              undefined,
              vec3.create(),
              vec3.create()
            );
            data.viewport.camera!.set(cameraData.position, cameraData.target);

            // Update the label that shows the current bounding box size
            valueLabel.innerHTML = boundingBoxSizeToString(data.boatNode!);
          },
          choices: Object.keys(ScalingOptions),
          value: 0
        },
        <ISliderElement>{
          name: "Translation X",
          type: "slider",
          min: -1000,
          max: 1000,
          step: 1,
          value: translationX,
          onInputCallback: (value: number) => {
            translationX = value;
            const matrix = createTransformationMatrix();
            data.boatTransformationMatrix = matrix;
            applyTransformationMatrix(data.boatNode!, matrix);
          }
        },
        <ISliderElement>{
          name: "Translation Y",
          type: "slider",
          min: -1000,
          max: 1000,
          step: 1,
          value: translationY,
          onInputCallback: (value: number) => {
            translationY = value;
            const matrix = createTransformationMatrix();
            data.boatTransformationMatrix = matrix;
            applyTransformationMatrix(data.boatNode!, matrix);
          }
        },
        <ISliderElement>{
          name: "Translation Z",
          type: "slider",
          min: -1000,
          max: 1000,
          step: 1,
          value: translationZ,
          onInputCallback: (value: number) => {
            translationZ = value;
            const matrix = createTransformationMatrix();
            data.boatTransformationMatrix = matrix;
            applyTransformationMatrix(data.boatNode!, matrix);
          }
        },
        <ISliderElement>{
          name: "Rotation X",
          type: "slider",
          min: -180,
          max: 180,
          step: 0.01,
          value: rotationX,
          onInputCallback: (value: number) => {
            rotationX = value;
            const matrix = createTransformationMatrix();
            data.boatTransformationMatrix = matrix;
            applyTransformationMatrix(data.boatNode!, matrix);
          }
        },
        <ISliderElement>{
          name: "Rotation Y",
          type: "slider",
          min: -180,
          max: 180,
          step: 0.01,
          value: rotationY,
          onInputCallback: (value: number) => {
            rotationY = value;
            const matrix = createTransformationMatrix();
            data.boatTransformationMatrix = matrix;
            applyTransformationMatrix(data.boatNode!, matrix);
          }
        },
        <ISliderElement>{
          name: "Rotation Z",
          type: "slider",
          min: -180,
          max: 180,
          step: 0.01,
          value: rotationZ,
          onInputCallback: (value: number) => {
            rotationZ = value;
            const matrix = createTransformationMatrix();
            data.boatTransformationMatrix = matrix;
            applyTransformationMatrix(data.boatNode!, matrix);
          }
        }
      ],
      menuElement
    );
  },
  async (data: IStageData) => {
    (<any>data.session.updateCallback) = undefined;

    // Remove the grids that were used for the visualization of the axis.
    data.interactionParentNode!.removeChild(gridNode);

    // Cleaning up of the main div.
    const mainDiv = document.getElementById("main-div")!;
    while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.firstChild);
  },
  async (data: IStageData) => {
    rotationX = 0;
    rotationY = 0;
    rotationZ = 0;
    translationX = 0;
    translationY = 0;
    translationZ = 0;
    scale = 1;
    const matrix = createTransformationMatrix();
    data.boatTransformationMatrix = matrix;

    (<any>data.session.updateCallback) = undefined;

    // Remove the grids that were used for the visualization of the axis.
    data.interactionParentNode!.removeChild(gridNode);

    // Cleaning up of the main div.
    const mainDiv = document.getElementById("main-div")!;
    while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.firstChild);
  }
);
