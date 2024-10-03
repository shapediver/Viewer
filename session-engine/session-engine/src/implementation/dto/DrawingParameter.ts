import { Parameter } from './Parameter';
import { SessionEngine } from '../SessionEngine';
import { ShapeDiverResponseParameter } from '@shapediver/sdk.geometry-api-sdk-v2';
import { IDrawingParameter } from '../../interfaces/dto/IDrawingParameter';
import { IDrawingParameterSettings, validateDrawingParameterSettings } from '@shapediver/viewer.shared.types';

export class DrawingParameter extends Parameter<string> implements IDrawingParameter {
    // #region Properties (1)

    readonly #sessionEngine: SessionEngine;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(paramDef: ShapeDiverResponseParameter, sessionEngine: SessionEngine) {
        super(paramDef, sessionEngine);
        this.#sessionEngine = sessionEngine;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (2)

    public get geometry(): IDrawingParameterSettings['geometry'] | undefined {
        return this.getDrawingProperties()?.geometry;
    }

    public get restrictions(): IDrawingParameterSettings['restrictions'] | undefined {
        return this.getDrawingProperties()?.restrictions;
    }

    // #endregion Public Getters And Setters (2)

    // #region Private Methods (1)

    private getDrawingProperties(): IDrawingParameterSettings | undefined {
        const result = validateDrawingParameterSettings((this.settings as unknown as IDrawingParameterSettings));
        if (result.success) {
            return this.settings as unknown as IDrawingParameterSettings;
        }
    }

    // #endregion Private Methods (1)
}