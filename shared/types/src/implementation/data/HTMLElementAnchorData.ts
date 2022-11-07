import { Box } from '@shapediver/viewer.shared.math'
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec2, vec3 } from 'gl-matrix'
import { IAnchorDataImage, IAnchorDataText, IHTMLElementAnchorData } from '../../interfaces/data/IHTMLElementAnchorData';

export abstract class HTMLElementAnchorData extends AbstractTreeNodeData implements IHTMLElementAnchorData {
    // #region Properties (9)

    protected internalHtmlElement: HTMLDivElement;
    readonly #viewerHtmlElement: {
        [key: string]: HTMLDivElement;
    } = {};

    #data: IAnchorDataImage | IAnchorDataText | any;
    #format: 'text' | 'image' | 'custom';
    #hideable: boolean = true;
    #intersectionTarget?: Box | string | string[];
    #location: vec3;
    #viewports: string[] = [];

    // #endregion Properties (9)

    // #region Constructors (1)

    /**
     * Creates a custom data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(properties:
        {
            location: vec3,
            data: IAnchorDataImage | IAnchorDataText | any,
            format: 'text' | 'image' | 'custom',
            hideable?: boolean,
            viewports?: string[],
            intersectionTarget?: Box | string | string[],
            id?: string,
        }
    ) {
        super(properties.id);

        this.#location = properties.location;
        this.#data = properties.data;
        this.#format = properties.format;
        this.#hideable = properties.hideable === undefined ? true : properties.hideable;
        this.#viewports = properties.viewports || [];
        this.#intersectionTarget = properties.intersectionTarget;

        this.internalHtmlElement = <HTMLDivElement>document.createElement('div');
        this.internalHtmlElement.style.position = 'absolute';
        this.internalHtmlElement.style.whiteSpace = 'nowrap';
        this.internalHtmlElement.style.textOverflow = 'clip';
        this.internalHtmlElement.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    public get data(): IAnchorDataImage | IAnchorDataText | any {
        return this.#data;
    }

    public set data(value: IAnchorDataImage | IAnchorDataText | any) {
        this.#data = value;
    }

    public get format(): 'text' | 'image' | 'custom' {
        return this.#format;
    }

    public set format(value: 'text' | 'image' | 'custom') {
        this.#format = value;
    }

    public get hideable(): boolean {
        return this.#hideable;
    }

    public set hideable(value: boolean) {
        this.#hideable = value;
    }

    public get intersectionTarget(): Box | string | string[] | undefined {
        return this.#intersectionTarget;
    }

    public set intersectionTarget(value: Box | string | string[] | undefined) {
        this.#intersectionTarget = value;
    }

    public get location(): vec3 {
        return this.#location;
    }

    public set location(value: vec3) {
        this.#location = value;
    }

    public get viewports(): string[] {
        return this.#viewports;
    }

    public set viewports(value: string[]) {
        this.#viewports = value;
    }

    // #endregion Public Accessors (12)

    // #region Public Methods (3)

    public createViewerHtmlElement(viewer: string): HTMLDivElement | null {
        if (this.#viewerHtmlElement[viewer]) return this.#viewerHtmlElement[viewer];
        if (this.viewports.includes(viewer) || this.viewports.length === 0) {
            this.#viewerHtmlElement[viewer] = <HTMLDivElement>this.internalHtmlElement.cloneNode(true);
            this.create({ anchor: this, parent: this.#viewerHtmlElement[viewer] });
            return this.#viewerHtmlElement[viewer];
        }
        return null;
    }

    public getViewerHtmlElement(viewer: string): HTMLDivElement | null {
        if (this.#viewerHtmlElement[viewer]) return this.#viewerHtmlElement[viewer];
        return null;
    }

    public abstract create(properties: { anchor: IHTMLElementAnchorData, parent: HTMLDivElement }): void;

    public update(properties: {
        anchor: IHTMLElementAnchorData, 
        htmlElement: HTMLDivElement, 
        page: vec2, 
        container: vec2, 
        client: vec2, 
        scale: vec2, 
        hidden: boolean,
        visible: boolean
    }) {
        properties.htmlElement.style.display = '';
        if ((this.hideable && properties.hidden) || properties.visible === false) properties.htmlElement.style.display = 'none';

        let x, y;

        if (this.data.position && this.data.position.horizontal === 'right') {
            x = properties.container[0] - properties.htmlElement.offsetWidth;
        } else if (this.data.position && this.data.position.horizontal === 'left') {
            x = properties.container[0];
        } else {
            x = properties.container[0] - properties.htmlElement.offsetWidth / 2;
        }

        if (this.data.position && this.data.position.vertical === 'bottom') {
            y = properties.container[1] - properties.htmlElement.offsetHeight;
        } else if (this.data.position && this.data.position.vertical === 'top') {
            y = properties.container[1];
        } else {
            y = properties.container[1] - properties.htmlElement.offsetHeight / 2;
        }

        x = x / properties.scale[0];
        y = y / properties.scale[1];

        properties.htmlElement.style.left = x + 'px';
        properties.htmlElement.style.top = y + 'px';
    }

    // #endregion Public Methods (3)

    // #region Public Abstract Methods (1)

    /**
     * Clones the scene graph data.
     */
    public abstract clone(): IHTMLElementAnchorData;

    // #endregion Public Abstract Methods (1)
}

export class HTMLElementAnchorTextData extends HTMLElementAnchorData {
    // #region Constructors (1)

    constructor(properties:
        {
            location: vec3,
            data: IAnchorDataText,
            hideable?: boolean,
            viewports?: string[],
            intersectionTarget?: Box | string | string[],
            id?: string,
        }) {
        super({
            location: properties.location,
            data: properties.data,
            format: 'text',
            hideable: properties.hideable,
            viewports: properties.viewports,
            intersectionTarget: properties.intersectionTarget,
            id: properties.id,
        })
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public clone(): HTMLElementAnchorTextData {
        return new HTMLElementAnchorTextData({
            location: this.location,
            data: this.data,
            hideable: this.hideable,
            viewports: this.viewports,
            intersectionTarget: this.intersectionTarget,
            id: this.id,
        });
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    public create(properties: { anchor: HTMLElementAnchorData, parent: HTMLDivElement }) {

        const span = document.createElement('span');
        span.style.display = 'none';
        span.style.userSelect = 'none';
        span.style.cursor = 'default';
        span.style.pointerEvents = 'none';
        span.style.color = properties.anchor.data.color?.toString();
        span.innerHTML = properties.anchor.data.text;
        span.style.display = 'block';
        span.style.textOverflow = 'clip';
        span.style.overflow = 'hidden';
        properties.parent.appendChild(span);

        if (properties.anchor.data.textAlign && (properties.anchor.data.textAlign === 'right' || properties.anchor.data.textAlign === 'center')) {
            span.style.textAlign = properties.anchor.data.textAlign;
        } else {
            span.style.textAlign = 'left';
        }
    }

    // #endregion Private Methods (1)
}

export class HTMLElementAnchorImageData extends HTMLElementAnchorData {
    // #region Constructors (1)

    constructor(properties:
        {
            location: vec3,
            data: IAnchorDataImage,
            hideable?: boolean,
            viewports?: string[],
            intersectionTarget?: Box | string | string[],
            id?: string,
        }) {
        super({
            location: properties.location,
            data: properties.data,
            format: 'image',
            hideable: properties.hideable,
            viewports: properties.viewports,
            intersectionTarget: properties.intersectionTarget,
            id: properties.id,
        })
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public clone(): HTMLElementAnchorImageData {
        return new HTMLElementAnchorImageData({
            location: this.location,
            data: this.data,
            hideable: this.hideable,
            viewports: this.viewports,
            intersectionTarget: this.intersectionTarget,
            id: this.id,
        });
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    public create(properties: { anchor: HTMLElementAnchorData, parent: HTMLDivElement }) {
        
        const img = document.createElement('img');
        img.style.userSelect = 'none';
        img.style.cursor = 'default';
        img.style.pointerEvents = 'none';
        properties.parent.appendChild(img);
        img.src = properties.anchor.data.src;
        if (properties.anchor.data.height) img.height = properties.anchor.data.height;
        if (properties.anchor.data.width) img.width = properties.anchor.data.width;
        if (properties.anchor.data.alt) img.alt = properties.anchor.data.alt;
    }
 
    // #endregion Private Methods (1)
}

export class HTMLElementAnchorCustomData extends HTMLElementAnchorData {
    // #region Properties (1)

    readonly #create: (properties: { anchor: HTMLElementAnchorData, parent: HTMLDivElement }) => void;
    readonly #update: (properties: { anchor: HTMLElementAnchorData, htmlElement: HTMLDivElement, page: vec2, container: vec2, client: vec2, scale: vec2, hidden: boolean, visible: boolean }) => void;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(properties:
        {
            location: vec3,
            data: any,
            hideable?: boolean,
            viewports?: string[],
            intersectionTarget?: Box | string | string[],
            id?: string,
            create: (properties: { anchor: HTMLElementAnchorData, parent: HTMLDivElement }) => void,
            update: (properties: { anchor: HTMLElementAnchorData, htmlElement: HTMLDivElement, page: vec2, container: vec2, client: vec2, scale: vec2, hidden: boolean, visible: boolean }) => void
        }) {
        super({
            location: properties.location,
            data: properties.data,
            format: 'custom',
            hideable: properties.hideable,
            viewports: properties.viewports,
            intersectionTarget: properties.intersectionTarget,
            id: properties.id,
        })

        this.#create = properties.create;
        this.#update = properties.update;
    }

    // #endregion Constructors (1)

    public create(properties: { anchor: HTMLElementAnchorData, parent: HTMLDivElement }) {
        this.#create(properties)
    }

    public update(properties: { anchor: HTMLElementAnchorData, htmlElement: HTMLDivElement, page: vec2, container: vec2, client: vec2, scale: vec2, hidden: boolean, visible: boolean }) {
        this.#update(properties)
    }

    // #region Public Methods (1)

    public clone(): HTMLElementAnchorCustomData {
        return new HTMLElementAnchorCustomData({
            location: this.location,
            data: this.data,
            hideable: this.hideable,
            viewports: this.viewports,
            intersectionTarget: this.intersectionTarget,
            id: this.id,
            create: this.#create,
            update: this.#update,
        });
    }

    // #endregion Public Methods (1)
}