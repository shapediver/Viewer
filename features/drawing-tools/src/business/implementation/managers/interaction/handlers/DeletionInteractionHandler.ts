import { DrawingToolsManager } from '../../../DrawingToolsManager';
import { EventEngine, EVENTTYPE_DRAWING_TOOLS } from '@shapediver/viewer.shared.services';
import { GeometryMathManager } from '../../geometry/GeometryMathManager';
import { InteractionManager } from '../InteractionManager';
import { IRay, IViewportApi } from '@shapediver/viewer.features.interaction';

export class DeletionInteractionHandler {
    // #region Properties (4)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #eventEngine = EventEngine.instance;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #viewport: IViewportApi;

    // #endregion Properties (4)

    // #region Constructors (1)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(drawingToolsManager: DrawingToolsManager, interactionManager: InteractionManager) {
        this.#drawingToolsManager = drawingToolsManager;
        this.#viewport = drawingToolsManager.viewport;
        this.#geometryMathManager = drawingToolsManager.geometryMathManager;
    }

    // #endregion Constructors (1)

    // #region Public Methods (2)

    public deletePoint(ray: IRay): void {
        // check if there is a point close to the ray
        const distances = this.#geometryMathManager.checkPointDistances(ray);
        if (distances) {
            // add the id if it is not already in the array
            // remove it if it is in the array
            this.#drawingToolsManager.removePoint(distances[0].index);
            this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.REMOVED, { viewportId: this.#viewport.id, drawingToolsId: this.#drawingToolsManager.uuid });
        }
    }

    public deleteSelection(indices: number[]): void {
        if(indices.length === 0) return;
        this.#drawingToolsManager.removePoints(indices);
        this.#eventEngine.emitEvent(EVENTTYPE_DRAWING_TOOLS.REMOVED, { viewportId: this.#viewport.id, drawingToolsId: this.#drawingToolsManager.uuid });
    }

    // #endregion Public Methods (2)
}