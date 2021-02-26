import { container, singleton } from 'tsyringe';

import { Canvas } from './Canvas';

import { UuidGenerator } from '@shapediver/viewer.shared.utils';

@singleton()
export class CanvasEngine {
    // #region Properties (2)

    private readonly _canvasDictionary: {
        [key: string]: Canvas
    } = {};
    protected readonly _uuidGenerator = container.resolve(UuidGenerator);

    // #endregion Properties (2)

    // #region Public Methods (1)

    /**
     * Creates a canvas object that could in the future be expanded to hold more information
     * The definition of the canvas can be:
     * - empty: A canvas is created with an unique ID.
     * - string: 
     *      - If a canvas with this ID was created, this canvas is returned.
     *      - If there is an HTMLCanvasElement in the document with this ID, this is used.
     *      - If there is no HTMLElement found in the document with this ID, a canvas with ID will be created.
     * - HTMLCanvasElement: A Canvas Object will be created with this element. If there is no ID, one will be generated.
     * 
     * @param canvasDefinition the definition of this canvas
     */
    public createCanvasObject(canvasDefinition?: string | HTMLCanvasElement): Canvas {
        if (canvasDefinition instanceof HTMLCanvasElement) {
            // a canvas was provided
            const canvasElement = (<HTMLCanvasElement>canvasDefinition);
            if (!canvasElement.id)
                canvasElement.id = this._uuidGenerator.create();
            this._canvasDictionary[canvasElement.id] = new Canvas(canvasElement.id, canvasElement);
            return this._canvasDictionary[canvasElement.id];
        }

        if (canvasDefinition) {
            const id: string = canvasDefinition;
            const canvasElement = document.getElementById(id);

            if (this._canvasDictionary[id])
                return this._canvasDictionary[id];

            if (canvasElement instanceof HTMLCanvasElement) {
                // id of a canvas was provided
                this._canvasDictionary[id] = new Canvas(id, canvasElement);
                return this._canvasDictionary[id];
            } else if(!canvasElement) {
                // no HTMLElement could be found, create Canvas with the id
                this._canvasDictionary[id] = new Canvas(id);
                return this._canvasDictionary[id];
            }
        }

        const id = this._uuidGenerator.create();
        this._canvasDictionary[id] = new Canvas(id);
        return this._canvasDictionary[id];
    }

    // #endregion Public Methods (1)
}