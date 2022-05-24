import { ShapeDiverRequestGltfUploadQueryConversion, ShapeDiverResponseExport, ShapeDiverResponseOutput, ShapeDiverResponseParameter } from '@shapediver/sdk.geometry-api-sdk-v2';
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { SettingsEngine } from '@shapediver/viewer.shared.services';

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
    // #region Properties (9)

    bearerToken?: string;
    canUploadGLTF: boolean;
    exports: { [key: string]: ShapeDiverResponseExport };
    id: string;
    initialized: boolean;
    modelViewUrl: string;
    outputs: { [key: string]: ShapeDiverResponseOutput };
    parameters: { [key: string]: ShapeDiverResponseParameter };
    refreshBearerToken: (() => Promise<string>) | undefined;
    ticket: string;
    settingsEngine: SettingsEngine;

    // #endregion Properties (9)

    // #region Public Methods (4)

    close(): Promise<void>;
    customize(cancelRequest: () => boolean): Promise<ITreeNode>;
    init(parameterValues?: {
      [key: string]: string;
    }): Promise<void>;
    loadOutputs(cancelRequest: () => boolean): Promise<ITreeNode>;
    requestExport(exportId: string, parameters: { [key: string]: string }, maxWaitTime: number): Promise<ShapeDiverResponseExport>;
    uploadFile(parameterId: string, data: File, type: string): Promise<string>;
    uploadGLTF(blob: Blob, conversion?: ShapeDiverRequestGltfUploadQueryConversion): Promise<string>;

    // #endregion Public Methods (4)
}