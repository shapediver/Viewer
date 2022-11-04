import { IStageData, Stage } from "../core/StageManager";
import { createStageMenu } from "../utils/ui";

/**
 * STAGE 5
 *
 * This stage shows the parameter groups as icons.
 * Once clicked, the parameters of that group are shown in a menu with a button to close that menu again.
 */
export const stage6 = new Stage(
  "Design Deckpad",
  "./icons/export.svg",
  async (data: IStageData) => {
    const mainDiv = <HTMLDivElement>document.getElementById("main-div")!;

    // NOTE UI: Add the backwardDiv, which contains a button that executes the goBackward-function of the StageManager.
    mainDiv.appendChild(data.backwardDiv);

    // create the menu for this stage
    createStageMenu(data.session, data.viewport, mainDiv, 5, data.uiData);
  },
  async (data: IStageData) => {
    // Cleaning up of the main div.
    const mainDiv = document.getElementById("main-div")!;
    while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.firstChild);
  },
  async () => {
    // Cleaning up of the main div.
    const mainDiv = document.getElementById("main-div")!;
    while (mainDiv.firstChild) mainDiv.removeChild(mainDiv.firstChild);
  }
);
