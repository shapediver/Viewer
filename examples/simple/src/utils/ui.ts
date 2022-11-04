import { ISessionApi, IViewportApi } from "@shapediver/viewer";
import { UILayout } from "../interfaces/parameterDefinitions";
import { createExportUi } from "./ExportUI";
import { createParameterUi } from "./ParameterUI";

export const createStageMenu = (
  session: ISessionApi,
  viewport: IViewportApi,
  div: HTMLDivElement,
  stage: number,
  info: UILayout
) => {
  const menuGroups: HTMLDivElement[] = [];

  // NOTE UI: Here we create the divs for this menu
  const mainMenuElement = document.createElement("div") as HTMLDivElement;

  // this div contains all of the icons
  const mainMenuIconElement = document.createElement("div") as HTMLDivElement;
  mainMenuIconElement.style.position = "absolute";

  // this div contains only the back button
  const menuBackDiv = document.createElement("div") as HTMLDivElement;
  menuBackDiv.style.position = "absolute";
  menuBackDiv.style.borderWidth = "1px";
  menuBackDiv.style.borderRadius = "0.75rem";
  menuBackDiv.style.borderColor = "rgb(17 24 39/var(--tw-border-opacity))";
  menuBackDiv.style.background = "white";

  // the back button the closes a menu once it is open
  const menuBackIcon = new Image(50, 50);
  menuBackIcon.src =
    "./icons/arrow-left-circle-outline.svg";
  menuBackIcon.style.marginLeft = "20rem";

  // the onclick event to swith visibility
  menuBackIcon.onclick = () => {
    // hide all menu elements
    for (let i = 0; i < menuGroups.length; i++)
      if (menuGroups[i]) menuGroups[i]!.style.visibility = "hidden";

    mainMenuIconElement.style.visibility = "";
    menuBackDiv.style.visibility = "hidden";
  };
  menuBackDiv.style.visibility = "hidden";

  div.appendChild(menuBackDiv);
  menuBackDiv.appendChild(menuBackIcon);
  div.appendChild(mainMenuElement);
  div.appendChild(mainMenuIconElement);

  // go through all the groups specified
  for (let i = 0; i < info.length; i++) {
    if (!info[i]) continue;
    if (info[i].step !== stage) continue;

    // create the menu element
    const menuElement = document.createElement("div") as HTMLDivElement;
    menuElement.style.cssText = `
      position: absolute;
      width: 20rem;    
      max-height: -moz-available;          
      max-height: -webkit-fill-available;  
      max-height: fill-available;
      overflow-y: auto;
    `;
    mainMenuElement.appendChild(menuElement);

    if (info[i].inputsGroup)
      createParameterUi(session, menuElement, info[i].inputsGroup);

    if (info[i].inputs)
      createParameterUi(session, menuElement, undefined, info[i].inputs);

    if (info[i].outputs)
      createExportUi(session, viewport, menuElement, info[i].outputs);

    // create the parameter UI on that element
    menuElement.style.visibility = "hidden";
    menuGroups[i] = menuElement;

    // create the icon for that element
    const menuElementIcon = new Image(100, 100);
    menuElementIcon.src = info[i].icon;
    menuElementIcon.title = info[i].title;
    menuElementIcon.onclick = () => {
      menuElement.style.visibility = "";
      menuBackDiv.style.visibility = "";
      mainMenuIconElement.style.visibility = "hidden";
    };
    mainMenuIconElement.appendChild(menuElementIcon);
  }
};
