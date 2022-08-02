import { ILayer } from "../interfaces/ILayer";
import { addListener, IViewportApi, sceneTree } from "@shapediver/viewer";
import { IAttribute, IColorAttribute, IDefaultAttribute, INumberAttribute, IStringAttribute } from "../interfaces/IAttribute";
import { mat4 } from "gl-matrix";
import { container } from "tsyringe";
import { Converter, EVENTTYPE, UuidGenerator } from "@shapediver/viewer.shared.services";
import { IAttributeVisualizationEngine } from "../interfaces/IAttributeVisualizationEngine";
import { IMaterialAbstractData, ISDTFItemData, ISDTFOverview, MaterialStandardData, MaterialUnlitData, SdtfPrimitiveTypeGuard } from "@shapediver/viewer.shared.types";
import { AttributeVisualizationUtils } from "./AttributeVisualizationUtils";

export class AttributeVisualizationEngine implements IAttributeVisualizationEngine {
    // #region Properties (7)

    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    readonly #viewport: IViewportApi;

    #attributes: IAttribute[] = [];
    #defaultMaterial: IMaterialAbstractData = new MaterialUnlitData({ color: '#000000', opacity: 1 });
    #defaultLayer: ILayer = {
        color: '#000000',
        opacity: 1,
        enabled: true
    };
    #layers: {
        [key: string]: ILayer
    } = {};
    #overview: ISDTFOverview;
    #listeners: {
        [key: string]: () => void
    } = {};
    #visualizedMaterialType: 'unlit' | 'standard' = 'unlit';
    #layerMaterialType: 'unlit' | 'standard' = 'unlit';

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(viewport: IViewportApi) {
        this.#viewport = viewport;

        this.#overview = this.#viewport.createSDTFOverview(sceneTree.root);
        this.createLayers();
        this.constructAttributeVisualization();
        addListener(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, () => {
            this.#overview = this.#viewport.createSDTFOverview(sceneTree.root);
            this.createLayers();
            this.constructAttributeVisualization();

            for (let l in this.#listeners)
                this.#listeners[l]();
        })
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    public get defaultMaterial(): IMaterialAbstractData {
        return this.#defaultMaterial;
    }

    public get defaultLayer(): ILayer {
        return this.#defaultLayer;
    }

    public get layers(): { [key: string]: ILayer } {
        return this.#layers;
    }

    public get layerMaterialType(): 'unlit' | 'standard' {
        return this.#layerMaterialType;
    }

    public get visualizedMaterialType(): 'unlit' | 'standard' {
        return this.#visualizedMaterialType;
    }

    public get overview(): ISDTFOverview {
        return this.#overview;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (3)

    public updateAttributes(attributes: IAttribute[]) {
        this.#attributes = attributes;
        this.constructAttributeVisualization();
    }

    public updateDefaultLayer(layer: ILayer) {
        this.#defaultLayer = layer;
        this.constructAttributeVisualization();
    }

    public updateDefaultMaterial(material: IMaterialAbstractData) {
        this.#defaultMaterial = material;
        this.constructAttributeVisualization();
    }
    
    public updateLayerMaterialType(type: 'unlit' | 'standard') {
        this.#layerMaterialType = type;
        this.createLayers();
        this.constructAttributeVisualization();
    }

    public updateVisualizedMaterialType(type: 'unlit' | 'standard') {
        this.#visualizedMaterialType = type;
        this.createLayers();
        this.constructAttributeVisualization();
    }

    public updateLayers(layers: { [key: string]: ILayer }) {
        this.#layers = layers;
        this.constructAttributeVisualization();
    }

    public addListener(cb: () => void): string {
        const token = this.#uuidGenerator.create();
        this.#listeners[token] = cb;
        return token;
    }

    public removeListener(token: string): boolean {
        if (!this.#listeners[token]) return false;
        delete this.#listeners[token];
        return true;
    }

    // #endregion Public Methods (3)

    // #region Private Methods (2)

    private constructAttributeVisualization() {
        this.#viewport.visualizeAttributes = (overview: ISDTFOverview, itemData?: ISDTFItemData) => {
            // early out if there are not attributes in this itemData
            if (!itemData || !itemData.attributes) {
                if (this.#attributes.length === 0) {
                    // return default layer material
                    let material;
                    if(this.#layerMaterialType === 'unlit') {
                        material = new MaterialUnlitData({
                            opacity: this.#defaultLayer.enabled ? this.#defaultLayer.opacity : 0,
                            color: this.#converter.toColor(this.#defaultLayer.color)
                        });
                    } else {
                        material = new MaterialStandardData({
                            opacity: this.#defaultLayer.enabled ? this.#defaultLayer.opacity : 0,
                            color: this.#converter.toColor(this.#defaultLayer.color)
                        });
                    }
                    return {
                        matrix: mat4.create(),
                        material
                    }
                } else {
                    // return default layer material
                    let material;
                    if(this.#layerMaterialType === 'unlit') {
                        material = new MaterialUnlitData({
                            opacity: this.#defaultLayer.enabled ? this.#defaultLayer.opacity * this.#defaultMaterial.opacity : 0,
                            color: this.#converter.toColor(this.#defaultMaterial.color)
                        });
                    } else {
                        material = new MaterialStandardData({
                            opacity: this.#defaultLayer.enabled ? this.#defaultLayer.opacity * this.#defaultMaterial.opacity : 0,
                            color: this.#converter.toColor(this.#defaultMaterial.color)
                        });
                    }
                    return {
                        matrix: mat4.create(),
                        material
                    }
                }
            }

            // search for the responsible layer property, if none is found, default layer is assigned
            let layer: ILayer = this.defaultLayer;
            if (itemData.attributes['layer'] && SdtfPrimitiveTypeGuard.isStringType(itemData.attributes['layer'].typeHint)) {
                const layerAttributes = itemData.attributes['layer'];
                layer = this.#layers[layerAttributes.value];
            }

            // early out, layer is not enabled
            if (layer.enabled === false) {
                const mat = <IMaterialAbstractData>this.#defaultMaterial.clone();
                mat.opacity = 0;
                return {
                    matrix: mat4.create(),
                    material: mat
                }
            }

            if (this.#attributes.length === 0) {
                // no attributes are specified, we go into layer visualization mode
                let material;
                if(this.#layerMaterialType === 'unlit') {
                    material = new MaterialUnlitData({
                        opacity: layer.opacity,
                        color: this.#converter.toColor(layer.color)
                    });
                } else {
                    material = new MaterialStandardData({
                        opacity: layer.opacity,
                        color: this.#converter.toColor(layer.color)
                    });
                }

                return {
                    matrix: mat4.create(),
                    material
                }
            } else {
                // attributes are specified, we go into attribute visualization mode
                const material = this.#visualizedMaterialType === 'unlit' ? new MaterialUnlitData() : new MaterialStandardData();
                for (let i = 0; i < this.#attributes.length; i++) {
                    const a = this.#attributes[i];
                    if (itemData.attributes[a.key] && itemData.attributes[a.key].typeHint === a.type) {
                        const itemDataAttribute = itemData.attributes[a.key];
                        const itemDataAttributeOverview = overview[a.key].filter(o => o.typeHint === a.type)[0];

                        switch (true) {
                            case SdtfPrimitiveTypeGuard.isColorType(a.type):
                                material.color = this.#converter.toColor('rgb(' + itemDataAttribute.value + ')');
                                material.opacity *= layer.opacity;
                                return {
                                    matrix: mat4.create(),
                                    material
                                };
                            case SdtfPrimitiveTypeGuard.isNumberType(a.type):
                                const numberAttribute = <INumberAttribute>a;
                                const numberVisualizationData = AttributeVisualizationUtils.numberVisualization(
                                    itemDataAttribute.value,
                                    (numberAttribute.min !== undefined ? numberAttribute.min : itemDataAttributeOverview.min)!,
                                    (numberAttribute.max !== undefined ? numberAttribute.max : itemDataAttributeOverview.max)!,
                                    numberAttribute.visualization,
                                    this.#visualizedMaterialType,
                                    this.#defaultMaterial
                                );
                                numberVisualizationData.material.opacity *= layer.opacity;
                                return numberVisualizationData;
                            case SdtfPrimitiveTypeGuard.isStringType(a.type):
                                const stringAttribute = <IStringAttribute>a;
                                const stringVisualizationData = AttributeVisualizationUtils.stringVisualization(
                                    itemDataAttribute.value,
                                    stringAttribute.values || itemDataAttributeOverview.values,
                                    stringAttribute.visualization,
                                    this.#visualizedMaterialType,
                                    this.#defaultMaterial
                                );

                                stringVisualizationData.material.opacity *= layer.opacity;
                                return stringVisualizationData;
                            default:
                                const defaultAttribute = <IDefaultAttribute>a;
                                material.color = this.#converter.toColor(defaultAttribute.color);
                                material.opacity *= layer.opacity;
                                return {
                                    matrix: mat4.create(),
                                    material
                                };
                        }
                    }
                }

                // no attributes were found, return the default material adjusted by the layer opacity
                const mat = <IMaterialAbstractData>this.#defaultMaterial.clone();
                mat.opacity *= layer.opacity;
                return {
                    matrix: mat4.create(),
                    material: mat
                }
            }
        }

        sceneTree.root.updateVersion();
        this.#viewport.update();
    }

    private createLayers() {
        this.#layers = {};
        if (this.#overview['layer']) {
            const layerStringAttributeOverview = this.#overview['layer'].find(a => a.typeHint === 'string');
            if (layerStringAttributeOverview && layerStringAttributeOverview.values) {
                for (let i = 0; i < layerStringAttributeOverview.values.length; i++) {
                    this.#layers[layerStringAttributeOverview.values[i]] = {
                        enabled: true,
                        opacity: 1,
                        color: this.defaultMaterial.color
                    }
                }
            }
        }
    }

    // #endregion Private Methods (2)
}