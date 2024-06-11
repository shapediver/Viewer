import { DrawingToolsManager, MATERIAL_INDEX } from '../../../DrawingToolsManager';
import { GeometryMathManager } from '../../geometry/GeometryMathManager';
import { GeometryState } from '../../geometry/GeometryState';
import { InteractionManager } from '../InteractionManager';
import { IRay } from '@shapediver/viewer.features.interaction';
import { vec3 } from 'gl-matrix';

export class MidPointInteractionHandler {
    // #region Properties (5)

    readonly #drawingToolsManager: DrawingToolsManager;
    readonly #geometryMathManager: GeometryMathManager;
    readonly #geometryState: GeometryState;

    #midPointInsertionActive: boolean = false;
    #midPointInsertionIndex: number = -1;

    // #endregion Properties (5)

    // #region Constructors (1)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(drawingToolsManager: DrawingToolsManager, interactionManager: InteractionManager) {
        this.#drawingToolsManager = drawingToolsManager;

        this.#geometryState = drawingToolsManager.geometryState;
        this.#geometryMathManager = drawingToolsManager.geometryMathManager;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (2)

    public get midPointInsertionActive(): boolean {
        return this.#midPointInsertionActive;
    }

    public get midPointInsertionIndex(): number {
        return this.#midPointInsertionIndex;
    }

    // #endregion Public Getters And Setters (2)

    // #region Public Methods (3)

    public finishMidPointInsertion(distances: {
        index: number;
        distance: number;
    }[] | undefined): void {
        if (this.#midPointInsertionActive === true) {
            if (distances) {
                // finish mid point insertion if it is the current index
                if (distances[0].index === this.#midPointInsertionIndex) {
                    this.#geometryState.makePointPersistent(this.#midPointInsertionIndex, false);
                    this.#midPointInsertionActive = false;
                    this.#midPointInsertionIndex = -1;
                }
            }
        }
    }

    public onMove(ray: IRay, hoveredPoint?: number): void {
        if (this.#midPointInsertionActive === true && hoveredPoint === this.#midPointInsertionIndex) {
            // we are just waiting for a mouse click to finish the mid point insertion
        } else if (hoveredPoint === undefined && this.#geometryState.canAddPoint()) {
            // check if there is a line close to the ray and add a mid point to it
            const lineDistances = this.#geometryMathManager.checkLineDistances(ray);
            if (lineDistances) {
                let firstIndex = lineDistances[0].index[0];
                let secondIndex = lineDistances[0].index[1];

                if (this.#midPointInsertionActive === true && firstIndex !== this.#midPointInsertionIndex && secondIndex !== this.#midPointInsertionIndex) {
                    // remove last added point
                    this.#drawingToolsManager.removePointTemporary(this.#midPointInsertionIndex);
                    this.#midPointInsertionActive = false;
                    this.#midPointInsertionIndex = -1;

                    // move indices one back if they are after the removal index
                    if (firstIndex > this.#midPointInsertionIndex) {
                        firstIndex--;

                        if (firstIndex < 0)
                            firstIndex = this.#geometryState.getPointCount() - 1;
                    }

                    // move indices one back if they are after the removal index
                    if (secondIndex > this.#midPointInsertionIndex || secondIndex === 0) {
                        secondIndex--;

                        if (secondIndex < 0)
                            secondIndex = this.#geometryState.getPointCount() - 1;
                    }
                }

                if (this.#midPointInsertionActive === false) {
                    const firstPoint = this.#geometryState.getPosition(firstIndex * 3);
                    const secondPoint = this.#geometryState.getPosition(secondIndex * 3);
                    const midPoint = vec3.add(vec3.create(), firstPoint, secondPoint);
                    vec3.scale(midPoint, midPoint, 0.5);

                    this.#midPointInsertionIndex = secondIndex;

                    this.#drawingToolsManager.addPointTemporary(secondIndex, midPoint);
                    this.#drawingToolsManager.updateMaterialIndex(secondIndex, MATERIAL_INDEX.INSERTION);

                    this.#midPointInsertionActive = true;
                }
            } else {
                this.stopMidPointInsertion();
            }
        } else {
            this.stopMidPointInsertion();
        }
    }

    public stopMidPointInsertion(): void {
        if (this.#midPointInsertionActive === true) {
            // remove last added point
            this.#drawingToolsManager.removePointTemporary(this.#midPointInsertionIndex);
            this.#midPointInsertionActive = false;
            this.#midPointInsertionIndex = -1;
        }
    }

    // #endregion Public Methods (3)
}