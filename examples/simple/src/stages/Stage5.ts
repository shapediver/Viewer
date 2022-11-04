import {
  CAMERA_TYPE,
  ITreeNode,
  ORTHOGRAPHIC_CAMERA_DIRECTION
} from "@shapediver/viewer";
import { IStageData, Stage } from "../core/StageManager";
import { createParameterUi } from "../utils/ParameterUI";
import { createStageMenu } from "../utils/ui";
import { mat4 } from "gl-matrix";

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
 * STAGE 5
 *
 * This stage shows the parameter groups as icons.
 * Once clicked, the parameters of that group are shown in a menu with a button to close that menu again.
 */
export const stage5 = new Stage(
  "Design Deckpad",
  "./icons/palette-swatch-outline.svg",
  async (data: IStageData) => {
    const mainDiv = <HTMLDivElement>document.getElementById("main-div")!;

    // don't show the viewport while updating the scene
    data.viewport.show = false;

    const simplifyParam = data.session.getParameterByName(
      "Deckpad Color Schemes"
    )[0];
    simplifyParam.value = simplifyParam.choices!.indexOf("STORM");

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
    // data.session.getParameterByName("Simple Hull")[0].value = false;

    await data.session.customize();

    // NOTE UI: Add the forwardDiv, which contains a button that executes the goForward-function of the StageManager.
    mainDiv.appendChild(data.forwardDiv);
    // NOTE UI: Add the backwardDiv, which contains a button that executes the goBackward-function of the StageManager.
    mainDiv.appendChild(data.backwardDiv);

    // create the menu for this stage
    createStageMenu(data.session, data.viewport, mainDiv, 4, data.uiData);

    applyTransformationMatrix(
      data.session.getOutputByName("hull")[0].node!,
      data.boatTransformationMatrix!
    );
    data.viewport.update();

    // show the scene and switch to the perspective camera
    data.viewport.show = true;
    const camera = Object.values(data.viewport.cameras).find(
      (c) => c.type === CAMERA_TYPE.PERSPECTIVE
    )!;
    data.viewport.assignCamera(camera.id);
  },
  async (data: IStageData) => {
    // Cleaning up of the main div.
    const mainDiv = document.getElementById("main-div")!;
    while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.firstChild);
  },
  async (data: IStageData) => {
    // Cleaning up of the main div.
    const mainDiv = document.getElementById("main-div")!;
    while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.firstChild);

    data.viewport.show = false;
    data.viewport.update();

    const simplifyParam = data.session.getParameterByName(
      "Deckpad Color Schemes"
    )[0];
    simplifyParam.value = simplifyParam.choices!.indexOf("Super Simple");
    await data.session.customize();

    data.viewport.show = true;

    // Create an orthographic camera in the top view.
    const topCamera = data.viewport.createOrthographicCamera();
    topCamera.direction = ORTHOGRAPHIC_CAMERA_DIRECTION.TOP;
    data.viewport.assignCamera(topCamera.id);

    // And zoom that camera to the boat mesh
    topCamera.zoomToFactor = 1.5;
    topCamera.zoomTo(data.boatNode!.boundingBox, { duration: 0 });
  }
);
