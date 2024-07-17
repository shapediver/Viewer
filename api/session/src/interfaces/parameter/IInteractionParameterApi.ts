import { IParameterApi } from './IParameterApi';
import { InteractionParameterSettingsType, } from '@shapediver/viewer.shared.types';

export interface IInteractionParameterApi extends IParameterApi<string> {
    // #region Properties (1)

    interactionType: InteractionParameterSettingsType

    // #endregion Properties (1)
}
