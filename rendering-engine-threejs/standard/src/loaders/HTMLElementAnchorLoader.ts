import { HTMLElementAnchorData } from '@shapediver/viewer.shared.types'
import { vec2, vec3 } from 'gl-matrix'
import { ITreeNode } from '@shapediver/viewer.shared.node-tree';

import { ILoader } from '../interfaces/ILoader'
import { RenderingEngine } from '../RenderingEngine'
import nodeCluster from 'node:cluster';

export class HTMLElementAnchorLoader implements ILoader {
    // #region Properties (2)

    private readonly _htmlElements: {
        [key: string]: {
            anchor: HTMLElementAnchorData,
            node: ITreeNode
        }
    } = {};
    private readonly _parentDiv: HTMLDivElement;

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        this._parentDiv = document.createElement('div');
        this._parentDiv.style.userSelect = 'none';
        this._parentDiv.style.cursor = 'default';
        this._parentDiv.style.pointerEvents = 'none';
        this._parentDiv.style.overflow = 'hidden';
        this._parentDiv.style.position = 'absolute';
        this._parentDiv.style.width = '100%';
        this._parentDiv.style.height = '100%';
        this._parentDiv.style.left = '0%';
        this._parentDiv.style.top = '0%';
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get parentDiv(): HTMLDivElement {
        return this._parentDiv;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (5)

    public adjustPositions(scaleWidth: number, scaleHeight: number): void {
        for (let anchorId in this._htmlElements) {
            const anchor = this._htmlElements[anchorId].anchor;
            const { page, container, client, hidden } = this._renderingEngine.sceneTracingManager.convert3Dto2D(vec3.clone(anchor.location));
            
            const htmlElement = anchor.createViewerHtmlElement(this._renderingEngine.id);
            if (!htmlElement) continue;
    
            let node = this._htmlElements[anchorId].node;

            let visible = node.visible;
            while(node.parent) {
                node = node.parent;
                visible = node.visible && visible;
            }

            anchor.update({ anchor, htmlElement, page, container, client, scale: vec2.fromValues(scaleWidth, scaleHeight), hidden, visible });
        }
    }

    public init(): void {
        this._renderingEngine.canvas.parentNode?.appendChild(this._parentDiv);
    }

    public load(node: ITreeNode, anchor: HTMLElementAnchorData): void {
        const htmlElement = anchor.createViewerHtmlElement(this._renderingEngine.id);
        if (!htmlElement) return;
        this._parentDiv.appendChild(htmlElement);
        this._htmlElements[anchor.id + '_' + anchor.version] = {
            node,
            anchor
        };
    }

    public removeData(id: string, version: string) {
        const anchor = this._htmlElements[id + '_' + version].anchor;
        if (anchor && anchor.getViewerHtmlElement(this._renderingEngine.id)) {
            this._parentDiv.removeChild(anchor.getViewerHtmlElement(this._renderingEngine.id)!);
            delete this._htmlElements[id + '_' + version]
        }
    }

    public toggleBusyMode(toggle: boolean) {
        if (toggle) {
            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && navigator.userAgent.toLowerCase().indexOf('android') > -1)
                return;
            this._parentDiv.style.filter = 'blur(3px)';
        } else {
            this._parentDiv.style.filter = '';
        }
    }

    // #endregion Public Methods (5)
}