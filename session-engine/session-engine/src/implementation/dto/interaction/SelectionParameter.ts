import {
    IInteractionParameterSettings,
    InteractionParameterSettingsType,
    ISelectionParameterSettings,
    validateSelectionParameterSettings
} from '@shapediver/viewer.shared.types';
import { ISelectionParameter } from '../../../interfaces/dto/interaction/ISelectionParameter';
import { Parameter } from '../Parameter';
import { SessionEngine } from '../../SessionEngine';
import { ShapeDiverResponseParameter } from '@shapediver/sdk.geometry-api-sdk-v2';

export class SelectionParameter extends Parameter<string> implements ISelectionParameter {
    // #region Properties (1)

    readonly #sessionEngine: SessionEngine;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(paramDef: ShapeDiverResponseParameter, sessionEngine: SessionEngine) {
        super(paramDef, sessionEngine);
        this.#sessionEngine = sessionEngine;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (6)

    public get hover(): boolean | undefined {
        return this.getSelectionProperties()?.hover;
    }

    public get interactionType(): InteractionParameterSettingsType {
        return 'selection';
    }

    public get maximumSelection(): number | undefined {
        return this.getSelectionProperties()?.maximumSelection;
    }

    public get minimumSelection(): number | undefined {
        return this.getSelectionProperties()?.minimumSelection;
    }

    public get nameFilter(): string[] | undefined {
        return this.getSelectionProperties()?.nameFilter;
    }

    public get selectionColor(): string | undefined {
        return this.getSelectionProperties()?.selectionColor;
    }

    // #endregion Public Getters And Setters (6)

    // #region Private Methods (1)

    private getSelectionProperties(): ISelectionParameterSettings | undefined {
        const result = validateSelectionParameterSettings((this.settings as unknown as IInteractionParameterSettings));
        if (result.success) {
            return (this.settings as unknown as IInteractionParameterSettings).props;
        }
    }

    // #endregion Private Methods (1)
}