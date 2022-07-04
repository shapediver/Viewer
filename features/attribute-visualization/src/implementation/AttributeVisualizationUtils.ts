import { IMaterialAbstractData, ISDTFAttributeVisualizationData, MaterialUnlitData } from "@shapediver/viewer.shared.types";
import { mat4 } from "gl-matrix";
import { ATTRIBUTE_VISUALIZATION } from "../interfaces/IAttribute";


const grayscaleVisualization = (factor: number): ISDTFAttributeVisualizationData => {
    const color = Math.floor(factor * 255.0);
    return {
        material: new MaterialUnlitData({color: 'rgb(' + color + ', '  + color + ', ' + color + ')', opacity: 1}),
        matrix: mat4.create()
    }
}

const opacityVisualization = (factor: number, defaultMaterial?: IMaterialAbstractData): ISDTFAttributeVisualizationData => {
    return {
        material: new MaterialUnlitData({color: defaultMaterial?.color || '#00fff7', opacity: factor}),
        matrix: mat4.create()
    }
}

const blueRedVisualization = (factor: number): ISDTFAttributeVisualizationData => {
    const red = factor * 255.0;
    const blue = (1 - factor) * 255.0;
    return {
        material: new MaterialUnlitData({color: 'rgb(' + Math.floor(red) + ', '  + Math.floor(0) + ', ' + Math.floor(blue) + ')', opacity: 1}),
        matrix: mat4.create()
    }
}

const blueWhiteRedVisualization = (factor: number): ISDTFAttributeVisualizationData => {
    let red = 255, green = 255, blue = 255;

    if(factor < 0.5) {
        const remappedFactor = factor / 0.5;
        red = 255.0 * remappedFactor;
        green = 255.0 * remappedFactor;
        blue = 255.0;
    } else {
        const remappedFactor = (factor - 0.5) / 0.5;
        red = 255.0;
        green = 255.0 * (1 - remappedFactor);
        blue = 255.0 * (1 - remappedFactor);
    } 
    return {
        material: new MaterialUnlitData({color: 'rgb(' + Math.floor(red) + ', '  + Math.floor(green) + ', ' + Math.floor(blue) + ')', opacity: 1}),
        matrix: mat4.create()
    }
}

const greenRedVisualization = (factor: number): ISDTFAttributeVisualizationData => {
    const red = factor * 255.0;
    const green = (1 - factor) * 255.0;
    return {
        material: new MaterialUnlitData({color: 'rgb(' + Math.floor(red) + ', '  + Math.floor(green) + ', ' + Math.floor(0) + ')', opacity: 1}),
        matrix: mat4.create()
    }
}

const greenWhiteRedVisualization = (factor: number): ISDTFAttributeVisualizationData => {
    let red = 255, green = 255, blue = 255;

    if(factor < 0.5) {
        const remappedFactor = factor / 0.5;
        red = 255.0 * remappedFactor;
        green = 255.0;
        blue = 255.0 * remappedFactor;
    } else {
        const remappedFactor = (factor - 0.5) / 0.5;
        red = 255.0;
        green = 255.0 * (1 - remappedFactor);
        blue = 255.0 * (1 - remappedFactor);
    } 
    return {
        material: new MaterialUnlitData({color: 'rgb(' + Math.floor(red) + ', '  + Math.floor(green) + ', ' + Math.floor(blue) + ')', opacity: 1}),
        matrix: mat4.create()
    }
}

const blueGreenRedVisualization = (factor: number): ISDTFAttributeVisualizationData => {
    let red = 255, green = 255, blue = 255;

    if(factor < 0.5) {
        const remappedFactor = factor / 0.5;
        red = 0;
        green = 255.0 * remappedFactor;
        blue = 255.0 * (1 - remappedFactor);
    } else {
        const remappedFactor = (factor - 0.5) / 0.5;
        red = 255.0 * remappedFactor;
        green = 255.0 * (1 - remappedFactor);
        blue = 0;
    } 
    return {
        material: new MaterialUnlitData({color: 'rgb(' + Math.floor(red) + ', '  + Math.floor(green) + ', ' + Math.floor(blue) + ')', opacity: 1}),
        matrix: mat4.create()
    }
}

const blueGreenYellowRedPurpleWhiteVisualization = (factor: number): ISDTFAttributeVisualizationData => {
    let red = 255, green = 255, blue = 255;

    if(factor < 0.2) {
        const remappedFactor = factor / 0.2;
        red = 0;
        green = 255.0 * remappedFactor;
        blue = 255.0 * (1 - remappedFactor);
    } else if(factor < 0.4) {
        const remappedFactor = (factor - 0.2) / 0.2;
        red = 255.0 * remappedFactor;
        green = 255.0;
        blue = 0.0;
    } else if(factor < 0.6) {
        const remappedFactor = (factor - 0.4) / 0.2;
        red = 255.0;
        green = 255.0 * (1 - remappedFactor)
        blue = 0.0;
    } else if(factor < 0.8) {
        const remappedFactor = (factor - 0.6) / 0.2;
        red = 255.0;
        green = 0.0;
        blue = 255.0 * remappedFactor;
    } else {
        const remappedFactor = (factor - 0.8) / 0.2;
        red = 255.0;
        green = 255.0 * remappedFactor;
        blue = 255.0;
    } 
    return {
        material: new MaterialUnlitData({color: 'rgb(' + Math.floor(red) + ', '  + Math.floor(green) + ', ' + Math.floor(blue) + ')', opacity: 1}),
        matrix: mat4.create()
    }
}

const hslVisualization = (factor: number): ISDTFAttributeVisualizationData => {
    const hue = factor * 359.99;
    return {
        material: new MaterialUnlitData({color: 'hsl(' + Math.floor(hue) + ', 100%, 50%)', opacity: 1}),
        matrix: mat4.create()
    }
}

const numberVisualization = (value: number, min: number, max: number, type: ATTRIBUTE_VISUALIZATION, defaultMaterial?: IMaterialAbstractData): ISDTFAttributeVisualizationData => {
    let factor = (value - min) / (max - min);
    factor = Math.min(1, Math.max(0, factor))

    switch(type) {
        case ATTRIBUTE_VISUALIZATION.GRAYSCALE:
            return grayscaleVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.OPACITY:
            return opacityVisualization(factor, defaultMaterial);
        case ATTRIBUTE_VISUALIZATION.BLUE_RED:
            return blueRedVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.BLUE_WHITE_RED:
            return blueWhiteRedVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.GREEN_RED:
            return greenRedVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED:
            return greenWhiteRedVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.BLUE_GREEN_RED:
            return blueGreenRedVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.BLUE_GREEN_YELLOW_RED_PURPLE_WHITE:
            return blueGreenYellowRedPurpleWhiteVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.HSL:
            return hslVisualization(factor);
    }
}

const stringVisualization = (value: string, values: string[], type: ATTRIBUTE_VISUALIZATION, defaultMaterial?: IMaterialAbstractData): ISDTFAttributeVisualizationData => {
    let factor = values.indexOf(value) / (values.length - 1);
    factor = Math.min(1, Math.max(0, factor))
    switch(type) {
        case ATTRIBUTE_VISUALIZATION.GRAYSCALE:
            return grayscaleVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.OPACITY:
            return opacityVisualization(factor, defaultMaterial);
        case ATTRIBUTE_VISUALIZATION.BLUE_RED:
            return blueRedVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.BLUE_WHITE_RED:
            return blueWhiteRedVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.GREEN_RED:
            return greenRedVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED:
            return greenWhiteRedVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.BLUE_GREEN_RED:
            return blueGreenRedVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.BLUE_GREEN_YELLOW_RED_PURPLE_WHITE:
            return blueGreenYellowRedPurpleWhiteVisualization(factor);
        case ATTRIBUTE_VISUALIZATION.HSL:
            return hslVisualization(factor);
    }
}

export const AttributeVisualizationUtils = {
    numberVisualization,
    stringVisualization
};