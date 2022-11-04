import { IStageData, Stage } from "../core/StageManager";
import {
  DataEngine,
  ITreeNode,
  IViewportApi,
  sceneTree
} from "@shapediver/viewer";
import { container } from "tsyringe";
import { BoatsOptions } from "../interfaces/parameterDefinitions";
import { createStageMenu } from "../utils/ui";

const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);

/**
 * STAGE 1
 *
 * The Stage 1 loads a boat mesh via a link provided.
 *
 * NOTE CHRIS: This is to be replace via loading with the GH file. Currently I load this manually.
 */
export const stage1 = new Stage(
  "Load Scan",
  "./icons/tray-arrow-up.svg",
  async (data: IStageData) => {
    data.session.updateCallback = () => {
      for (let o in data.session.outputs)
        if (data.session.outputs[o].name !== "hull")
          if (data.session.outputs[o].node)
            data.session.outputs[o].node!.visible = false;
    };

    const mainDiv = <HTMLDivElement>document.getElementById("main-div")!;

    // create the menu for this stage
    createStageMenu(data.session, data.viewport, mainDiv, 0, data.uiData);

    // NOTE UI: We create a centered div to show an input field and a button.
    // This can of course be replace by any other input method, as long as the callback is called.
    const stage1Div = document.createElement("div");
    stage1Div.style.position = "absolute";
    stage1Div.style.left = "50%";
    stage1Div.style.top = "50%";
    stage1Div.style.transform = "translate(-50%, -50%)";
    mainDiv.appendChild(stage1Div);

    const boatOptions: BoatsOptions = data.session.getOutputByName(
      "boatsOptions"
    )[0].content![0].data;

    // the dropdown
    const dropdownInputElement = document.createElement(
      "select"
    ) as HTMLSelectElement;
    dropdownInputElement.setAttribute("name", "inputElement");
    for (let j = 0; j < boatOptions.length; j++) {
      const boatOption = boatOptions[j];
      let option = document.createElement("option");
      option.setAttribute("value", j + "");
      option.setAttribute("name", boatOption.title);
      option.innerHTML = boatOption.title;
      option.classList.value =
        "block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-gray-300";
      dropdownInputElement.appendChild(option);
    }
    dropdownInputElement.value = -1 + "";
    dropdownInputElement.classList.value =
      "w-full mb-2 mt-2 right-5 text-gray-300 bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-1 py-0.5 text-center inline-flex items-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800";
    stage1Div.appendChild(dropdownInputElement);

    // the callbacks
    dropdownInputElement.onchange = async () => {
      // Hide the div that contains the input and button.
      stage1Div.style.visibility = "hidden";

      data.viewport.show = true;

      data.session.getParameterByName("Boat Title")[0].value =
        boatOptions[+dropdownInputElement.value].title;
      await data.session.customize();

      const boatOutput = data.session.getOutputByName("hull")[0];
      boatOutput.updateCallback = (
        newNode?: ITreeNode,
        oldNode?: ITreeNode
      ) => {
        let matrix = data.boatTransformationMatrix;
        if (newNode) {
          let transformation = newNode.getTransformation("boat_transformation");
          if (!transformation) {
            newNode.addTransformation({
              id: "boat_transformation",
              matrix
            });
          } else {
            transformation.matrix = matrix;
          }
          newNode.updateVersion();
          data.boatNode = newNode;
        }
      };
      data.boatNode = data.session.getOutputByName("hull")[0].node!;

      for (let o in data.session.outputs)
        if (data.session.outputs[o].name !== "hull")
          if (data.session.outputs[o].node)
            data.session.outputs[o].node!.visible = false;

      data.viewport.update();
      data.viewport.show = true;
      data.viewport.camera!.zoomToFactor = 1;
      data.viewport.camera!.zoomTo(data.boatNode.boundingBox);

      // Show the Viewer
      data.viewport.canvas.parentElement!.style.visibility = "";

      data.stageManager.goForward();
    };

    // hide viewer div for now, as it will show the logo otherwise
    data.viewport.canvas.parentElement!.style.visibility = "hidden";
  },
  async (data: IStageData) => {
    (<any>data.session.updateCallback) = undefined;

    // Cleaning up of the main div.
    const mainDiv = document.getElementById("main-div")!;
    while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.firstChild);
  },
  async (data: IStageData) => {}
);
