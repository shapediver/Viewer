import { ShapeDiverRequestGltfUploadQueryConversion, ShapeDiverResponseDto, ShapeDiverResponseExport, ShapeDiverResponseOutput, ShapeDiverResponseParameter } from '@shapediver/sdk.geometry-api-sdk-v2';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { SettingsEngine } from '@shapediver/viewer.shared.services';
import { IExport } from './dto/IExport';
import { IOutput } from './dto/IOutput';
import { IParameter } from './dto/IParameter';

/**
 * The type of the parameter.
 */
export enum PARAMETER_TYPE {
  FLOAT = 'Float',
  INT = 'Int',
  EVEN = 'Even',
  ODD = 'Odd',
  STRING = 'String',
  COLOR = 'Color',
  STRINGLIST = 'StringList',
  BOOL = 'Bool',
  TIME = 'Time',
  FILE = 'File',
  SNUMBER = 'sNumber',
  SINTEGER = 'sInteger',
  SSTRING = 'sString',
  SCOLOR = 'sColor',
  SBOOL = 'sBool',
  STIME = 'sTime',
  SBITMAP = 'sBitmap',
  SDOMAIN = 'sDomain',
  SDOMAIN2D = 'sDomain2D',
  SPOINT = 'sPoint',
  SLINE = 'sLine',
  SVECTOR = 'sVector',
  SBOX = 'sBox',
  SPLANE = 'sPlane',
  SRECTANGLE = 'sRectangle',
  SCURVE = 'sCurve',
  SCIRCLE = 'sCircle',
  SMESH = 'sMesh',
  SSURFACE = 'sSurface',
  SBREP = 'sBrep',
  SSUBDIV = 'sSubdiv'
}

/**
 * Type of visualization which should be used for UI elements representing the parameter.
 */
export enum PARAMETER_VISUALIZATION {
  SLIDER = 'slider',
  SEQUENCE = 'sequence',
  CYCLE = 'cycle',
  DROPDOWN = 'dropdown',
  CHECKLIST = 'checklist',
  CLOCK = 'color',
  CALENDAR = 'calendar',
  TOGGLE = 'toggle',
  SWATCH = 'swatch',
  BUTTON = 'button',
  DIAL = 'dial',
  TEXT = 'text'
}

export interface ISettingsSections {
  session?: {
      parameter?: { 
          /** Option to update the displayname of the parameters (default: false) */
          displayname?: boolean, 
          /** Option to update the order of the parameters (default: false) */
          order?: boolean, 
          /** Option to update the hidden state of the parameters (default: false) */
          hidden?: boolean, 
          /** Option to update the value of the parameters (default: false) */
          value?: boolean 
      },
      export?: { 
          /** Option to update the displayname of the exports (default: false) */
          displayname?: boolean, 
          /** Option to update the order of the exports (default: false) */
          order?: boolean, 
          /** Option to update the hidden state of the exports (default: false) */
          hidden?: boolean 
      }
  },
  viewport?: {
      /** Option to update the ar settings (default: false) */
      ar?: boolean,
      /** Option to update the scene settings (default: false) */
      scene?: boolean,
      /** Option to update the camera settings (default: false) */
      camera?: boolean,
      /** Option to update the light settings (default: false) */
      light?: boolean,
      /** Option to update the environment settings (default: false) */
      environment?: boolean
      /** Option to update the general settings (default: false) */
      general?: boolean
  }
};

export interface ISessionEngine {
  // #region Properties (11)

  bearerToken?: string;
  canUploadGLTF: boolean;
  exports: { [key: string]: IExport };
  id: string;
  initialized: boolean;
  modelViewUrl: string;
  outputs: { [key: string]: IOutput };
  parameters: { [key: string]: IParameter<any> };
  refreshBearerToken: (() => Promise<string>) | undefined;
  settingsEngine: SettingsEngine;
  ticket: string;
  updateCallback: ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null;

  // #endregion Properties (11)

  // #region Public Methods (18)

  applySettings(response: ShapeDiverResponseDto, sections?: ISettingsSections): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  close(): Promise<void>;
  customize(force: boolean): Promise<ITreeNode>;
  customizeParallel(parameterValues: { [key: string]: string }): Promise<ITreeNode>;
  goBack(): Promise<ITreeNode>;
  goForward(): Promise<ITreeNode>;
  init(parameterValues?: { [key: string]: string; }): Promise<void>;
  loadOutputs(cancelRequest: () => boolean): Promise<ITreeNode>;
  loadOutputsParallel(responseDto: ShapeDiverResponseDto, cancelRequest: () => boolean): Promise<ITreeNode>;
  requestExport(exportId: string, parameters: { [key: string]: string }, maxWaitTime: number): Promise<ShapeDiverResponseExport>;
  resetSettings(sections?: ISettingsSections): void;
  saveDefaultParameterValues(): Promise<boolean>;
  saveSettings(viewportId?: string): Promise<boolean>;
  saveUiProperties(): Promise<boolean>;
  updateOutputs(): Promise<ITreeNode>;
  uploadFile(parameterId: string, data: File, type: string): Promise<string>;
  uploadGLTF(blob: Blob, conversion?: ShapeDiverRequestGltfUploadQueryConversion): Promise<ShapeDiverResponseDto>;

  // #endregion Public Methods (18)
}