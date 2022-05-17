import { vec2 } from "gl-matrix";
import { AbstractTreeNodeData } from "@shapediver/viewer.shared.node-tree";
import { IMapData, TEXTURE_FILTERING, TEXTURE_WRAPPING } from "../../interfaces/data/material/IMapData";

export class MapData extends AbstractTreeNodeData implements IMapData {
    // #region Properties (11)

    readonly #center: vec2 = vec2.fromValues(0, 0);
    readonly #color?: string;
    readonly #flipY: boolean = true;
    readonly #image: HTMLImageElement;
    readonly #magFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE;
    readonly #minFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE;
    readonly #offset: vec2 = vec2.fromValues(0, 0);
    readonly #repeat: vec2 = vec2.fromValues(1, 1);
    readonly #rotation: number = 0;
    readonly #wrapS: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT;
    readonly #wrapT: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT;

    // #endregion Properties (11)

    // #region Constructors (1)

    constructor(
      image: HTMLImageElement,
      wrapS: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT,
      wrapT: TEXTURE_WRAPPING = TEXTURE_WRAPPING.REPEAT,
      minFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE,
      magFilter: TEXTURE_FILTERING = TEXTURE_FILTERING.NONE,
      center: vec2 = vec2.fromValues(0, 0),
      color?: string,
      offset: vec2 = vec2.fromValues(0, 0),
      repeat: vec2 = vec2.fromValues(1, 1),
      rotation: number = 0,
      flipY: boolean = true,
    ) {
      super();
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

    public get color(): string | undefined {
      return this.#color;
    }

    public get flipY(): boolean {
      return this.#flipY;
    }

    public get image(): HTMLImageElement {
      return this.#image;
    }

    public get magFilter(): TEXTURE_FILTERING {
      return this.#magFilter;
    }

    public get minFilter(): TEXTURE_FILTERING {
      return this.#minFilter;
    }

    public get offset(): vec2 {
      return this.#offset;
    }

    public get repeat(): vec2 {
      return this.#repeat;
    }

    public get rotation(): number {
      return this.#rotation;
    }

    public get wrapS(): TEXTURE_WRAPPING {
      return this.#wrapS;
    }

    public get wrapT(): TEXTURE_WRAPPING {
      return this.#wrapT;
    }

    // #endregion Public Accessors (11)

    // #region Public Methods (1)

    public clone(): IMapData {
      return new MapData(<HTMLImageElement>this.image.cloneNode(), this.wrapS, this.wrapT, this.minFilter, this.magFilter, this.center, this.color, this.offset, this.repeat, this.rotation, this.flipY);
    }

    // #endregion Public Methods (1)
}