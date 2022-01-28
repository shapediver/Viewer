
export interface IPresetMaterialDefinition {
    // #region Properties (13)
  
    alphaThreshold?: number;
    bitmaptexture?: string;
    bumpAmplitude?: number;
    bumptexture?: string;
    color?: number[];
    metalness?: number;
    metalnesstexture?: string;
    normaltexture?: string;
    roughness?: number;
    roughnesstexture?: string;
    side?: string;
    transparency?: number;
    transparencytexture?: string;
  
    // #endregion Properties (13)
  }
  
  export interface IMaterialContentData {
      materialpreset?: number,
      materialType?: string,
      version?: string,
  }
  
  export interface IMaterialContentDataV1 extends IMaterialContentData {
      ambient?: number[],
      diffuse?: number[],
      color?: number[],
      emission?: number[],
      specular?: number[],
      shine?: number,
      transparency?: number,
      bitmaptexture?: string,
      bumptexture?: string,
      transparencytexture?: string,
  }
  
  export interface IMaterialContentDataV2 extends IMaterialContentData {
      color?: number[],
      side?: string,
      metalness?: number,
      roughness?: number,
      transparency?: number,
      alphaThreshold?: number,
      bitmaptexture?: string,
      metalnesstexture?: string,
      roughnesstexture?: string,
      bumptexture?: string,
      normaltexture?: string,
      transparencytexture?: string,
      line?: any
  }
  
  export interface IMaterialContentDataV3 extends IMaterialContentData {
      color?: number[],
      side?: string,
      metalness?: number,
      roughness?: number,
      transparency?: number,
      alphaThreshold?: number,
      shadowOpacity?: number,
      lightReflectivity?: number,
      bumpAmplitude?: number,
      threeDNoise?: any
      bitmaptexture?: ITexture,
      metalnesstexture?: ITexture,
      roughnesstexture?: ITexture,
      bumptexture?: ITexture,
      normaltexture?: ITexture,
      transparencytexture?: ITexture,
      line?: any
  }
  
  export interface ITexture {
    // #region Properties (9)
  
    canvas?: any,
    center?: number[],
    color?: number[],
    href?: string,
    offset?: number[],
    repeat?: number[],
    rotation?: number,
    wrapS?: number,
    wrapT?: number
  
    // #endregion Properties (9)
  }
  