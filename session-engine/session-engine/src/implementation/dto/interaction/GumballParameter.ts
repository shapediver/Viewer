import {
    IInteractionParameterSettings,
    InteractionParameterSettingsType,
    IGumballParameterSettings,
    validateGumballParameterSettings
} from '@shapediver/viewer.shared.types';
import { IGumballParameter } from '../../../interfaces/dto/interaction/IGumballParameter';
import { Parameter } from '../Parameter';
import { SessionEngine } from '../../SessionEngine';
import { ShapeDiverResponseParameter } from '@shapediver/sdk.geometry-api-sdk-v2';

export class GumballParameter extends Parameter<string> implements IGumballParameter {
    // #region Properties (1)

    readonly #sessionEngine: SessionEngine;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(paramDef: ShapeDiverResponseParameter, sessionEngine: SessionEngine) {
        super(paramDef, sessionEngine);
        this.#sessionEngine = sessionEngine;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (9)

    public get enableRotation(): boolean | undefined {
        return this.getGumballProperties()?.enableRotation;
    }

    public get enableScaling(): boolean | undefined {
        return this.getGumballProperties()?.enableScaling;
    }

    public get enableTranslation(): boolean | undefined {
        return this.getGumballProperties()?.enableTranslation;
    }

    public get hover(): boolean | undefined {
        return this.getGumballProperties()?.hover;
    }

    public get interactionType(): InteractionParameterSettingsType {
        return 'gumball';
    }

    public get nameFilter(): string[] | undefined {
        return this.getGumballProperties()?.nameFilter;
    }

    public get scale(): number | undefined {
        return this.getGumballProperties()?.scale;
    }

    public get selectionColor(): string | undefined {
        return this.getGumballProperties()?.selectionColor;
    }

    public get space(): 'local' | 'world' | undefined {
        return this.getGumballProperties()?.space;
    }

    // #endregion Public Getters And Setters (9)

    // #region Private Methods (1)

    private getGumballProperties(): IGumballParameterSettings | undefined {
        const result = validateGumballParameterSettings((this.settings as unknown as IInteractionParameterSettings));
        if (result.success) {
            return (this.settings as unknown as IInteractionParameterSettings).props;
        }
    }

    // #endregion Private Methods (1)
}