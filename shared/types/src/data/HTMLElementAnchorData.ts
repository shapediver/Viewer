import { Box } from '@shapediver/viewer.shared.math'
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec2, vec3 } from 'gl-matrix'

export interface AnchorDataImage {
    // #region Properties (6)

    alt: string,
    height: number,
    hidden?: boolean,
    position?: {
        horizontal?: string,
        vertical?: string
    }

    src: string,
    width: number,

    // #endregion Properties (6)
}

export interface AnchorDataText {
    // #region Properties (5)

    color: string | number | vec3,
    hidden?: boolean,
    position?: {
        horizontal?: string,
        vertical?: string
    },
    text: string,
    textAlign?: string

    // #endregion Properties (5)
}

export abstract class HTMLElementAnchorData extends AbstractTreeNodeData {
    // #region Properties (9)

    protected internalHtmlElement: HTMLDivElement;
    readonly #viewerHtmlElement: {
        [key: string]: HTMLDivElement;
    } = {};

    #data: AnchorDataImage | AnchorDataText | any;
    #format: 'text' | 'image' | 'custom';
    #hideable: boolean = true;
    #intersectionTarget?: Box | string | string[];
    #location: vec3;
    #viewers: string[] = [];

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
            data: AnchorDataImage | AnchorDataText | any,
            format: 'text' | 'image' | 'custom',
            hideable?: boolean,
            viewers?: string[],
            intersectionTarget?: Box | string | string[],
            id?: string,
        }
    ) {
        super(properties.id);

        this.#location = properties.location;
        this.#data = properties.data;
        this.#format = properties.format;
        this.#hideable = properties.hideable === undefined ? true : properties.hideable;
        this.#viewers = properties.viewers || [];
        this.#intersectionTarget = properties.intersectionTarget;

        this.internalHtmlElement = <HTMLDivElement>document.createElement('div');
        // this.internalHtmlElement.type = 'text/css';
        this.internalHtmlElement.style.display = 'none';

        this.internalHtmlElement.style.userSelect = 'none';
        this.internalHtmlElement.style.cursor = 'default';
        this.internalHtmlElement.style.pointerEvents = 'none';
        this.internalHtmlElement.style.position = 'absolute';
        this.internalHtmlElement.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
        this.internalHtmlElement.style.whiteSpace = 'nowrap';
        this.internalHtmlElement.style.textOverflow = 'clip';

        this.internalHtmlElement.classList.add('shapediver-domElement');
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    public get data(): AnchorDataImage | AnchorDataText | any {
        return this.#data;
    }

    public set data(value: AnchorDataImage | AnchorDataText | any) {
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

    public get viewers(): string[] {
        return this.#viewers;
    }

    public set viewers(value: string[]) {
        this.#viewers = value;
    }

    // #endregion Public Accessors (12)

    // #region Public Methods (3)

    public createViewerHtmlElement(viewer: string): HTMLDivElement | null {
        if (this.#viewerHtmlElement[viewer]) return this.#viewerHtmlElement[viewer];
        if (this.viewers.includes(viewer) || this.viewers.length === 0) {
            this.#viewerHtmlElement[viewer] = <HTMLDivElement>this.internalHtmlElement.cloneNode(true);
            return this.#viewerHtmlElement[viewer];
        }
        return null;
    }

    public getViewerHtmlElement(viewer: string): HTMLDivElement | null {
        if (this.#viewerHtmlElement[viewer]) return this.#viewerHtmlElement[viewer];
        return null;
    }

    public update(properties: {
        anchor: HTMLElementAnchorData, 
        htmlElement: HTMLDivElement, 
        page: vec2, 
        container: vec2, 
        client: vec2, 
        scale: vec2, 
        hidden: boolean
    }) {
        properties.htmlElement.style.display = '';
        if (this.hideable && properties.hidden) properties.htmlElement.style.display = 'none';

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
    public abstract clone(): ITreeNodeData;

    // #endregion Public Abstract Methods (1)
}

export class HTMLElementAnchorTextData extends HTMLElementAnchorData {
    // #region Constructors (1)

    constructor(properties:
        {
            location: vec3,
            data: AnchorDataText,
            hideable?: boolean,
            viewers?: string[],
            intersectionTarget?: Box | string | string[],
            id?: string,
        }) {
        super({
            location: properties.location,
            data: properties.data,
            format: 'text',
            hideable: properties.hideable,
            viewers: properties.viewers,
            intersectionTarget: properties.intersectionTarget,
            id: properties.id,
        })

        this.create({ anchor: this, parent: this.internalHtmlElement });
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new HTMLElementAnchorTextData({
            location: this.location,
            data: this.data,
            hideable: this.hideable,
            viewers: this.viewers,
            intersectionTarget: this.intersectionTarget,
            id: this.id,
        });
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    private create(properties: { anchor: HTMLElementAnchorData, parent: HTMLDivElement }) {
        const span = document.createElement('span');
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
            data: AnchorDataImage,
            hideable?: boolean,
            viewers?: string[],
            intersectionTarget?: Box | string | string[],
            id?: string,
        }) {
        super({
            location: properties.location,
            data: properties.data,
            format: 'image',
            hideable: properties.hideable,
            viewers: properties.viewers,
            intersectionTarget: properties.intersectionTarget,
            id: properties.id,
        })

        this.create({ anchor: this, parent: this.internalHtmlElement });
    }

    // #endregion Constructors (1)

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new HTMLElementAnchorImageData({
            location: this.location,
            data: this.data,
            hideable: this.hideable,
            viewers: this.viewers,
            intersectionTarget: this.intersectionTarget,
            id: this.id,
        });
    }

    // #endregion Public Methods (1)

    // #region Private Methods (1)

    private create(properties: { anchor: HTMLElementAnchorData, parent: HTMLDivElement }) {
        const img = document.createElement('img');
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
    readonly #update: (properties: { anchor: HTMLElementAnchorData, htmlElement: HTMLDivElement, page: vec2, container: vec2, client: vec2, scale: vec2, hidden: boolean }) => void;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(properties:
        {
            location: vec3,
            data: any,
            hideable?: boolean,
            viewers?: string[],
            intersectionTarget?: Box | string | string[],
            id?: string,
            create: (properties: { anchor: HTMLElementAnchorData, parent: HTMLDivElement }) => void,
            update: (properties: { anchor: HTMLElementAnchorData, htmlElement: HTMLDivElement, page: vec2, container: vec2, client: vec2, scale: vec2, hidden: boolean }) => void
        }) {
        super({
            location: properties.location,
            data: properties.data,
            format: 'custom',
            hideable: properties.hideable,
            viewers: properties.viewers,
            intersectionTarget: properties.intersectionTarget,
            id: properties.id,
        })

        this.#create = properties.create;
        this.#update = properties.update;
        this.#create({ anchor: this, parent: this.internalHtmlElement });
    }

    // #endregion Constructors (1)

    public update(properties: { anchor: HTMLElementAnchorData, htmlElement: HTMLDivElement, page: vec2, container: vec2, client: vec2, scale: vec2, hidden: boolean }) {
        this.#update(properties)
    }

    // #region Public Methods (1)

    public clone(): ITreeNodeData {
        return new HTMLElementAnchorCustomData({
            location: this.location,
            data: this.data,
            hideable: this.hideable,
            viewers: this.viewers,
            intersectionTarget: this.intersectionTarget,
            id: this.id,
            create: this.#create,
            update: this.#update,
        });
    }

    // #endregion Public Methods (1)
}