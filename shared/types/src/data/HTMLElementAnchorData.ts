import { Box } from '@shapediver/viewer.shared.math'
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { vec2, vec3 } from 'gl-matrix'

interface AnchorDataImage {
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

interface AnchorDataText {
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

export class HTMLElementAnchorData extends AbstractTreeNodeData {
    // #region Properties (8)

    readonly #htmlElement: HTMLDivElement;
    readonly #viewerHtmlElement: {
        [key: string]: HTMLDivElement;
    } = {};

    #data: AnchorDataImage | AnchorDataText;
    #format: 'text' | 'image';
    #hideable: boolean = true;
    #intersectionTarget?: Box | string | string[];
    #location: vec3;
    #viewers: string[] = [];

    // #endregion Properties (8)

    // #region Constructors (1)

    /**
     * Creates a custom data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(
        location: vec3,
        data: AnchorDataImage | AnchorDataText,
        format: 'text' | 'image',
        hideable: boolean = true,
        viewers: string[] = [],
        intersectionTarget?: Box | string | string[],
        id?: string
    ) {
        super(id);

        this.#location = location;
        this.#data = data;
        this.#format = format;
        this.#hideable = hideable;
        this.#viewers = viewers;
        this.#intersectionTarget = intersectionTarget;

        this.#htmlElement = document.createElement('div');
        // this.#htmlElement.type = 'text/css';
        this.#htmlElement.style.display = 'none';

        this.#htmlElement.style.userSelect = 'none';
        this.#htmlElement.style.cursor = 'default';
        this.#htmlElement.style.pointerEvents = 'none';
        this.#htmlElement.style.position = 'absolute';
        this.#htmlElement.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
        this.#htmlElement.style.whiteSpace = 'nowrap';
        this.#htmlElement.style.textOverflow = 'clip';

        this.#htmlElement.classList.add('shapediver-domElement');

        if (this.format === 'text') this.createTextElement(<AnchorDataText>this.data);
        if (this.format === 'image') this.createImageElement(<AnchorDataImage>this.data);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (12)

    public get data(): AnchorDataImage | AnchorDataText {
        return this.#data;
    }

    public set data(value: AnchorDataImage | AnchorDataText) {
        this.#data = value;
    }

    public get format(): 'text' | 'image' {
        return this.#format;
    }

    public set format(value: 'text' | 'image') {
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

    // #region Public Methods (4)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        return new HTMLElementAnchorData(this.location, this.data, this.format, this.hideable, this.viewers, this.intersectionTarget, this.id);
    }

    public createViewerHtmlElement(viewer: string): HTMLDivElement | null {
        if (this.#viewerHtmlElement[viewer]) return this.#viewerHtmlElement[viewer];
        if (this.viewers.includes(viewer) || this.viewers.length === 0) {
            this.#viewerHtmlElement[viewer] = <HTMLDivElement>this.#htmlElement.cloneNode(true);
            return this.#viewerHtmlElement[viewer];
        }
        return null;
    }

    public getViewerHtmlElement(viewer: string): HTMLDivElement | null {
        if (this.#viewerHtmlElement[viewer]) return this.#viewerHtmlElement[viewer];
        return null;
    }

    public update() {
    }

    // #endregion Public Methods (4)

    // #region Private Methods (2)

    private createImageElement(data: AnchorDataImage) {
        const img = document.createElement('img');
        this.#htmlElement.appendChild(img);
        img.src = data.src;
        if (data.height) img.height = data.height;
        if (data.width) img.width = data.width;
        if (data.alt) img.alt = data.alt;
    }

    private createTextElement(data: AnchorDataText) {
        const span = document.createElement('span');
        span.style.color = data.color?.toString();
        span.innerHTML = data.text;
        span.style.display = 'block';
        span.style.textOverflow = 'clip';
        span.style.overflow = 'hidden';
        this.#htmlElement.appendChild(span);

        if (data.textAlign && (data.textAlign === 'right' || data.textAlign === 'center')) {
            span.style.textAlign = data.textAlign;
        } else {
            span.style.textAlign = 'left';
        }
    }

    // #endregion Private Methods (2)
}
