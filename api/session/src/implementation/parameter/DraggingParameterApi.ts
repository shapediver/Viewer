import { IDraggableObject, InteractionParameterSettingsType, RestrictionDefinition } from '@shapediver/viewer.shared.types';
import { IDraggingParameter } from '@shapediver/viewer.session-engine.session-engine';
import { IDraggingParameterApi } from '../../interfaces/parameter/IDraggingParameterApi';
import { ParameterApi } from './ParameterApi';

export class DraggingParameterApi extends ParameterApi<string> implements IDraggingParameterApi {
    // #region Properties (1)

    readonly #parameter: IDraggingParameter;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(parameter: IDraggingParameter) {
        super(parameter);
        this.#parameter = parameter;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (6)

    public get draggingColor(): string | undefined {
        return this.#parameter.draggingColor;
    }

    public get hover(): boolean | undefined {
        return this.#parameter.hover;
    }

    public get hoverColor(): string | undefined {
        return this.#parameter.hoverColor;
    }

    public get interactionType(): InteractionParameterSettingsType {
        return this.#parameter.interactionType;
    }

    public get objects(): IDraggableObject[] | undefined {
        return this.#parameter.objects;
    }

    public get restrictions(): RestrictionDefinition[] | undefined {
        return this.#parameter.restrictions;
    }

    // #endregion Public Getters And Setters (6)
}

export const isDraggingParameterApi = (obj: unknown): obj is IDraggingParameterApi => obj instanceof DraggingParameterApi;