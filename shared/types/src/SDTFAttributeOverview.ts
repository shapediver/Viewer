import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'

export class SDTFAttributeOverview extends AbstractTreeNodeData {
    // #region Properties (1)

    #overview: {
        [key: string]: {
            typeHint: string;
            count: number;
            values?: string[];
            min?: number;
            max?: number;
        };
    } = {};

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        overview: {
            [key: string]: {
                typeHint: string;
                count: number;
                values?: string[];
                min?: number;
                max?: number;
            };
        },
        id?: string
    ) {
        super(id);
        this.#overview = overview;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get overview(): {
        [key: string]: {
            typeHint: string;
            count: number;
            values?: string[];
            min?: number;
            max?: number;
        };
    } {
        return this.#overview;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ITreeNodeData {
        return new SDTFAttributeOverview(this.#overview, this.id);
    }

    public merge(data: SDTFAttributeOverview) {
        for (let overviewKey in data.overview) {
          if (this.overview[overviewKey]) {
            this.overview[overviewKey].count++;
            if (data.overview[overviewKey].typeHint === 'string') {
                this.overview[overviewKey].values = this.overview[overviewKey].values?.concat(data.overview[overviewKey].values!.filter((item) => this.overview[overviewKey].values!.indexOf(item) < 0))
            }
            if (data.overview[overviewKey].typeHint === 'double' ||
              data.overview[overviewKey].typeHint === 'float' ||
              data.overview[overviewKey].typeHint === 'decimal' ||
              data.overview[overviewKey].typeHint === 'int') {
              this.overview[overviewKey].min = Math.min(data.overview[overviewKey].min!, this.overview[overviewKey].min!);
              this.overview[overviewKey].max = Math.max(data.overview[overviewKey].max!, this.overview[overviewKey].max!);
            }
          } else {
            this.overview[overviewKey] = {
                typeHint: data.overview[overviewKey].typeHint,
                count: data.overview[overviewKey].count,
                values: data.overview[overviewKey].values,
                min: data.overview[overviewKey].min,
                max: data.overview[overviewKey].max,
            }
          }
        }
    }

    // #endregion Public Methods (1)
}