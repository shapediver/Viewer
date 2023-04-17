import { vec2 } from "gl-matrix";
import { AbstractTreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { IMapData, TEXTURE_FILTERING, TEXTURE_WRAPPING } from "../../interfaces/data/material/IMapData";
import { Color } from "../../types";

export class MapData extends AbstractTreeNodeData implements IMapData {
    // #region Properties (11)

    #center: vec2 = vec2.fromValues(0, 0);
    #color?: Color;
    #flipY: boolean = true;
    #image: HTMLImageElement;
    #magFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE;
    #minFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE;
    #offset: vec2 = vec2.fromValues(0, 0);
    #repeat: vec2 = vec2.fromValues(1, 1);
    #rotation: number = 0;
    #wrapS: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT;
    #wrapT: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(
      image: HTMLImageElement,
      wrapS: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT,
      wrapT: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT,
      minFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE,
      magFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE,
      center: vec2 = vec2.fromValues(0, 0),
      color?: Color,
      offset: vec2 = vec2.fromValues(0, 0),
      repeat: vec2 = vec2.fromValues(1, 1),
      rotation: number = 0,
      flipY: boolean = true,
      id?: string,
      version?: string
    ) {
      super(id, version);
      this.#image = image;
      this.#wrapS = wrapS;
      this.#wrapT = wrapT;
      this.#minFilter = minFilter;
      this.#magFilter = magFilter;
      this.#center = center;
      this.#color = color;
      this.#offset = offset;
      this.#repeat = repeat;
      this.#rotation = rotation;
      this.#flipY = flipY;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (11)

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

    public get flipY(): boolean {
      return this.#flipY;
    }

    public set flipY(value: boolean) {
      this.#flipY = value;
    }

    public get image(): HTMLImageElement {
      return this.#image;
    }

    public set image(value: HTMLImageElement) {
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

    // #endregion Public Accessors (11)

    // #region Public Methods (1)

    public clone(): IMapData {
      return new MapData(<HTMLImageElement>this.image, this.wrapS, this.wrapT, this.minFilter, this.magFilter, this.center, this.color, this.offset, this.repeat, this.rotation, this.flipY, this.id, this.version);
    }

    // #endregion Public Methods (1)
}