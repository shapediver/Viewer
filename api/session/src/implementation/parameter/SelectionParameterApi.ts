import { ISelectionParameter } from '@shapediver/viewer.session-engine.session-engine';
import { ISelectionParameterApi } from '../../interfaces/parameter/ISelectionParameterApi';
import { ParameterApi } from './ParameterApi';

export class SelectionParameterApi extends ParameterApi<string> implements ISelectionParameterApi {
    // #region Properties (1)

    readonly #parameter: ISelectionParameter;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(parameter: ISelectionParameter) {
        super(parameter);
        this.#parameter = parameter;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get hover(): boolean | undefined {
        return this.#parameter.hover;
    }

    public get maximumSelection(): number | undefined {
        return this.#parameter.maximumSelection;
    }

    public get minimumSelection(): number | undefined {
        return this.#parameter.minimumSelection;
    }

    public get nameFilter(): string[] | undefined {
        return this.#parameter.nameFilter;
    }

    // #endregion Public Getters And Setters (4)
}