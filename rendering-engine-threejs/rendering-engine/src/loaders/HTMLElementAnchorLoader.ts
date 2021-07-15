import { HTMLElementAnchorData } from '@shapediver/viewer.shared.types'
import { vec3 } from 'gl-matrix'

import { ILoader } from '../interfaces/ILoader'
import { RenderingEngine } from '../RenderingEngine'

export class HTMLElementAnchorLoader implements ILoader {
    // #region Properties (2)

    private readonly _htmlElements: {
        [key: string]: HTMLElementAnchorData
    } = {};
    private readonly _parentDiv: HTMLDivElement;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {        
        this._parentDiv = document.createElement('div');
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get parentDiv(): HTMLDivElement {
        return this._parentDiv;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (3)

    public adjustPositions(scaleWidth: number, scaleHeight: number): void {
        for (let anchorId in this._htmlElements) {
            const anchor = this._htmlElements[anchorId];
            const { page, container, client, hidden } = this._renderingEngine.sceneTracingManager.convert3Dto2D(vec3.clone(anchor.location));

            const htmlElement = anchor.createViewerHtmlElement(this._renderingEngine.id);
            if (!htmlElement) continue;

            htmlElement.style.display = '';
            if(hidden) htmlElement.style.display = 'none';
            
            let x, y;

            if (anchor.data.position && anchor.data.position.horizontal === 'right') {
                x = container[0] - htmlElement.offsetWidth;
            } else if (anchor.data.position && anchor.data.position.horizontal === 'left') {
                x = container[0];
            } else {
                x = container[0] - htmlElement.offsetWidth / 2;
            }

            if (anchor.data.position && anchor.data.position.vertical === 'bottom') {
                y = container[1] - htmlElement.offsetHeight;
            } else if (anchor.data.position && anchor.data.position.vertical === 'top') {
                y = container[1];
            } else {
                y = container[1] - htmlElement.offsetHeight / 2;
            }

            x = x / scaleWidth;
            y = y / scaleHeight;

            htmlElement.style.left = x + 'px';
            htmlElement.style.top = y + 'px';
        }
    }

    public init(): void {
        this._renderingEngine.canvas.canvasElement.parentNode?.appendChild(this._parentDiv);
    }

    public load(anchor: HTMLElementAnchorData): void {
        const htmlElement = anchor.createViewerHtmlElement(this._renderingEngine.id);
        if (!htmlElement) return;
        this._parentDiv.appendChild(htmlElement);
        this._parentDiv.style.userSelect = 'none';
        this._parentDiv.style.cursor = 'default';
        this._parentDiv.style.pointerEvents = 'none';
        this._parentDiv.style.overflow = 'hidden';
        this._parentDiv.style.position = 'absolute';
        this._parentDiv.style.width = '100%';
        this._parentDiv.style.height = '100%';
        this._parentDiv.style.left = '0%';
        this._parentDiv.style.top = '0%';
        this._htmlElements[anchor.id] = anchor;
    }

    // #endregion Public Methods (3)
}