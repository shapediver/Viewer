import { mat4 } from "gl-matrix"
import { AbstractMaterialData } from "../material/AbstractMaterialData";
import { MaterialUnlitData } from "../material/MaterialUnlitData";

export type SDTFAttributeVisualizationData = {
    material: AbstractMaterialData,
    matrix: mat4
}

export enum ATTRIBUTEVISUALIZATION {
    GRAYSCALE = 'grayscale',
    OPACITY = 'opacity',
    BLUE_RED = 'blue_red',
    BLUE_WHITE_RED = 'blue_white_red',
    GREEN_RED = 'green_red',
    GREEN_WHITE_RED = 'green_white_red',
    BLUE_GREEN_RED = 'blue_green_red',
    BLUE_GREEN_YELLOW_RED_PURPLE_WHITE = 'blue_green_yellow_red_purple_white',
    HSL = 'hsl'
}

const grayscaleVisualization = (factor: number): SDTFAttributeVisualizationData => {
    const color = Math.floor(factor * 255.0);
    return {
        material: new MaterialUnlitData({color: 'rgb(' + color + ', '  + color + ', ' + color + ')', opacity: 1}),
        matrix: mat4.create()
    }
}

const opacityVisualization = (factor: number, defaultMaterial?: AbstractMaterialData): SDTFAttributeVisualizationData => {
    return {
        material: new MaterialUnlitData({color: defaultMaterial?.color || '#00fff7', opacity: factor}),
        matrix: mat4.create()
    }
}

const blueRedVisualization = (factor: number): SDTFAttributeVisualizationData => {
    const red = factor * 255.0;
    const blue = (1 - factor) * 255.0;
    return {
        material: new MaterialUnlitData({color: 'rgb(' + Math.floor(red) + ', '  + Math.floor(0) + ', ' + Math.floor(blue) + ')', opacity: 1}),
        matrix: mat4.create()
    }
}

const blueWhiteRedVisualization = (factor: number): SDTFAttributeVisualizationData => {
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

const greenRedVisualization = (factor: number): SDTFAttributeVisualizationData => {
    const red = factor * 255.0;
    const green = (1 - factor) * 255.0;
    return {
        material: new MaterialUnlitData({color: 'rgb(' + Math.floor(red) + ', '  + Math.floor(green) + ', ' + Math.floor(0) + ')', opacity: 1}),
        matrix: mat4.create()
    }
}

const greenWhiteRedVisualization = (factor: number): SDTFAttributeVisualizationData => {
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

const blueGreenRedVisualization = (factor: number): SDTFAttributeVisualizationData => {
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

const blueGreenYellowRedPurpleWhiteVisualization = (factor: number): SDTFAttributeVisualizationData => {
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

const hslVisualization = (factor: number): SDTFAttributeVisualizationData => {
    const hue = factor * 359.99;
    return {
        material: new MaterialUnlitData({color: 'hsl(' + Math.floor(hue) + ', 100%, 50%)', opacity: 1}),
        matrix: mat4.create()
    }
}

const numberVisualization = (value: number, min: number, max: number, type: ATTRIBUTEVISUALIZATION, defaultMaterial?: AbstractMaterialData): SDTFAttributeVisualizationData => {
    let factor = (value - min) / (max - min);
    factor = Math.min(1, Math.max(0, factor))

    switch(type) {
        case ATTRIBUTEVISUALIZATION.GRAYSCALE:
            return grayscaleVisualization(factor);
        case ATTRIBUTEVISUALIZATION.OPACITY:
            return opacityVisualization(factor, defaultMaterial);
        case ATTRIBUTEVISUALIZATION.BLUE_RED:
            return blueRedVisualization(factor);
        case ATTRIBUTEVISUALIZATION.BLUE_WHITE_RED:
            return blueWhiteRedVisualization(factor);
        case ATTRIBUTEVISUALIZATION.GREEN_RED:
            return greenRedVisualization(factor);
        case ATTRIBUTEVISUALIZATION.GREEN_WHITE_RED:
            return greenWhiteRedVisualization(factor);
        case ATTRIBUTEVISUALIZATION.BLUE_GREEN_RED:
            return blueGreenRedVisualization(factor);
        case ATTRIBUTEVISUALIZATION.BLUE_GREEN_YELLOW_RED_PURPLE_WHITE:
            return blueGreenYellowRedPurpleWhiteVisualization(factor);
        case ATTRIBUTEVISUALIZATION.HSL:
            return hslVisualization(factor);
    }
}

const stringVisualization = (value: string, values: string[], type: ATTRIBUTEVISUALIZATION, defaultMaterial?: AbstractMaterialData): SDTFAttributeVisualizationData => {
    let factor = values.indexOf(value) / (values.length - 1);
    factor = Math.min(1, Math.max(0, factor))
    switch(type) {
        case ATTRIBUTEVISUALIZATION.GRAYSCALE:
            return grayscaleVisualization(factor);
        case ATTRIBUTEVISUALIZATION.OPACITY:
            return opacityVisualization(factor, defaultMaterial);
        case ATTRIBUTEVISUALIZATION.BLUE_RED:
            return blueRedVisualization(factor);
        case ATTRIBUTEVISUALIZATION.BLUE_WHITE_RED:
            return blueWhiteRedVisualization(factor);
        case ATTRIBUTEVISUALIZATION.GREEN_RED:
            return greenRedVisualization(factor);
        case ATTRIBUTEVISUALIZATION.GREEN_WHITE_RED:
            return greenWhiteRedVisualization(factor);
        case ATTRIBUTEVISUALIZATION.BLUE_GREEN_RED:
            return blueGreenRedVisualization(factor);
        case ATTRIBUTEVISUALIZATION.BLUE_GREEN_YELLOW_RED_PURPLE_WHITE:
            return blueGreenYellowRedPurpleWhiteVisualization(factor);
        case ATTRIBUTEVISUALIZATION.HSL:
            return hslVisualization(factor);
    }
}

export const SDTFAttributeVisualization = {
    numberVisualization,
    stringVisualization
};