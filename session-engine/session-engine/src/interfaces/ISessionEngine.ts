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

  applySettings(response: ShapeDiverResponseDto, sections?: {
    session?: {
      parameter?: {
        displayname?: boolean,
        order?: boolean,
        hidden?: boolean,
        value?: boolean
      },
      export?: {
        displayname?: boolean,
        order?: boolean,
        hidden?: boolean
      }
    },
    viewport?: {
      scene?: boolean,
      camera?: boolean,
      light?: boolean,
      environment?: boolean
    }
  }): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  close(): Promise<void>;
  customize(force: boolean): Promise<ITreeNode>;
  customizeParallel(parameterValues: { [key: string]: string }, force: boolean): Promise<ITreeNode>;
  goBack(): Promise<ITreeNode>;
  goForward(): Promise<ITreeNode>;
  init(parameterValues?: {
    [key: string]: string;
  }): Promise<void>;
  loadOutputs(cancelRequest: () => boolean): Promise<ITreeNode>;
  requestExport(exportId: string, parameters: { [key: string]: string }, maxWaitTime: number): Promise<ShapeDiverResponseExport>;
  saveDefaultParameterValues(): Promise<boolean>;
  saveSettings(viewportId?: string): Promise<boolean>;
  saveUiProperties(): Promise<boolean>;
  updateOutputs(): Promise<ITreeNode>;
  uploadFile(parameterId: string, data: File, type: string): Promise<string>;
  uploadGLTF(blob: Blob, conversion?: ShapeDiverRequestGltfUploadQueryConversion): Promise<string>;

  // #endregion Public Methods (18)
}