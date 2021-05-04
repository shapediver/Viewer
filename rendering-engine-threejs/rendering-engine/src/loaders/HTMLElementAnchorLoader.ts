import { HTMLElementAnchorData } from "@shapediver/viewer.shared.types";
import { vec3 } from "gl-matrix";
import { RenderingEngine } from "../RenderingEngine";

export class HTMLElementAnchorLoader {
    private readonly _htmlElements: {
        [key: string]: HTMLElementAnchorData
    } = {};
    private readonly _parentDiv: HTMLDivElement;

    constructor(private readonly _renderingEngine: RenderingEngine) {
        this._parentDiv = document.createElement('div');
        this._renderingEngine.canvas.canvasElement.parentNode?.appendChild(this._parentDiv);
    }

    public get parentDiv(): HTMLDivElement {
        return this._parentDiv;
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

    public adjustPositions(): void {
        for (let anchorId in this._htmlElements) {
            const anchor = this._htmlElements[anchorId];
            const { page, container, client, hidden } = this._renderingEngine.convert3Dto2D(vec3.clone(anchor.location));

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

            htmlElement.style.left = x + 'px';
            htmlElement.style.top = y + 'px';
        }
    }
}