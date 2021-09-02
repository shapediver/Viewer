import { container, singleton } from 'tsyringe'
import { UuidGenerator } from '@shapediver/viewer.shared.services'

import { Canvas } from './Canvas'
import { ICanvasEngine } from '../interfaces/ICanvasEngine'
import { ICanvas } from '../interfaces/ICanvas'

@singleton()
export class CanvasEngine implements ICanvasEngine {
    // #region Properties (4)

    private readonly _canvasDictionary: {
        [key: string]: Canvas
    } = {};

    protected readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

    // #endregion Properties (4)

    // #region Public Methods (2)

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
    public createCanvasObject(canvasDefinition?: string | HTMLCanvasElement, storageId?: string): string {
        storageId = storageId !== undefined && this._uuidGenerator.validate(storageId) ? storageId : this._uuidGenerator.create();

        if (canvasDefinition instanceof HTMLCanvasElement) {
            // a canvas was provided
            const canvasElement = (<HTMLCanvasElement>canvasDefinition);
            if (!canvasElement.id)
                canvasElement.id = this._uuidGenerator.create();
            this._canvasDictionary[storageId] = new Canvas(canvasElement.id, canvasDefinition, canvasElement);
            return storageId;
        }

        if (canvasDefinition) {
            const id: string = canvasDefinition;
            const canvasElement = document.getElementById(id);

            for (let canvasId in this._canvasDictionary)
                if (this._canvasDictionary[canvasId].id === id)
                    return canvasId;

            if (canvasElement instanceof HTMLCanvasElement) {
                // id of a canvas was provided
                this._canvasDictionary[storageId] = new Canvas(id, canvasDefinition, canvasElement);
                return storageId;
            } else if(!canvasElement) {
                // no HTMLElement could be found, create Canvas with the id
                this._canvasDictionary[storageId] = new Canvas(id, canvasDefinition);
                return storageId;
            }
        }

        this._canvasDictionary[storageId] = new Canvas(storageId, canvasDefinition);
        return storageId;
    }

    public getCanvas(storageId: string): ICanvas {
        return this._canvasDictionary[storageId];
    }

    // #endregion Public Methods (2)
}