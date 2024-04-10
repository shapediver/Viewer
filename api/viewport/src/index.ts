import { createViewport, viewports } from './main';
import { IAmbientLightApi } from './interfaces/lights/types/IAmbientLightApi';
import { ICameraApi } from './interfaces/camera/ICameraApi';
import { IDirectionalLightApi } from './interfaces/lights/types/IDirectionalLightApi';
import { IHemisphereLightApi } from './interfaces/lights/types/IHemisphereLightApi';
import { ILightApi } from './interfaces/lights/ILightApi';
import { ILightSceneApi } from './interfaces/lights/ILightSceneApi';
import { IOrthographicCameraApi } from './interfaces/camera/IOrthographicCameraApi';
import { IPerspectiveCameraApi } from './interfaces/camera/IPerspectiveCameraApi';
import { IPointLightApi } from './interfaces/lights/types/IPointLightApi';
import { ISpotLightApi } from './interfaces/lights/types/ISpotLightApi';
import { IViewportApi } from './interfaces/IViewportApi';

export { ICameraApi, IOrthographicCameraApi, IPerspectiveCameraApi, IAmbientLightApi, IDirectionalLightApi, IHemisphereLightApi, IPointLightApi, ISpotLightApi, ILightApi, ILightSceneApi, IViewportApi };

export { createViewport, viewports };