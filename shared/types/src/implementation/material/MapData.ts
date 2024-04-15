import { vec2 } from 'gl-matrix';
import { AbstractTreeNodeData } from '@shapediver/viewer.shared.node-tree';
import { IMapData, TEXTURE_FILTERING, TEXTURE_WRAPPING } from '../../interfaces/data/material/IMapData';
import { Color } from '../../types';

export class MapData extends AbstractTreeNodeData implements IMapData {
    // #region Properties (15)

    #asData: boolean = false;
    #blob?: Blob;
    #center: vec2 = vec2.fromValues(0, 0);
    #color?: Color;
    #data?: number[];
    #flipY: boolean = true;
    #image: HTMLImageElement | ArrayBuffer;
    #magFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE;
    #minFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE;
    #offset: vec2 = vec2.fromValues(0, 0);
    #repeat: vec2 = vec2.fromValues(1, 1);
    #rotation: number = 0;
    #texCoord?: number;
    #wrapS: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT;
    #wrapT: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT;

    // #endregion Properties (15)

    // #region Constructors (1)

    constructor(
      image: HTMLImageElement | ArrayBuffer,
      properties?: {
        asData?: boolean,
        data?: number[],
        blob?: Blob,
        wrapS?: TEXTURE_WRAPPING,
        wrapT?: TEXTURE_WRAPPING,
        minFilter?: TEXTURE_FILTERING,
        magFilter?: TEXTURE_FILTERING,
        center?: vec2,
        color?: Color,
        offset?: vec2,
        repeat?: vec2,
        rotation?: number,
        texCoord?: number,
        flipY?: boolean,
      },
      id?: string,
      version?: string
    ) {
      super(id, version);
      this.#image = image;
      this.#asData = properties && properties.asData !== undefined ? properties.asData : false;
      this.#data = properties ? properties.data : undefined;
      this.#blob = properties ? properties.blob : undefined;
      this.#wrapS = properties && properties.wrapS !== undefined ? properties.wrapS : TEXTURE_WRAPPING.REPEAT;
      this.#wrapT = properties && properties.wrapT !== undefined ? properties.wrapT : TEXTURE_WRAPPING.REPEAT;
      this.#minFilter = properties && properties.minFilter !== undefined ? properties.minFilter : TEXTURE_FILTERING.NONE;
      this.#magFilter = properties && properties.magFilter !== undefined ? properties.magFilter : TEXTURE_FILTERING.NONE;
      this.#center = properties && properties.center !== undefined ? properties.center : vec2.fromValues(0, 0);
      this.#color = properties ? properties.color : undefined;
      this.#offset = properties && properties.offset !== undefined ? properties.offset : vec2.fromValues(0, 0);
      this.#repeat = properties && properties.repeat !== undefined ? properties.repeat : vec2.fromValues(1, 1);
      this.#rotation = properties && properties.rotation !== undefined ? properties.rotation : 0;
      this.#texCoord = properties ? properties.texCoord : undefined;
      this.#flipY = properties && properties.flipY !== undefined ? properties.flipY : true;
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (30)

    public get asData(): boolean {
      return this.#asData;
    }

    public set asData(value: boolean) {
      this.#asData = value;
    }

    public get blob(): Blob | undefined {
      return this.#blob;
    }

    public set blob(value: Blob | undefined) {
      this.#blob = value;
    }

    public get center(): vec2 {
      return this.#center;
    }

    public set center(value: vec2) {
      this.#center = value;
    }

    public get color(): Color | undefined {
      return this.#color;
    }

    public set color(value: Color | undefined) {
      this.#color = value;
    }

    public get data(): number[] | undefined {
      return this.#data;
    }

    public set data(value: number[] | undefined) {
      this.#data = value;
    }

    public get flipY(): boolean {
      return this.#flipY;
    }

    public set flipY(value: boolean) {
      this.#flipY = value;
    }

    public get image(): HTMLImageElement | ArrayBuffer {
      return this.#image;
    }

    public set image(value: HTMLImageElement | ArrayBuffer) {
      this.#image = value;
    }

    public get magFilter(): TEXTURE_FILTERING {
      return this.#magFilter;
    }

    public set magFilter(value: TEXTURE_FILTERING) {
      this.#magFilter = value;
    }

    public get minFilter(): TEXTURE_FILTERING {
      return this.#minFilter;
    }

    public set minFilter(value: TEXTURE_FILTERING) {
      this.#minFilter = value;
    }

    public get offset(): vec2 {
      return this.#offset;
    }

    public set offset(value: vec2) {
      this.#offset = value;
    }

    public get repeat(): vec2 {
      return this.#repeat;
    }

    public set repeat(value: vec2) {
      this.#repeat = value;
    }

    public get rotation(): number {
      return this.#rotation;
    }

    public set rotation(value: number) {
      this.#rotation = value;
    }

    public get texCoord(): number | undefined {
      return this.#texCoord;
    }

    public set texCoord(value: number | undefined) {
      this.#texCoord = value;
    }

    public get wrapS(): TEXTURE_WRAPPING {
      return this.#wrapS;
    }

    public set wrapS(value: TEXTURE_WRAPPING) {
      this.#wrapS = value;
    }

    public get wrapT(): TEXTURE_WRAPPING {
      return this.#wrapT;
    }

    public set wrapT(value: TEXTURE_WRAPPING) {
      this.#wrapT = value;
    }

    // #endregion Public Getters And Setters (30)

    // #region Public Methods (1)

    public clone(): IMapData {
      return new MapData(
        <HTMLImageElement>this.image, 
        {
          asData: this.asData,
          data: this.data,
          blob: this.blob, 
          wrapS: this.wrapS, 
          wrapT: this.wrapT, 
          minFilter: this.minFilter, 
          magFilter: this.magFilter, 
          center: this.center, 
          color: this.color, 
          offset: this.offset, 
          repeat: this.repeat, 
          rotation: this.rotation, 
          texCoord: this.texCoord, 
          flipY: this.flipY
        }, this.id, this.version);
    }

    // #endregion Public Methods (1)
}