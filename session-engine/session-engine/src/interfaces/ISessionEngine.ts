import { IExport } from './dto/IExport';
import { IOutput } from './dto/IOutput';
import { IParameter } from './dto/IParameter';
import { ISettingsSections } from '@shapediver/viewer.shared.types';
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';
import { OutputLoaderTaskEventInfo } from '../implementation/OutputLoader';
import { SettingsEngine } from '@shapediver/viewer.shared.services';
import {
  ShapeDiverRequestCustomization,
  ShapeDiverRequestExport,
  ShapeDiverRequestGltfUploadQueryConversion,
  ShapeDiverResponseDto,
  ShapeDiverResponseExport,
  ShapeDiverResponseFileInfo
} from '@shapediver/sdk.geometry-api-sdk-v2';

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

  // #region Public Methods (23)

  applySettings(response: ShapeDiverResponseDto, sections?: ISettingsSections): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  close(): Promise<void>;
  customize(force: boolean, waitForViewportUpdate?: boolean): Promise<ITreeNode | ShapeDiverResponseDto>;
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
  uploadFileParameters(parameterValues?: { [key: string]: string | File | Blob }): Promise<{ [key: string]: string }>
  uploadGLTF(blob: Blob, conversion?: ShapeDiverRequestGltfUploadQueryConversion): Promise<ShapeDiverResponseDto>;

  // #endregion Public Methods (23)
}