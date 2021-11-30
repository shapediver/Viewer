import { ILayer } from "../interfaces/ILayer";
import { EVENTTYPE, IApi, IViewer, MaterialData, PRIMITIVETYPEHINT, SDTFAttributeVisualization, SDTFItemData, SDTFOverview } from "@shapediver/viewer"
import { IAttribute, IColorAttribute, IDefaultAttribute, INumberAttribute, IStringAttribute } from "../interfaces/IAttribute";
import { mat4 } from "gl-matrix";
import { container } from "tsyringe";
import { Converter, UuidGenerator } from "@shapediver/viewer.shared.services";
import { IAttributeVisualizationEngine } from "../interfaces/IAttributeVisualizationEngine";

export class AttributeVisualizationEngine implements IAttributeVisualizationEngine {
    // #region Properties (7)

    readonly #api: IApi;
    readonly #converter: Converter = <Converter>container.resolve(Converter);
    readonly #uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    readonly #viewer: IViewer;

    #attributes: IAttribute[] = [];
    #defaultMaterial: MaterialData = new MaterialData({color: '#f0f0f0', opacity: 0.2, KHR_materials_unlit: true});
    #layers: {
        [key: string]: ILayer
    } = {};
    #overview: SDTFOverview;
    #listeners: {
        [key: string]: () => void
    } = {};

    // #endregion Properties (7)

    // #region Constructors (1)

    constructor(api: IApi, viewer: IViewer) {
        this.#api = api;
        this.#viewer = viewer;

        this.#overview = this.#api.createSDTFOverview(this.#api.sceneTree.root);
        this.createLayers();
        this.constructAttributeVisualization();
        this.#api.addListener(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, () => {
            this.#overview = this.#api.createSDTFOverview(this.#api.sceneTree.root);
            this.createLayers();
            this.constructAttributeVisualization();

            for(let l in this.#listeners)
                this.#listeners[l]();
        })
    }

    // #endregion Constructors (1)

    // #region Public Accessors (3)

    public get defaultMaterial(): MaterialData {
        return this.#defaultMaterial;
    }

    public get layers(): { [key: string]: ILayer } {
        return this.#layers;
    }

    public get overview(): SDTFOverview {
        return this.#overview;
    }

    // #endregion Public Accessors (3)

    // #region Public Methods (3)

    public updateAttributes(attributes: IAttribute[]) {
        this.#attributes = attributes;
        this.constructAttributeVisualization();
    }

    public updateDefaultMaterial(material: MaterialData) {
        this.#defaultMaterial = material;
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
        if(!this.#listeners[token]) return false;
        delete this.#listeners[token];
        return true;
    }

    // #endregion Public Methods (3)

    // #region Private Methods (2)

    private constructAttributeVisualization() {
        this.#viewer.convertSDTFItemToVisualizationData = (itemData: SDTFItemData, overview: SDTFOverview) => {
            if(!itemData.attributes) 
                return {
                    matrix: mat4.create(),
                    material: this.#defaultMaterial
                }

            let hasLayer = false;
            let opacity = this.defaultMaterial.opacity;

            // check if the visualization for this attribute is activated
            if (itemData.attributes['layer'] && itemData.attributes['layer'].typeHint === PRIMITIVETYPEHINT.STRING) {
                const layerAttributes = itemData.attributes['layer'];
                if(this.#layers[layerAttributes.value].enabled === false) {
                    const mat = <MaterialData>this.#defaultMaterial.clone();
                    mat.opacity = 0;
                    return {
                        matrix: mat4.create(),
                        material: mat
                    }
                } else {
                    hasLayer = true;
                    opacity = this.#layers[layerAttributes.value].opacity;
                }
            }

            const material = new MaterialData({KHR_materials_unlit: true});

            for(let i = 0; i < this.#attributes.length; i++) {
                const a = this.#attributes[i];
                if(itemData.attributes[a.key] && itemData.attributes[a.key].typeHint === a.type) {
                    if(!hasLayer) opacity = 1;
                    const itemDataAttribute = itemData.attributes[a.key];
                    const itemDataAttributeOverview = overview[a.key].filter(o => o.typeHint === a.type)[0];
                    
                    switch(true) {
                        case a.type == PRIMITIVETYPEHINT.COLOR:
                            material.color = this.#converter.toColor('rgb(' + itemDataAttribute.value + ')');
                            material.opacity = opacity;
                            return {
                                matrix: mat4.create(),
                                material
                            };
                        case a.type == PRIMITIVETYPEHINT.DECIMAL || a.type == PRIMITIVETYPEHINT.DOUBLE || a.type == PRIMITIVETYPEHINT.FLOAT || a.type == PRIMITIVETYPEHINT.INT:
                            const numberAttribute = <INumberAttribute>a;
                            const numberVisualizationData = SDTFAttributeVisualization.numberVisualization(
                                itemDataAttribute.value,
                                (numberAttribute.min !== undefined ? numberAttribute.min : itemDataAttributeOverview.min)!,
                                (numberAttribute.max !== undefined ? numberAttribute.max : itemDataAttributeOverview.max)!,
                                numberAttribute.visualization,
                                this.#defaultMaterial
                            );
                            numberVisualizationData.material.opacity *= opacity;
                            return numberVisualizationData;
                        case a.type == PRIMITIVETYPEHINT.STRING:
                            const stringAttribute = <IStringAttribute>a;
                            const stringVisualizationData = SDTFAttributeVisualization.stringVisualization(
                                itemDataAttribute.value,
                                stringAttribute.values || itemDataAttributeOverview.values,
                                stringAttribute.visualization,
                                this.#defaultMaterial);

                            stringVisualizationData.material.opacity *= opacity;
                            return stringVisualizationData;
                        default:
                            const defaultAttribute = <IDefaultAttribute>a;
                            material.color = this.#converter.toColor(defaultAttribute.color);
                            material.opacity = opacity;
                            return {
                                matrix: mat4.create(),
                                material
                            };
                    }
                }
            }

            const mat = <MaterialData>this.#defaultMaterial.clone();
            mat.opacity *= opacity;
            return {
                matrix: mat4.create(),
                material: mat
            }
        }

        this.#api.sceneTree.root.updateVersion();
        this.#api.update();
    }

    private createLayers() {
        this.#layers = {};
        if(this.#overview['layer']) {
            const layerStringAttributeOverview = this.#overview['layer'].find(a => a.typeHint === 'string');
            if(layerStringAttributeOverview && layerStringAttributeOverview.values) {
                for(let i = 0; i < layerStringAttributeOverview.values.length; i++) {
                    this.#layers[layerStringAttributeOverview.values[i]] = {
                        enabled: true,
                        opacity: 1
                    }
                }
            }
        }
    }

    // #endregion Private Methods (2)
}