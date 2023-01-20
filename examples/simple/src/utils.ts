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
  ISliderElement,
  IStringElement
} from "@shapediver/viewer.utils.demo-helper";
import { container } from "tsyringe";

import { XMLParser } from 'fast-xml-parser';
import { modelOptions, viewport } from ".";

const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);

let materialMenus: HTMLDivElement[] = [];
let pendantNode: ITreeNode;

(<any>ENVIRONMENT_MAP).FOOTPRINT_COURT = "https://viewer.shapediver.com/v3/envmaps/2k/footprintCourt_2k.hdr";


export type Option = {
  value: string;
  label: string;
};

type Content = {
  Key: string;
  LastModified: string;
  Size: number;
  Type: string;
  StorageClass: string;
  Owner: {
    ID: number;
    DisplayName: number;
  };
};

const URL = 'https://bocci.sfo3.digitaloceanspaces.com';
const pattern = /^configurator\/([0-9a-z]+)\/([0-9a-z_]+)\.gltf$/i;
let currentOption: Option;

export const fetchPendants = (): Promise<Option[]> =>
  fetch(URL)
    .then((res) => res.text())
    .then((data) => new XMLParser().parse(data))
    .then((data) => {
      const contents = data.ListBucketResult.Contents as Content[];

      return contents
        .filter((item) => pattern.test(item.Key))
        .map((content): Option => {
          const contentResult = pattern.exec(content.Key)!;

          return {
            label: `${contentResult[0]}`,
            value: `${URL}/${content.Key}`,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    });

type MaterialSettings = {
  [key: string]: {
    [key: string]: {
      alphaMode?: MATERIAL_ALPHA,
      color?: string,
      ior?: number,
      thickness?: number,
      opacity?: number
    }
  }
}

let materialSettings: MaterialSettings = require('./materialSettings.json');

const jsonUpload = document.getElementById('materialJsonUpload') as HTMLInputElement;
jsonUpload.oninput = (e) => {
  // Exit if no files selected
  if (!jsonUpload.files) return;

  let file = jsonUpload.files[0];
  const reader = new FileReader();
  reader.addEventListener("load", async () => {
      materialSettings = JSON.parse(<string>reader.result);
      addGLTF(currentOption);
  });
  reader.readAsText(file);
}

const jsonDownload = document.getElementById('materialJsonDownload') as HTMLInputElement;
jsonDownload.onclick = (e) => {
  var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(materialSettings, null, 2));
  const a = document.createElement('a');
  a.href = "data:" + data;
  a.download = "materialSettings.json";
  a.click();
}


/**
 * Create the material menus.
 * For every material that can be found, a new entry is created that enables the editing of the alpha blending and side options.
 * More can be added in the future.
 *
 * @returns
 */
export const createMaterialMenu = (option: Option) => {
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

    if(materialSettings[option.label]) {
      const settings = materialSettings[option.label][materials[i].materialData.name || ''];

      if(settings) {
        if(settings.alphaMode !== undefined)
          materials[i].materialData.alphaMode = settings.alphaMode;
      
        if(settings.color !== undefined)
          materials[i].materialData.color = settings.color;
          
        if(settings.ior !== undefined)
          materials[i].materialData.ior = settings.ior;
            
        if(settings.thickness !== undefined)
          materials[i].materialData.thickness = settings.thickness;
              
        if(settings.opacity !== undefined)
          materials[i].materialData.opacity = settings.opacity;
        
        materials[i].materialData.updateVersion();
        materials[i].geometryData.updateVersion();
        materials[i].node.updateVersion();
      }   
    }


    createCustomUi(
      [
        <IDropdownElement>{
          choices: Object.values(MATERIAL_ALPHA),
          value: Object.values(MATERIAL_ALPHA).indexOf(materials[i].materialData.alphaMode),
          name: "Material Alpha Mode",
          type: "dropdown",
          onInputCallback: (value: any) => { },
          onChangeCallback: async (value: any) => {
            if(!materialSettings[option.label])
              materialSettings[option.label] = {};
            if(!materialSettings[option.label][materials[i].materialData.name!])
              materialSettings[option.label][materials[i].materialData.name!] = {};
            materialSettings[option.label][materials[i].materialData.name!].alphaMode = Object.values(MATERIAL_ALPHA)[ value ];

            materials[i].materialData.alphaMode = Object.values(MATERIAL_ALPHA)[ value ];
            materials[i].materialData.updateVersion();
            materials[i].geometryData.updateVersion();
            materials[i].node.updateVersion();
          }
        },
        <IStringElement>{
          value: materials[i].materialData.color,
          name: "Material Color",
          type: "string",
          onInputCallback: (value: any) => { },
          onChangeCallback: async (value: any) => {            
            if(!materialSettings[option.label])
              materialSettings[option.label] = {};
            if(!materialSettings[option.label][materials[i].materialData.name!])
              materialSettings[option.label][materials[i].materialData.name!] = {};
            materialSettings[option.label][materials[i].materialData.name!].color = value;

            materials[i].materialData.color = value;
            materials[i].materialData.updateVersion();
            materials[i].geometryData.updateVersion();
            materials[i].node.updateVersion();
          }
        },
        <ISliderElement>{
          value: materials[i].materialData.ior,
          name: "Material IOR",
          type: "slider",
          min: 1.0,
          max: 4.0,
          step: 0.001,
          onInputCallback: (value: any) => {
            if(!materialSettings[option.label])
              materialSettings[option.label] = {};
            if(!materialSettings[option.label][materials[i].materialData.name!])
              materialSettings[option.label][materials[i].materialData.name!] = {};
            materialSettings[option.label][materials[i].materialData.name!].ior = +value;

            materials[i].materialData.ior = +value;
            materials[i].materialData.updateVersion();
            materials[i].geometryData.updateVersion();
            materials[i].node.updateVersion();
          },
          onChangeCallback: async (value: any) => {}
        },
        <ISliderElement>{
          value: materials[i].materialData.thickness,
          name: "Material Thickness",
          type: "slider",
          min: 0,
          max: 1.0,
          step: 0.001,
          onInputCallback: (value: any) => {
            if(!materialSettings[option.label])
              materialSettings[option.label] = {};
            if(!materialSettings[option.label][materials[i].materialData.name!])
              materialSettings[option.label][materials[i].materialData.name!] = {};
            materialSettings[option.label][materials[i].materialData.name!].thickness = +value;

            materials[i].materialData.thickness = +value;
            materials[i].materialData.updateVersion();
            materials[i].geometryData.updateVersion();
            materials[i].node.updateVersion();
           },
          onChangeCallback: async (value: any) => {}
        },
        <ISliderElement>{
          value: materials[i].materialData.opacity,
          name: "Material Opacity",
          type: "slider",
          min: 0,
          max: 1.0,
          step: 0.001,
          onInputCallback: (value: any) => {
            if(!materialSettings[option.label])
              materialSettings[option.label] = {};
            if(!materialSettings[option.label][materials[i].materialData.name!])
              materialSettings[option.label][materials[i].materialData.name!] = {};
            materialSettings[option.label][materials[i].materialData.name!].opacity = +value;

            materials[i].materialData.opacity = +value;
            materials[i].materialData.updateVersion();
            materials[i].geometryData.updateVersion();
            materials[i].node.updateVersion();
           },
          onChangeCallback: async (value: any) => {}
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
export const addGLTF = async (option: Option) => {
  currentOption = option;
  if (pendantNode) sceneTree.removeNode(pendantNode);

  const menuDiv = document.getElementById("menu") as HTMLDivElement;
  for (let i = 0; i < materialMenus.length; i++)
    menuDiv.removeChild(materialMenus[i]);

  materialMenus = [];

  pendantNode = await dataEngine.loadContent({
    format: "gltf",
    href: option.value
  });

  createMaterialMenu(option);

  sceneTree.addNode(pendantNode);
  viewport.update();
  viewport.camera!.zoomToFactor = 2;
  await viewport.camera!.zoomTo(sceneTree.root.boundingBox);
};

/**
 * Create the main menu with options for selecting models,
 * environment maps, viewing the environment map and the background color.
 *
 */
export const createMenu = () => {
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
        choices: modelOptions.map(o => o.label),
        value: 0,
        name: "Models",
        type: "dropdown",
        onInputCallback: (value: any) => { },
        onChangeCallback: async (value: any) => {
          const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
          console.log(+value, modelOptions[+value].label, modelOptions[+value].value)
          await addGLTF(modelOptions[+value]);
          viewport.removeFlag(token);
        }
      },
      <IStringElement>{
        value: "",
        name: "Direct GLTF Link",
        type: "string",
        onInputCallback: (value: any) => { },
        onChangeCallback: async (value: any) => {
          const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
          try {
            await addGLTF(value);
          } catch (e) {

          } finally {
            viewport.removeFlag(token);
          }
        }
      },
      <IDropdownElement>{
        choices: Object.values(ENVIRONMENT_MAP),
        value: Object.values(ENVIRONMENT_MAP).indexOf(
          (<any>ENVIRONMENT_MAP).FOOTPRINT_COURT
        ),
        name: "Environment Map",
        type: "dropdown",
        onInputCallback: (value: any) => { },
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
        onInputCallback: (value: any) => { },
        onChangeCallback: async (value: any) => {
          viewport.environmentMapAsBackground = value;
        }
      },
      <IStringElement>{
        value: "#35363a",
        name: "Background Color",
        type: "string",
        onInputCallback: (value: any) => { },
        onChangeCallback: async (value: any) => {
          viewport.clearColor = value;
        }
      }
    ],
    mainMenuDiv as HTMLDivElement
  );
};
