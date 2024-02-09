import { IRestrictionApi } from '../../api/interfaces/IRestrictionApi';

// #region Interfaces (1)

export interface IRestriction extends IRestrictionApi {
    // #region Properties (2)

    restrictionType: RestrictionType;
    showVisualization: boolean;

    // #endregion Properties (2)

    // #region Public Methods (1)

    removeVisualization(): void;

    // #endregion Public Methods (1)
}

// #endregion Interfaces (1)

// #region Enums (1)

export enum RestrictionType {
    INTERACTION = 'interaction',
    SNAP = 'snap'
}

// #endregion Enums (1)
