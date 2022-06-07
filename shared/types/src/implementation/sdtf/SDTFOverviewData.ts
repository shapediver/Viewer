import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { ISDTFOverview, ISDTFOverviewData } from '../../interfaces/sdtf/ISDTFOverviewData';
import { SdtfPrimitiveTypeGuard } from '@shapediver/sdk.sdtf-primitives'

export class SDTFOverviewData extends AbstractTreeNodeData implements ISDTFOverviewData {
    // #region Properties (1)

    #overview: ISDTFOverview = {};

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor(
        overview: ISDTFOverview,
        id?: string
    ) {
        super(id);
        this.#overview = overview;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get overview(): ISDTFOverview {
        return this.#overview;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (1)

    /**
     * Clones the scene graph data.
     */
    public clone(): ISDTFOverviewData {
        return new SDTFOverviewData(this.#overview, this.id);
    }

    public merge(data: ISDTFOverviewData) {
        for (let overviewKey in data.overview) {
            for(let i = 0; i < data.overview[overviewKey].length; i++){
                const dataToCopy = data.overview[overviewKey][i];
                const existingEntries = this.overview[overviewKey] ? this.overview[overviewKey].filter(o => o.typeHint === dataToCopy.typeHint) : [];
                if(this.overview[overviewKey] && existingEntries.length > 0) {
                    const entry = existingEntries[0];
                    entry.count++;
                    if (SdtfPrimitiveTypeGuard.isStringType(dataToCopy.typeHint)) {
                        entry.values = entry.values?.concat(dataToCopy.values!.filter((item) => entry.values!.indexOf(item) < 0))
                    }
                    if (SdtfPrimitiveTypeGuard.isNumberType(dataToCopy.typeHint)) {
                    entry.min = Math.min(dataToCopy.min!, entry.min!);
                    entry.max = Math.max(dataToCopy.max!, entry.max!);
                    }

                } else if(this.overview[overviewKey]) {
                    this.overview[overviewKey].push({
                        typeHint: dataToCopy.typeHint,
                        count: dataToCopy.count,
                        values: dataToCopy.values,
                        min: dataToCopy.min,
                        max: dataToCopy.max,
                    })
                } else {
                    this.overview[overviewKey] = [{
                        typeHint: dataToCopy.typeHint,
                        count: dataToCopy.count,
                        values: dataToCopy.values,
                        min: dataToCopy.min,
                        max: dataToCopy.max,
                    }]
                }
            }
        }
    }

    // #endregion Public Methods (1)
}