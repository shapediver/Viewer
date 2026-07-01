import {SdtfPrimitiveTypeGuard} from "@shapediver/sdk.sdtf-primitives";
import {
	type ISDTFOverview,
	type ISDTFOverviewData} from "@shapediver/viewer.shared.types";
import {AbstractTreeNodeData} from "../AbstractTreeNodeData";

export class SDTFOverviewData
	extends AbstractTreeNodeData
	implements ISDTFOverviewData
{
	// #region Properties (1)

	#overview: ISDTFOverview = {};
	// #endregion Properties (1)

	// #region Constructors (1)

	constructor(overview: ISDTFOverview, id?: string, version?: string) {
		super(id, version);
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
		return new SDTFOverviewData(this.#overview, this.id, this.version);
	}

	public merge(data: ISDTFOverviewData) {
		for (let overviewKey in data.overview) {
			for (let i = 0; i < data.overview[overviewKey].length; i++) {
				const dataToCopy = data.overview[overviewKey][i];
				const existingEntries = this.overview[overviewKey]
					? this.overview[overviewKey].filter(
							(o) => o.typeHint === dataToCopy.typeHint,
						)
					: [];
				if (this.overview[overviewKey] && existingEntries.length > 0) {
					const entry = existingEntries[0];
					entry.count++;
					if (
						SdtfPrimitiveTypeGuard.isStringType(dataToCopy.typeHint)
					) {
						// combine the countForValue
						for (let i = 0; i < dataToCopy.values!.length; i++) {
							const value = dataToCopy.values![i];
							// check if the the entry already has the value
							const entryIndex = entry.values!.indexOf(value);
							if (entryIndex !== -1) {
								entry.countForValue![entryIndex] +=
									dataToCopy.countForValue![i];
							} else {
								entry.values!.push(value);
								entry.countForValue!.push(
									dataToCopy.countForValue![i],
								);
							}
						}
					}
					if (
						SdtfPrimitiveTypeGuard.isNumberType(dataToCopy.typeHint)
					) {
						entry.min = Math.min(dataToCopy.min!, entry.min!);
						entry.max = Math.max(dataToCopy.max!, entry.max!);
					}
				} else if (this.overview[overviewKey]) {
					this.overview[overviewKey].push({
						typeHint: dataToCopy.typeHint,
						count: dataToCopy.count,
						values: dataToCopy.values
							? [...dataToCopy.values]
							: dataToCopy.values,
						countForValue: dataToCopy.countForValue
							? [...dataToCopy.countForValue]
							: dataToCopy.countForValue,
						min: dataToCopy.min,
						max: dataToCopy.max,
					});
				} else {
					this.overview[overviewKey] = [
						{
							typeHint: dataToCopy.typeHint,
							count: dataToCopy.count,
							values: dataToCopy.values
								? [...dataToCopy.values]
								: dataToCopy.values,
							countForValue: dataToCopy.countForValue
								? [...dataToCopy.countForValue]
								: dataToCopy.countForValue,
							min: dataToCopy.min,
							max: dataToCopy.max,
						},
					];
				}
			}
		}
	}

	// #endregion Public Methods (1)
}
