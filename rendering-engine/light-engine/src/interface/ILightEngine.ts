import { ILightScene } from './ILightScene'

export interface ILightEngine {
    // #region Public Methods (3)

    assignLightScene(id: string): boolean;
    createLightScene(properties: {name?: string, id?: string, standard?: boolean}): ILightScene;
    removeLightScene(id: string): boolean;

    // #endregion Public Methods (3)
}