import { ShapeDiverRequestCustomization, ShapeDiverRequestExport, ShapeDiverRequestGltfUploadQueryConversion, ShapeDiverResponseDto, ShapeDiverResponseExport, ShapeDiverResponseFileInfo, ShapeDiverResponseParameterType, ShapeDiverResponseParameterVisualization } from '@shapediver/sdk.geometry-api-sdk-v2';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { SettingsEngine } from '@shapediver/viewer.shared.services';
import { OutputLoaderTaskEventInfo } from '../implementation/OutputLoader';
import { IExport } from './dto/IExport';
import { IOutput } from './dto/IOutput';
import { IParameter } from './dto/IParameter';

/**
 * The type of the parameter.
 */
export {
  ShapeDiverResponseParameterType as PARAMETER_TYPE,
  ShapeDiverResponseParameterVisualization as PARAMETER_VISUALIZATION
};

export interface ISettingsSections {
  // #region Properties (2)

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
    /** Option to update the postprocessing settings (default: false) */
    postprocessing?: boolean
  }

  // #endregion Properties (2)
}

export interface ISessionEngine {
  // #region Properties (13)

  readonly jwtToken?: string;

  canUploadGLTF: boolean;
  exports: { [key: string]: IExport };
  guid?: string;
  id: string;
  initialized: boolean;
  modelViewUrl: string;
  outputs: { [key: string]: IOutput };
  parameters: { [key: string]: IParameter<unknown> };
  refreshJwtToken: (() => Promise<string>) | undefined;
  settingsEngine: SettingsEngine;
  ticket?: string;
  updateCallback: ((newNode: ITreeNode, oldNode: ITreeNode) => void) | null;

  // #endregion Properties (13)

  // #region Public Methods (21)

  applySettings(response: ShapeDiverResponseDto, sections?: ISettingsSections): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  close(): Promise<void>;
  customize(force: boolean, waitForViewportUpdate?: boolean):Promise<ITreeNode | ShapeDiverResponseDto>;
  customizeParallel(parameterValues: { [key: string]: string }, loadOutputs: boolean): Promise<ITreeNode | ShapeDiverResponseDto>;
  getFileInfo(parameterId: string, fileId: string): Promise<ShapeDiverResponseFileInfo>
  goBack(): Promise<ITreeNode>;
  goForward(): Promise<ITreeNode>;
  init(parameterValues?: { [key: string]: string; }): Promise<void>;
  loadCachedOutputsParallel(outputMapping: { [key: string]: string }, taskEventInfo?: OutputLoaderTaskEventInfo, retry?: boolean): Promise<{ [key: string]: ITreeNode | undefined }>;
  loadOutputs(cancelRequest: () => boolean, taskEventInfo: OutputLoaderTaskEventInfo): Promise<ITreeNode>;
  loadOutputsParallel(responseDto: ShapeDiverResponseDto, cancelRequest: () => boolean, taskEventInfo: OutputLoaderTaskEventInfo): Promise<ITreeNode>;
  requestExport(exportId: string, parameters: ShapeDiverRequestCustomization, maxWaitTime: number): Promise<ShapeDiverResponseExport>;
  requestExports(body: ShapeDiverRequestExport, loadOutputs?: boolean, maxWaitMsec?: number): Promise<ShapeDiverResponseDto>;
  resetSettings(sections?: ISettingsSections): void;
  saveDefaultParameterValues(): Promise<boolean>;
  saveSettings(viewportId?: string): Promise<boolean>;
  saveUiProperties(): Promise<boolean>;
  setJwtToken(token: string): Promise<void>;
  updateOutputs(taskEventInfo?: OutputLoaderTaskEventInfo, waitForViewportUpdate?: boolean): Promise<ITreeNode>;
  uploadFile(parameterId: string, data: File, type: string): Promise<string>;
  uploadGLTF(blob: Blob, conversion?: ShapeDiverRequestGltfUploadQueryConversion): Promise<ShapeDiverResponseDto>;

  // #endregion Public Methods (21)
}