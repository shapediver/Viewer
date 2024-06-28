import {
    ATTRIBUTE_VISUALIZATION,
    IAttribute,
    IAttributeVisualizationEngine,
    IColorAttribute,
    IDefaultAttribute,
    INumberAttribute,
    IStringAttribute
} from '@shapediver/viewer.features.attribute-visualization';
import {
    createCustomUi,
    IBooleanElement,
    IDropdownElement,
    ISliderElement
} from '@shapediver/viewer.utils.demo-helper';
import { ICustomUiElement } from '@shapediver/viewer.utils.demo-helper/dist/ui/CustomUI';
import { SdtfPrimitiveTypeGuard } from '@shapediver/viewer';

export const createAttributeVisualizationUi = (container: HTMLDivElement, attributeVisualizationEngine: IAttributeVisualizationEngine) => {
    const elements: ICustomUiElement[] = [];
    const attributes: IAttribute[] = [];
    const selectedVisualization: { [key: string]: ATTRIBUTE_VISUALIZATION } = {};

    // reset all layers to full opacity
    Object.values(attributeVisualizationEngine.layers).forEach(layer => layer.opacity = 1);
    attributeVisualizationEngine.updateLayers(attributeVisualizationEngine.layers);
    // reset all attributes
    attributeVisualizationEngine.updateAttributes([]);

    for (const layer in attributeVisualizationEngine.layers) {
        elements.push(<ISliderElement>{
            type: 'slider',
            name: `Layer ${layer}`,
            min: 0,
            max: 1,
            value: 1,
            step: 0.01,
            onChangeCallback: (value: number) => {
                attributeVisualizationEngine.layers[layer].opacity = value;
                attributeVisualizationEngine.updateLayers(attributeVisualizationEngine.layers);
            }
        });
    }

    for (const attribute in attributeVisualizationEngine.overview) {
        const attributeDataCollection = attributeVisualizationEngine.overview[attribute];
        for (const attributeData of attributeDataCollection) {
            switch (true) {
                case SdtfPrimitiveTypeGuard.isNumberType(attributeData.typeHint):
                    elements.push(<IBooleanElement>{
                        type: 'boolean',
                        name: attribute,
                        value: false,
                        onChangeCallback: (value: boolean) => {
                            console.log(attribute, value);
                            if (value) {
                                attributes.push(<INumberAttribute>{
                                    key: attribute,
                                    type: attributeData.typeHint,
                                    visualization: selectedVisualization[attribute] || ATTRIBUTE_VISUALIZATION.BLUE_GREEN_RED,
                                    min: attributeData.min,
                                    max: attributeData.max
                                });
                                attributeVisualizationEngine.updateAttributes(attributes);
                            } else {
                                attributes.splice(attributes.findIndex(a => a.key === attribute), 1);
                                attributeVisualizationEngine.updateAttributes(attributes);
                            }
                        }
                    });
                    elements.push(<IDropdownElement>{
                        type: 'dropdown',
                        name: attribute + ' visualization',
                        value: Object.values(ATTRIBUTE_VISUALIZATION).indexOf(ATTRIBUTE_VISUALIZATION.BLUE_GREEN_RED),
                        choices: Object.keys(ATTRIBUTE_VISUALIZATION),
                        onChangeCallback: (value: number) => {
                            console.log(attribute, value);
                            selectedVisualization[attribute] = Object.values(ATTRIBUTE_VISUALIZATION)[value];
                            const attributeDefinition = attributes.find(a => a.key === attribute);
                            if (attributeDefinition) {
                                (attributeDefinition as INumberAttribute).visualization = selectedVisualization[attributeDefinition.key];
                                attributeVisualizationEngine.updateAttributes(attributes);
                            }
                        }
                    });
                    break;

                case SdtfPrimitiveTypeGuard.isStringType(attributeData.typeHint):
                    elements.push(<IBooleanElement>{
                        type: 'boolean',
                        name: attribute,
                        value: false,
                        onChangeCallback: (value: boolean) => {
                            console.log(attribute, value);
                            if (value) {
                                attributes.push(<IStringAttribute>{
                                    key: attribute,
                                    type: attributeData.typeHint,
                                    values: attributeData.values,
                                    visualization: selectedVisualization[attribute] || ATTRIBUTE_VISUALIZATION.BLUE_GREEN_RED
                                });
                                attributeVisualizationEngine.updateAttributes(attributes);
                            } else {
                                attributes.splice(attributes.findIndex(a => a.key === attribute), 1);
                                attributeVisualizationEngine.updateAttributes(attributes);
                            }
                        }
                    });
                    elements.push(<IDropdownElement>{
                        type: 'dropdown',
                        name: attribute + ' visualization',
                        value: Object.values(ATTRIBUTE_VISUALIZATION).indexOf(ATTRIBUTE_VISUALIZATION.BLUE_GREEN_RED),
                        choices: Object.keys(ATTRIBUTE_VISUALIZATION),
                        onChangeCallback: (value: number) => {
                            console.log(attribute, value);
                            selectedVisualization[attribute] = Object.values(ATTRIBUTE_VISUALIZATION)[value];
                            const attributeDefinition = attributes.find(a => a.key === attribute);
                            if (attributeDefinition) {
                                (attributeDefinition as IStringAttribute).visualization = selectedVisualization[attributeDefinition.key];
                                attributeVisualizationEngine.updateAttributes(attributes);
                            }
                        }
                    });
                    break;

                case SdtfPrimitiveTypeGuard.isColorType(attributeData.typeHint):
                    elements.push(<IBooleanElement>{
                        type: 'boolean',
                        name: attribute,
                        value: false,
                        onChangeCallback: (value: boolean) => {
                            console.log(attribute, value);
                            if (value) {
                                attributes.push(<IColorAttribute>{
                                    key: attribute,
                                    type: attributeData.typeHint
                                });
                                attributeVisualizationEngine.updateAttributes(attributes);
                            } else {
                                attributes.splice(attributes.findIndex(a => a.key === attribute), 1);
                                attributeVisualizationEngine.updateAttributes(attributes);
                            }
                        }
                    });
                    break;

                default:
                    elements.push(<IBooleanElement>{
                        type: 'boolean',
                        name: attribute,
                        value: false,
                        onChangeCallback: (value: boolean) => {
                            console.log(attribute, value);
                            if (value) {
                                attributes.push(<IDefaultAttribute>{
                                    key: attribute,
                                    type: attributeData.typeHint,
                                    color: 'blue'
                                });
                                attributeVisualizationEngine.updateAttributes(attributes);
                            } else {
                                attributes.splice(attributes.findIndex(a => a.key === attribute), 1);
                                attributeVisualizationEngine.updateAttributes(attributes);
                            }
                        }
                    });
            }
        }
    }

    createCustomUi(elements, container);
};