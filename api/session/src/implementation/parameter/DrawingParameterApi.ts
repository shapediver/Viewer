import { IDrawingParameter } from '@shapediver/viewer.session-engine.session-engine';
import { IDrawingParameterApi } from '../../interfaces/parameter/IDrawingParameterApi';
import { ParameterApi } from './ParameterApi';

export class DrawingParameterApi extends ParameterApi<string> implements IDrawingParameterApi {
    // #region Properties (1)

    readonly #parameter: IDrawingParameter;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(parameter: IDrawingParameter) {
        super(parameter);
        this.#parameter = parameter;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (2)

    public get geometry(): IDrawingParameterApi['geometry'] | undefined {
        return this.#parameter.geometry;
    }

    public get restrictions(): IDrawingParameterApi['restrictions'] | undefined {
        return this.#parameter.restrictions;
    }

    // #endregion Public Getters And Setters (2)
}

export const isDrawingParameterApi = (obj: unknown): obj is IDrawingParameterApi => obj instanceof DrawingParameterApi;