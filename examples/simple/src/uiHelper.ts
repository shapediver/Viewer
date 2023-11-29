import {
    ENVIRONMENT_MAP,
    FLAG_TYPE,
    ITreeNode,
    IViewportApi,
    MaterialEngine
  } from '@shapediver/viewer';
  import {
    Color,
    GeometryData,
    MaterialGemData,
    MaterialStandardData
  } from '@shapediver/viewer.shared.types';
  import {
    IColorElement,
    IDropdownElement,
    ISliderElement,
    IStringElement,
    createCustomUi
  } from '@shapediver/viewer.utils.demo-helper';
  
  type GemMaterialSettings = {
    refractionIndex: number;
    impurityMap?: string;
    impurityScale: number;
    colorTransferBegin: Color;
    colorTransferEnd: Color;
    gamma: number;
    contrast: number;
    brightness: number;
    dispersion: number;
    tracingDepth: number;
    tracingOpacity: number;
    envMap?: string;
  };
  
  type StandardMaterialSettings = {
    color: Color;
    map?: string;
    roughness: number;
    metalness: number;
    metalnessRoughnessMap?: string;
    normalMap?: string;
    emissiveness: Color;
    emissiveMap?: string;
    clearcoat?: number;
    clearcoatRoughness?: number;
  };
  
  const defaultGemMaterial = new MaterialGemData({
    refractionIndex: 2.4,
    dispersion: 0.1,
    tracingOpacity: 1,
    tracingDepth: 6,
    gamma: 1.25,
    contrast: 2.25,
    brightness: 0.25,
    colorTransferBegin: '#c2d9ff'
  });
  const defaultStandardMaterial = new MaterialStandardData({
    roughness: 0,
    metalness: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.25
  });
  
  export const standardMaterials: {
    [key: string]: {
      node: ITreeNode | undefined;
      materialSettings: StandardMaterialSettings;
      div: HTMLDivElement;
    };
  } = {
    head: {
      node: undefined,
      materialSettings: {
        color: defaultStandardMaterial.color,
        map: undefined,
        roughness: defaultStandardMaterial.roughness,
        metalness: defaultStandardMaterial.metalness,
        metalnessRoughnessMap: undefined,
        normalMap: undefined,
        emissiveness: defaultStandardMaterial.emissiveness,
        emissiveMap: undefined,
        clearcoat: defaultStandardMaterial.clearcoat,
        clearcoatRoughness: defaultStandardMaterial.clearcoatRoughness
      },
      div: document.createElement('div')
    },
    shank: {
      node: undefined,
      materialSettings: {
        color: defaultStandardMaterial.color,
        map: undefined,
        roughness: defaultStandardMaterial.roughness,
        metalness: defaultStandardMaterial.metalness,
        metalnessRoughnessMap: undefined,
        normalMap: undefined,
        emissiveness: defaultStandardMaterial.emissiveness,
        emissiveMap: undefined,
        clearcoat: defaultStandardMaterial.clearcoat,
        clearcoatRoughness: defaultStandardMaterial.clearcoatRoughness
      },
      div: document.createElement('div')
    }
  };
  export const gemMaterials: {
    [key: string]: {
      node: ITreeNode | undefined;
      materialSettings: GemMaterialSettings;
      div: HTMLDivElement;
    };
  } = {
    gemstone: {
      node: undefined,
      materialSettings: {
        refractionIndex: defaultGemMaterial.refractionIndex,
        impurityMap: undefined,
        impurityScale: defaultGemMaterial.impurityScale,
        colorTransferBegin: defaultGemMaterial.colorTransferBegin,
        colorTransferEnd: defaultGemMaterial.colorTransferEnd,
        gamma: defaultGemMaterial.gamma,
        contrast: defaultGemMaterial.contrast,
        brightness: defaultGemMaterial.brightness,
        dispersion: defaultGemMaterial.dispersion,
        tracingDepth: defaultGemMaterial.tracingDepth,
        tracingOpacity: defaultGemMaterial.tracingOpacity,
        envMap:
          typeof defaultGemMaterial.envMap === 'string'
            ? (defaultGemMaterial.envMap as string)
            : undefined
      },
      div: document.createElement('div')
    },
    accentStones: {
      node: undefined,
      materialSettings: {
        refractionIndex: defaultGemMaterial.refractionIndex,
        impurityMap: undefined,
        impurityScale: defaultGemMaterial.impurityScale,
        colorTransferBegin: defaultGemMaterial.colorTransferBegin,
        colorTransferEnd: defaultGemMaterial.colorTransferEnd,
        gamma: defaultGemMaterial.gamma,
        contrast: defaultGemMaterial.contrast,
        brightness: defaultGemMaterial.brightness,
        dispersion: defaultGemMaterial.dispersion,
        tracingDepth: 3,
        tracingOpacity: defaultGemMaterial.tracingOpacity,
        envMap:
          typeof defaultGemMaterial.envMap === 'string'
            ? (defaultGemMaterial.envMap as string)
            : undefined
      },
      div: document.createElement('div')
    },
    secretStones_0: {
        node: undefined,
        materialSettings: {
          refractionIndex: defaultGemMaterial.refractionIndex,
          impurityMap: undefined,
          impurityScale: defaultGemMaterial.impurityScale,
          colorTransferBegin: defaultGemMaterial.colorTransferBegin,
          colorTransferEnd: defaultGemMaterial.colorTransferEnd,
          gamma: defaultGemMaterial.gamma,
          contrast: defaultGemMaterial.contrast,
          brightness: defaultGemMaterial.brightness,
          dispersion: defaultGemMaterial.dispersion,
          tracingDepth: 3,
          tracingOpacity: defaultGemMaterial.tracingOpacity,
          envMap:
            typeof defaultGemMaterial.envMap === 'string'
              ? (defaultGemMaterial.envMap as string)
              : undefined
        },
        div: document.createElement('div')
      },
      secretStones_1: {
          node: undefined,
          materialSettings: {
            refractionIndex: defaultGemMaterial.refractionIndex,
            impurityMap: undefined,
            impurityScale: defaultGemMaterial.impurityScale,
            colorTransferBegin: defaultGemMaterial.colorTransferBegin,
            colorTransferEnd: defaultGemMaterial.colorTransferEnd,
            gamma: defaultGemMaterial.gamma,
            contrast: defaultGemMaterial.contrast,
            brightness: defaultGemMaterial.brightness,
            dispersion: defaultGemMaterial.dispersion,
            tracingDepth: 3,
            tracingOpacity: defaultGemMaterial.tracingOpacity,
            envMap:
              typeof defaultGemMaterial.envMap === 'string'
                ? (defaultGemMaterial.envMap as string)
                : undefined
          },
          div: document.createElement('div')
        },
  };
  
  export const materials = Object.assign({}, standardMaterials, gemMaterials);
  
  const jsonDownload = document.getElementById(
    'materialJsonDownload'
  ) as HTMLInputElement;
  jsonDownload.onclick = (e) => {
    const materialSettings: {
      [key: string]: GemMaterialSettings | StandardMaterialSettings;
    } = {};
    for (const m in materials) {
      materialSettings[m] = materials[m].materialSettings;
    }
    const data =
      'text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(materialSettings, null, 2));
    const a = document.createElement('a');
    a.href = 'data:' + data;
    a.download = 'materialSettings.json';
    a.click();
  };
  
  /**
   * This helper function assigns a material to each material component of the node.
   *
   * @param node
   */
  export const assignGemMaterial = async (
    viewport: IViewportApi,
    node: ITreeNode
  ) => {
    if (!node) return;
    const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
  
    let material: MaterialGemData | null = null;
    try {
      material = new MaterialGemData({
        refractionIndex: gemMaterials[node.name].materialSettings.refractionIndex,
        impurityMap:
          gemMaterials[node.name].materialSettings.impurityMap !== undefined
            ? (await MaterialEngine.instance.loadMap(
                gemMaterials[node.name].materialSettings.impurityMap!
              )) || undefined
            : undefined,
        impurityScale: gemMaterials[node.name].materialSettings.impurityScale,
        colorTransferBegin:
          gemMaterials[node.name].materialSettings.colorTransferBegin,
        colorTransferEnd:
          gemMaterials[node.name].materialSettings.colorTransferEnd,
        gamma: gemMaterials[node.name].materialSettings.gamma,
        contrast: gemMaterials[node.name].materialSettings.contrast,
        brightness: gemMaterials[node.name].materialSettings.brightness,
        dispersion: gemMaterials[node.name].materialSettings.dispersion,
        tracingDepth: gemMaterials[node.name].materialSettings.tracingDepth,
        tracingOpacity: gemMaterials[node.name].materialSettings.tracingOpacity,
        envMap:
          typeof gemMaterials[node.name].materialSettings.envMap === 'string'
            ? (gemMaterials[node.name].materialSettings.envMap as string)
            : undefined
      });
      viewport.removeFlag(token);
    } catch (e) {
      viewport.removeFlag(token);
      alert('Something went wrong when trying to load the texture.');
    }
  
    node.traverseData(async (d) => {
      if (d instanceof GeometryData) (<GeometryData>d).material = material;
    });
    node.updateVersion();
  };
  
  export const assignStandardMaterial = async (
    viewport: IViewportApi,
    node: ITreeNode
  ) => {
    if (!node) return;
    const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
  
    let material: MaterialStandardData | null = null;
    try {
      material = new MaterialStandardData({
        color: standardMaterials[node.name].materialSettings.color,
        map:
          standardMaterials[node.name].materialSettings.map !== undefined
            ? (await MaterialEngine.instance.loadMap(
                standardMaterials[node.name].materialSettings.map!
              )) || undefined
            : undefined,
        roughness: standardMaterials[node.name].materialSettings.roughness,
        metalness: standardMaterials[node.name].materialSettings.metalness,
        metalnessRoughnessMap:
          standardMaterials[node.name].materialSettings.metalnessRoughnessMap !==
          undefined
            ? (await MaterialEngine.instance.loadMap(
                standardMaterials[node.name].materialSettings
                  .metalnessRoughnessMap!
              )) || undefined
            : undefined,
        normalMap:
          standardMaterials[node.name].materialSettings.normalMap !== undefined
            ? (await MaterialEngine.instance.loadMap(
                standardMaterials[node.name].materialSettings.normalMap!
              )) || undefined
            : undefined,
        emissiveness: standardMaterials[node.name].materialSettings.emissiveness,
        emissiveMap:
          standardMaterials[node.name].materialSettings.emissiveMap !== undefined
            ? (await MaterialEngine.instance.loadMap(
                standardMaterials[node.name].materialSettings.emissiveMap!
              )) || undefined
            : undefined,
        clearcoat: standardMaterials[node.name].materialSettings.clearcoat,
        clearcoatRoughness:
          standardMaterials[node.name].materialSettings.clearcoatRoughness
      });
      viewport.removeFlag(token);
    } catch (e) {
      viewport.removeFlag(token);
      alert('Something went wrong when trying to load the texture.');
    }
  
    node.traverseData(async (d) => {
      if (d instanceof GeometryData) (<GeometryData>d).material = material;
    });
    node.updateVersion();
  };
  
  export const createGemMaterialMenu = (
    viewport: IViewportApi,
    divElement: HTMLDivElement,
    name: string
  ) => {
    if (!gemMaterials[name].node) return;
  
    createCustomUi(
      [
        <ISliderElement>{
          name: 'refractionIndex',
          onChangeCallback: (value: any) => {
            gemMaterials[name].materialSettings.refractionIndex = value;
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'slider',
          min: 1,
          max: 4,
          step: 0.001,
          value: gemMaterials[name].materialSettings.refractionIndex
        },
        <IStringElement>{
          name: 'impurityMap',
          onChangeCallback: async (value: any) => {
            gemMaterials[name].materialSettings.impurityMap = value;
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'string',
          value: ''
        },
        <ISliderElement>{
          name: 'impurityScale',
          onChangeCallback: (value: any) => {
            gemMaterials[name].materialSettings.impurityScale = value;
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'slider',
          min: 0,
          max: 1,
          step: 0.001,
          value: gemMaterials[name].materialSettings.impurityScale
        },
        <IColorElement>{
          name: 'colorTransferBegin',
          onChangeCallback: (value: any) => {
            gemMaterials[name].materialSettings.colorTransferBegin = value;
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'color',
          value: gemMaterials[name].materialSettings.colorTransferBegin
        },
        <IColorElement>{
          name: 'colorTransferEnd',
          onChangeCallback: (value: any) => {
            gemMaterials[name].materialSettings.colorTransferEnd = value;
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'color',
          value: gemMaterials[name].materialSettings.colorTransferEnd
        },
        <ISliderElement>{
          name: 'gamma',
          onChangeCallback: (value: any) => {
            gemMaterials[name].materialSettings.gamma = value;
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'slider',
          min: 0,
          max: 2,
          step: 0.001,
          value: gemMaterials[name].materialSettings.gamma
        },
        <ISliderElement>{
          name: 'contrast',
          onChangeCallback: (value: any) => {
            gemMaterials[name].materialSettings.contrast = value;
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'slider',
          min: 0,
          max: 5,
          step: 0.001,
          value: gemMaterials[name].materialSettings.contrast
        },
        <ISliderElement>{
          name: 'brightness',
          onChangeCallback: (value: any) => {
            gemMaterials[name].materialSettings.brightness = value;
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'slider',
          min: -1,
          max: 1,
          step: 0.001,
          value: gemMaterials[name].materialSettings.brightness
        },
        <ISliderElement>{
          name: 'dispersion',
          onChangeCallback: (value: any) => {
            gemMaterials[name].materialSettings.dispersion = value;
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'slider',
          min: 0,
          max: 1,
          step: 0.001,
          value: gemMaterials[name].materialSettings.dispersion
        },
        <ISliderElement>{
          name: 'tracing depth',
          onChangeCallback: (value: any) => {
            gemMaterials[name].materialSettings.tracingDepth = value;
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'slider',
          min: 1,
          max: 10,
          step: 1,
          value: gemMaterials[name].materialSettings.tracingDepth
        },
        <ISliderElement>{
          name: 'tracing opacity',
          onChangeCallback: (value: any) => {
            gemMaterials[name].materialSettings.tracingOpacity = value;
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'slider',
          min: 0,
          max: 1,
          step: 0.001,
          value: gemMaterials[name].materialSettings.tracingOpacity
        },
        <IDropdownElement>{
          name: 'environment map',
          onChangeCallback: (value: any) => {
            gemMaterials[name].materialSettings.envMap = Object.values(
              ENVIRONMENT_MAP
            )[value];
            assignGemMaterial(viewport, gemMaterials[name].node!);
          },
          type: 'dropdown',
          choices: Object.values(ENVIRONMENT_MAP),
          value:
            typeof gemMaterials[name].materialSettings.envMap === 'string'
              ? Object.values(ENVIRONMENT_MAP).indexOf(
                  gemMaterials[name].materialSettings.envMap as ENVIRONMENT_MAP
                )
              : -1
        }
      ],
      divElement
    );
  };
  
  export const createStandardMaterialMenu = (
    viewport: IViewportApi,
    divElement: HTMLDivElement,
    name: string
  ) => {
    if (!standardMaterials[name].node) return;
  
    createCustomUi(
      [
        <IColorElement>{
          name: 'color',
          onChangeCallback: (value: any) => {
            standardMaterials[name].materialSettings.color = value;
            assignStandardMaterial(viewport, standardMaterials[name].node!);
          },
          type: 'color',
          value: standardMaterials[name].materialSettings.color
        },
        <IStringElement>{
          name: 'map',
          onChangeCallback: async (value: any) => {
            standardMaterials[name].materialSettings.map = value;
            assignStandardMaterial(viewport, standardMaterials[name].node!);
          },
          type: 'string',
          value: ''
        },
        <ISliderElement>{
          name: 'roughness',
          onChangeCallback: (value: any) => {
            standardMaterials[name].materialSettings.roughness = value;
            assignStandardMaterial(viewport, standardMaterials[name].node!);
          },
          type: 'slider',
          min: 0,
          max: 1,
          step: 0.001,
          value: standardMaterials[name].materialSettings.roughness
        },
        <ISliderElement>{
          name: 'metalness',
          onChangeCallback: (value: any) => {
            standardMaterials[name].materialSettings.metalness = value;
            assignStandardMaterial(viewport, standardMaterials[name].node!);
          },
          type: 'slider',
          min: 0,
          max: 1,
          step: 0.001,
          value: standardMaterials[name].materialSettings.metalness
        },
        <IStringElement>{
          name: 'metalnessRoughnessMap',
          onChangeCallback: async (value: any) => {
            standardMaterials[
              name
            ].materialSettings.metalnessRoughnessMap = value;
            assignStandardMaterial(viewport, standardMaterials[name].node!);
          },
          type: 'string',
          value: ''
        },
        <IStringElement>{
          name: 'normalMap',
          onChangeCallback: async (value: any) => {
            standardMaterials[name].materialSettings.normalMap = value;
            assignStandardMaterial(viewport, standardMaterials[name].node!);
          },
          type: 'string',
          value: ''
        },
        <IColorElement>{
          name: 'emissiveness',
          onChangeCallback: (value: any) => {
            standardMaterials[name].materialSettings.emissiveness = value;
            assignStandardMaterial(viewport, standardMaterials[name].node!);
          },
          type: 'color',
          value: standardMaterials[name].materialSettings.color
        },
        <IStringElement>{
          name: 'emissiveMap',
          onChangeCallback: async (value: any) => {
            standardMaterials[name].materialSettings.emissiveMap = value;
            assignStandardMaterial(viewport, standardMaterials[name].node!);
          },
          type: 'string',
          value: ''
        },
        <ISliderElement>{
          name: 'clearcoat',
          onChangeCallback: (value: any) => {
            standardMaterials[name].materialSettings.clearcoat = value;
            assignStandardMaterial(viewport, standardMaterials[name].node!);
          },
          type: 'slider',
          min: 0,
          max: 1,
          step: 0.001,
          value: standardMaterials[name].materialSettings.clearcoat
        },
        <ISliderElement>{
          name: 'clearcoatRoughness',
          onChangeCallback: (value: any) => {
            standardMaterials[name].materialSettings.clearcoatRoughness = value;
            assignStandardMaterial(viewport, standardMaterials[name].node!);
          },
          type: 'slider',
          min: 0,
          max: 1,
          step: 0.001,
          value: standardMaterials[name].materialSettings.clearcoatRoughness
        }
      ],
      divElement
    );
  };
  