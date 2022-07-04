import { IMaterialAbstractData, ISDTFOverview } from "@shapediver/viewer.shared.types";
import { IAttribute } from "./IAttribute";
import { ILayer } from "./ILayer";

export interface IAttributeVisualizationEngine {
    // #region Properties (3)

    readonly defaultMaterial: IMaterialAbstractData;
    readonly layers: { [key: string]: ILayer };
    readonly overview: ISDTFOverview;

    // #endregion Properties (3)

    // #region Public Methods (5)

    /**
     * Add a listener that will be called whenever there was an update to the attributes.
     * Use this listener to update your menu.
     * @param cb 
     */
    addListener(cb: () => void): string;

    /**
     * Remove a listener.
     * @param token 
     */
    removeListener(token: string): boolean;

    /**
     * Update the attributes that are used to visualize the geometry.
     * If an object is present in multiple of the attributes, only the first one will be used.
     * @param attributes 
     */
    updateAttributes(attributes: IAttribute[]): void;

    /**
     * Update the default material that is used to visualize objects without attributes.
     * @param material 
     */
    updateDefaultMaterial(material: IMaterialAbstractData): void;

    /**
     * Update the layers, the opacity is multiplied with the attribute visualization opacity.
     * @param layers 
     */
    updateLayers(layers: { [key: string]: ILayer }): void;

    // #endregion Public Methods (5)
}