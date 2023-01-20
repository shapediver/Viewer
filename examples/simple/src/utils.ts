import {
    addListener,
    DataEngine,
    ENVIRONMENT_MAP,
    EVENTTYPE,
    FLAG_TYPE,
    GeometryData,
    ITaskEvent,
    ITreeNode,
    IViewportApi,
    MaterialStandardData,
    MATERIAL_ALPHA,
    MATERIAL_SIDE,
    sceneTree,
    TASK_TYPE
  } from "@shapediver/viewer";
  import {
    createCustomUi,
    IBooleanElement,
    IDropdownElement,
    IStringElement
  } from "@shapediver/viewer.utils.demo-helper";
  import { container } from "tsyringe";
  import { models, path } from ".";
  
  const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);
  
  let materialMenus: HTMLDivElement[] = [];
  let pendantNode: ITreeNode;
  
  /**
   * Create the material menus.
   * For every material that can be found, a new entry is created that enables the editing of the alpha blending and side options.
   * More can be added in the future.
   *
   * @returns
   */
  export const createMaterialMenu = () => {
    if (!pendantNode) return;
  
    const materials: {
      node: ITreeNode;
      materialData: MaterialStandardData;
      geometryData: GeometryData;
    }[] = [];
  
    // read out all new materials and store them into the array
    const getGeometries = async (node: ITreeNode) => {
      for (let i = 0; i < node.data.length; i++) {
        if (node.data[i] instanceof GeometryData) {
          const geometryData = <GeometryData>node.data[i];
          const materialData = <MaterialStandardData>(
            geometryData.primitive.material
          );
          if (!materialData) continue;
          if (
            materialData.name &&
            materials.find((m) => m.materialData.name === materialData.name)
          )
            continue;
          materials.push({
            node,
            materialData,
            geometryData
          });
        }
      }
  
      for (let i = 0; i < node.children.length; i++)
        getGeometries(node.children[i]);
    };
    getGeometries(pendantNode);
  
    const menuDiv = document.getElementById("menu") as HTMLDivElement;
  
    // add a menu item for all materials in the array
    for (let i = 0; i < materials.length; i++) {
      const materialMenuDiv = document.createElement("div");
      materialMenus.push(materialMenuDiv);
      menuDiv.appendChild(materialMenuDiv);
  
      const h6 = document.createElement("h6");
      h6.classList.value = "text-lg font-bold dark:text-white";
      h6.innerText = materials[i].materialData.name || "Material " + i;
  
      materialMenuDiv.appendChild(h6);
  
      createCustomUi(
        [
          <IDropdownElement>{
            choices: Object.values(MATERIAL_ALPHA),
            value: Object.values(MATERIAL_ALPHA).indexOf(
              materials[i].materialData.alphaMode
            ),
            name: "Material Alpha Mode",
            type: "dropdown",
            onInputCallback: (value: any) => {},
            onChangeCallback: async (value: any) => {
              materials[i].materialData.alphaMode = Object.values(MATERIAL_ALPHA)[
                value
              ];
              materials[i].materialData.updateVersion();
              materials[i].geometryData.updateVersion();
              materials[i].node.updateVersion();
            }
          },
          <IDropdownElement>{
            choices: Object.values(MATERIAL_SIDE),
            value: Object.values(MATERIAL_SIDE).indexOf(
              materials[i].materialData.side
            ),
            name: "Material Side",
            type: "dropdown",
            onInputCallback: (value: any) => {},
            onChangeCallback: async (value: any) => {
              materials[i].materialData.side = Object.values(MATERIAL_SIDE)[
                value
              ];
              materials[i].materialData.updateVersion();
              materials[i].geometryData.updateVersion();
              materials[i].node.updateVersion();
            }
          }
        ],
        materialMenuDiv as HTMLDivElement
      );
    }
  };
  
  /**
   * Add a new gltf to the scene and create a material menu for it.
   *
   * @param url
   */
  export const addGLTF = async (viewport: IViewportApi, url: string) => {
    if (pendantNode) sceneTree.removeNode(pendantNode);
  
    const menuDiv = document.getElementById("menu") as HTMLDivElement;
    for (let i = 0; i < materialMenus.length; i++)
      menuDiv.removeChild(materialMenus[i]);
  
    materialMenus = [];
  
    pendantNode = await dataEngine.loadContent({
      format: "gltf",
      href: url
    });
  
    createMaterialMenu();
  
    sceneTree.addNode(pendantNode);
    viewport.update();
    await viewport.camera!.zoomTo(sceneTree.root.boundingBox);
  };
  
  /**
   * Create the main menu with options for selecting models,
   * environment maps, viewing the environment map and the background color.
   *
   */
  export const createMenu = (viewport: IViewportApi) => {
    const menuDiv = document.getElementById("menu") as HTMLDivElement;
  
    const mainMenuDiv = document.createElement("div");
    menuDiv.appendChild(mainMenuDiv);
  
    const h6 = document.createElement("h6");
    h6.classList.value = "text-lg font-bold dark:text-white";
    h6.innerText = "Main Settings";
  
    mainMenuDiv.appendChild(h6);
  
    createCustomUi(
      [
        <IDropdownElement>{
          choices: models,
          value: 0,
          name: "Models",
          type: "dropdown",
          onInputCallback: (value: any) => {},
          onChangeCallback: async (value: any) => {
            const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
            await addGLTF(viewport, path + models[+value]);
            viewport.removeFlag(token);
          }
        },
        <IStringElement>{
          value: "",
          name: "Direct GLTF Link",
          type: "string",
          onInputCallback: (value: any) => {},
          onChangeCallback: async (value: any) => {
            const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
            try {
                await addGLTF(viewport, value);
            } catch(e) {

            } finally {
                viewport.removeFlag(token);
            }
          }
        },
        <IDropdownElement>{
          choices: Object.values(ENVIRONMENT_MAP),
          value: Object.values(ENVIRONMENT_MAP).indexOf(
            ENVIRONMENT_MAP.PHOTO_STUDIO
          ),
          name: "Environment Map",
          type: "dropdown",
          onInputCallback: (value: any) => {},
          onChangeCallback: async (value: any) => {
            const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
            const promise = new Promise<void>((resolve) => {
              addListener(EVENTTYPE.TASK.TASK_END, (e) => {
                const taskEvent = e as ITaskEvent;
                if (taskEvent.type === TASK_TYPE.ENVIRONMENT_MAP_LOADING)
                  resolve();
              });
            });
            viewport.environmentMap = Object.values(ENVIRONMENT_MAP)[value];
            await promise;
            viewport.removeFlag(token);
          }
        },
        <IBooleanElement>{
          value: false,
          name: "View Environment Map",
          type: "boolean",
          onInputCallback: (value: any) => {},
          onChangeCallback: async (value: any) => {
            viewport.environmentMapAsBackground = value;
          }
        },
        <IStringElement>{
          value: "#35363a",
          name: "Background Color",
          type: "string",
          onInputCallback: (value: any) => {},
          onChangeCallback: async (value: any) => {
            viewport.clearColor = value;
          }
        }
      ],
      mainMenuDiv as HTMLDivElement
    );
  };
  