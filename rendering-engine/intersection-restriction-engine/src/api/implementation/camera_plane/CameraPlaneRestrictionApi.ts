import { AbstractRestrictionApi } from '../AbstractRestrictionApi';
import { CameraPlaneRestriction } from '../../../implementation/restrictions/camera_plane/CameraPlaneRestriction';

export class CameraPlaneRestrictionApi extends AbstractRestrictionApi {
    // #region Properties (1)

    readonly #cameraPlaneRestriction: CameraPlaneRestriction;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(restriction: CameraPlaneRestriction) {
        super(restriction);
        this.#cameraPlaneRestriction = restriction;
    }

    // #endregion Constructors (1)
}