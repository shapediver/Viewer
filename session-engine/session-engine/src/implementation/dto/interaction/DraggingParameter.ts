import {
    IDraggableObject,
    IDraggingParameterProps,
    IInteractionParameterSettings,
    InteractionParameterSettingsType,
    RestrictionDefinition,
    validateDraggingParameterSettings
} from '@shapediver/viewer.shared.types';
import { IDraggingParameter } from '../../../interfaces/dto/interaction/IDraggingParameter';
import { Parameter } from '../Parameter';
import { SessionEngine } from '../../SessionEngine';
import { ShapeDiverResponseParameter } from '@shapediver/sdk.geometry-api-sdk-v2';

export class DraggingParameter extends Parameter<string> implements IDraggingParameter {
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

    public get draggingColor(): string | undefined {
        return this.getDraggingProperties()?.draggingColor;
    }

    public get hover(): boolean | undefined {
        return this.getDraggingProperties()?.hover;
    }

    public get hoverColor(): string | undefined {
        return this.getDraggingProperties()?.hoverColor;
    }

    public get interactionType(): InteractionParameterSettingsType {
        return 'dragging';
    }

    public get objects(): IDraggableObject[] | undefined {
        return this.getDraggingProperties()?.objects;
    }

    public get restrictions(): RestrictionDefinition[] | undefined {
        return this.getDraggingProperties()?.restrictions;
    }

    // #endregion Public Getters And Setters (6)

    // #region Private Methods (1)

    private getDraggingProperties(): IDraggingParameterProps | undefined {
        const result = validateDraggingParameterSettings((this.settings as unknown as IInteractionParameterSettings));
        if (result.success) {
            return (this.settings as unknown as IInteractionParameterSettings).props;
        }
    }

    // #endregion Private Methods (1)
}