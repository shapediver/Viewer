import { Box } from '@shapediver/viewer.shared.math';
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree';
import { vec2, vec3 } from 'gl-matrix';

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
    
    private readonly _htmlElement: HTMLDivElement;
    private readonly _viewerHtmlElement: {
        [key: string]: HTMLDivElement;
    } = {};

    // #region Constructors (1)
    private createTextElement(data: AnchorDataText) {
        const span = document.createElement('span');
        span.style.color = data.color?.toString();
        span.innerHTML = data.text;
        span.style.display = 'block';
        span.style.textOverflow = 'clip';
        span.style.overflow = 'hidden';
        this._htmlElement.appendChild(span);

        if(data.textAlign && (data.textAlign === 'right' || data.textAlign === 'center')) {
            span.style.textAlign = data.textAlign;
        } else {
            span.style.textAlign = 'left';
        }
    }

    private createImageElement(data: AnchorDataImage) {
        const img = document.createElement('img');
        this._htmlElement.appendChild(img);
        img.src = data.src;
        if(data.height) img.height = data.height;
        if(data.width) img.width = data.width;
        if(data.alt) img.alt = data.alt;
    }

    /**
     * Creates a custom data node.
     * 
     * @param _data the data as key- value pairs 
     * @param id the id
     */
    constructor(
        private _location: vec3,
        private _data: AnchorDataImage | AnchorDataText,
        private _format: 'text' | 'image',
        private _hideable: boolean = true,
        private _viewers: string[] = [],    
        private _intersectionTarget?: Box | string | string[],
        id?: string
    ) {
        super(id);
        
        this._htmlElement = document.createElement('div');
        // this._htmlElement.type = 'text/css';
        this._htmlElement.style.display = 'none';


        this._htmlElement.style.userSelect = 'none';
        this._htmlElement.style.cursor = 'default';
        this._htmlElement.style.pointerEvents = 'none';
        this._htmlElement.style.position = 'absolute';
        this._htmlElement.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
        this._htmlElement.style.whiteSpace = 'nowrap';
        this._htmlElement.style.textOverflow = 'clip';


        this._htmlElement.classList.add('shapediver-domElement');

        if(this.format === 'text') this.createTextElement(<AnchorDataText>this.data);
        if(this.format === 'image') this.createImageElement(<AnchorDataImage>this.data);
    }

    // #endregion Constructors (1)

    // #region Public Accessors (14)

    /**
     * Getter data
     * @return {AnchorDataImage | AnchorDataText}
     */
    public get data(): AnchorDataImage | AnchorDataText {
		return this._data;
	}

    /**
     * Setter data
     * @param {AnchorDataImage | AnchorDataText} value
     */
    public set data(value: AnchorDataImage | AnchorDataText) {
		this._data = value;
	}

    /**
     * Getter format
     * @return {'text' | 'image'}
     */
    public get format(): 'text' | 'image' {
		return this._format;
	}

    /**
     * Setter format
     * @param {'text' | 'image'} value
     */
    public set format(value: 'text' | 'image') {
		this._format = value;
	}

    public createViewerHtmlElement(viewer: string): HTMLDivElement | null {
        if(this._viewerHtmlElement[viewer]) return this._viewerHtmlElement[viewer];
        if(this.viewers.includes(viewer) || this.viewers.length === 0) {
            this._viewerHtmlElement[viewer] = <HTMLDivElement>this._htmlElement.cloneNode(true);
            return this._viewerHtmlElement[viewer];
        }
        return null;
	}

    /**
     * Getter hideable
     * @return {boolean}
     */
    public get hideable(): boolean {
		return this._hideable;
	}

    /**
     * Setter hideable
     * @param {boolean} value
     */
    public set hideable(value: boolean) {
		this._hideable = value;
	}

    /**
     * Getter intersectionTarget
     * @return {Box | string | string[] | undefined}
     */
    public get intersectionTarget(): Box | string | string[] | undefined {
		return this._intersectionTarget;
	}

    /**
     * Setter intersectionTarget
     * @param {Box | string | string[] | undefined} value
     */
    public set intersectionTarget(value: Box | string | string[] | undefined) {
		this._intersectionTarget = value;
	}

    /**
     * Getter location
     * @return {vec3}
     */
    public get location(): vec3 {
		return this._location;
	}

    /**
     * Setter location
     * @param {vec3} value
     */
    public set location(value: vec3) {
		this._location = value;
	}

    /**
     * Getter viewers
     * @return {string[]}
     */
    public get viewers(): string[] {
		return this._viewers;
	}

    /**
     * Setter viewers
     * @param {string[]} value
     */
    public set viewers(value: string[]) {
		this._viewers = value;
	}

    // #endregion Public Accessors (14)

    public update() {

    }

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        // TODO real deep copy + test
        return new HTMLElementAnchorData(this.location, this.data, this.format, this.hideable, this.viewers, this.intersectionTarget, this.id);
    }

    // #endregion Public Methods (1)
}
