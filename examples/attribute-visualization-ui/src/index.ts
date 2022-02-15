
import * as SDV from '@shapediver/viewer'
import * as SDVAttributeVisualization from '@shapediver/viewer.features.attribute-visualization'

(<any>window).SDV = SDV;

const layerMenuDiv = <HTMLElement>document.getElementById('layers');
const attributeMenuDiv = <HTMLElement>document.getElementById('attributes');
const attributeMenuList = document.createElement('div');

const dropDownDiv = document.createElement("div");
const dropDown = document.createElement("select");
dropDownDiv.appendChild(dropDown);
attributeMenuDiv.appendChild(dropDownDiv);
attributeMenuDiv.appendChild(attributeMenuList);

let attributeVisualizationEngine: SDVAttributeVisualization.AttributeVisualizationEngine;

const updateLayerMenu = () => {
    while (layerMenuDiv.firstChild)
        layerMenuDiv.removeChild(layerMenuDiv.firstChild);
    
    for(let l in attributeVisualizationEngine.layers) {
        const layerDiv = document.createElement("div");
        const label = document.createElement("label");
        label.setAttribute("for", l);
        label.innerHTML = l;

        let inputElement = <HTMLInputElement>document.createElement("input");
        inputElement.setAttribute("id", l);
        inputElement.setAttribute("type", "range");
        inputElement.setAttribute("min", 0 + '');
        inputElement.setAttribute("max", 1 + '');
        inputElement.setAttribute("value", 1 + '');
        inputElement.setAttribute("step", 0.01 + '');
        inputElement.onchange = async () => {
            attributeVisualizationEngine.layers[inputElement.id].opacity = +inputElement.value;
            attributeVisualizationEngine.updateLayers(attributeVisualizationEngine.layers)
        };
        
        const colorInputElement = document.createElement("input");
        colorInputElement.id = l;
        colorInputElement.setAttribute("type", "color");
        colorInputElement.setAttribute("value", attributeVisualizationEngine.defaultMaterial.color);
        colorInputElement.onchange = async () => {
            attributeVisualizationEngine.layers[colorInputElement.id].color = colorInputElement.value;
            attributeVisualizationEngine.updateLayers(attributeVisualizationEngine.layers)
        };

        layerDiv.appendChild(label);
        layerDiv.appendChild(inputElement);
        layerDiv.appendChild(colorInputElement);
        layerMenuDiv.appendChild(layerDiv);
    }
}

const updateDefinition = () => {
    const attributes: SDVAttributeVisualization.IAttribute[] = [];
    for(let i = 0; i < attributeMenuList.children.length; i++) {
        const child = attributeMenuList.children[i];
        const attributeDefinition: {
            key: string,
            type: string
        } = JSON.parse(child.getAttribute('value') || '');

        switch (true) {
            case attributeDefinition.type == SDV.PRIMITIVETYPEHINT.COLOR:
                const colorAttribute: SDVAttributeVisualization.IColorAttribute = {
                    key: attributeDefinition.key, 
                    type: SDV.PRIMITIVETYPEHINT.COLOR
                };
                attributes.push(colorAttribute)
                break;
            case attributeDefinition.type == SDV.PRIMITIVETYPEHINT.DECIMAL || attributeDefinition.type == SDV.PRIMITIVETYPEHINT.DOUBLE || attributeDefinition.type == SDV.PRIMITIVETYPEHINT.FLOAT || attributeDefinition.type == SDV.PRIMITIVETYPEHINT.INT:
                let numberMin: HTMLInputElement, numberMax: HTMLInputElement, numberVisualization: HTMLSelectElement;

                for(let i  = 0; i < child.children.length; i++) {
                    if(child.children[i].id === 'options') {
                        for(let j  = 0; j < child.children[i].children.length; j++) {
                            if(child.children[i].children[j].id === 'min') numberMin = <HTMLInputElement>child.children[i].children[j];    
                            if(child.children[i].children[j].id === 'max') numberMax = <HTMLInputElement>child.children[i].children[j];    
                            if(child.children[i].children[j].id === 'visualization') numberVisualization = <HTMLSelectElement>child.children[i].children[j];                            
                        }
                    }
                }
                const numberAttribute: SDVAttributeVisualization.INumberAttribute = {
                    key: attributeDefinition.key, 
                    type: <SDV.PRIMITIVETYPEHINT.DOUBLE | SDV.PRIMITIVETYPEHINT.FLOAT | SDV.PRIMITIVETYPEHINT.DECIMAL | SDV.PRIMITIVETYPEHINT.INT>attributeDefinition.type,
                    min: +numberMin!.value,
                    max: +numberMax!.value,
                    visualization: <SDV.ATTRIBUTEVISUALIZATION>numberVisualization!.value.toLowerCase()
                };
                attributes.push(numberAttribute)
                break;
            case attributeDefinition.type == SDV.PRIMITIVETYPEHINT.STRING:
                let stringValues: HTMLInputElement, stringVisualization: HTMLSelectElement;

                for(let i  = 0; i < child.children.length; i++) {
                    if(child.children[i].id === 'options') {
                        for(let j  = 0; j < child.children[i].children.length; j++) {
                            if(child.children[i].children[j].id === 'values') stringValues = <HTMLInputElement>child.children[i].children[j];    
                            if(child.children[i].children[j].id === 'visualization') stringVisualization = <HTMLSelectElement>child.children[i].children[j];                            
                        }
                    }
                }
                const stringAttribute: SDVAttributeVisualization.IStringAttribute = {
                    key: attributeDefinition.key, 
                    type: SDV.PRIMITIVETYPEHINT.STRING,
                    values: stringValues!.value.split(','),
                    visualization: <SDV.ATTRIBUTEVISUALIZATION>stringVisualization!.value.toLowerCase()
                };
                attributes.push(stringAttribute)
                break;
            default:
                let defaultColor: HTMLInputElement;

                for(let i  = 0; i < child.children.length; i++) {
                    if(child.children[i].id === 'options') {
                        for(let j  = 0; j < child.children[i].children.length; j++) {
                            if(child.children[i].children[j].id === 'color') defaultColor = <HTMLInputElement>child.children[i].children[j];    
                        }
                    }
                }
                const defaultAttribute: SDVAttributeVisualization.IDefaultAttribute = {
                    key: attributeDefinition.key, 
                    type: <SDV.PRIMITIVETYPEHINT>attributeDefinition.type,
                    color: defaultColor!.value
                };
                attributes.push(defaultAttribute)
                break;
        }
    }
    attributeVisualizationEngine.updateAttributes(attributes)

}

const createAttributeElement = (key: string, attribute: {
    typeHint: string;
    count: number;
    values?: string[] | undefined;
    min?: number | undefined;
    max?: number | undefined;
}) => {
    const attributeDiv = document.createElement("div");
    attributeDiv.style.background = '#ffffff'
    attributeDiv.style.margin = '5px'
    attributeDiv.id = key + '_' + attribute.typeHint;
    attributeDiv.setAttribute('value', JSON.stringify({
        key,
        type: attribute.typeHint
    }))


    const label = document.createElement("label");
    label.setAttribute("for", key);
    label.innerHTML = key + ' (' + attribute.typeHint + ')';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'X';
    cancelButton.style.background = 'red';
    cancelButton.style.float = 'right';

    cancelButton.onclick = () => {
        attributeMenuList.removeChild(attributeDiv);
        updateDefinition();
    }

    attributeDiv.appendChild(label)
    attributeDiv.appendChild(cancelButton)
    return attributeDiv;
}

dropDown.onchange = async () => {
    const attributeDefinition: {
        key: string,
        type: string
    } = JSON.parse(dropDown.value);

    const attribute = attributeVisualizationEngine.overview[attributeDefinition.key].find(a => a.typeHint = attributeDefinition.type);
    if(!attribute) return;
    for(let i  = 0; i < attributeMenuList.children.length; i++) 
        if(attributeMenuList.children[i].id === attributeDefinition.key + '_' + attribute.typeHint) return;

    const div = createAttributeElement(attributeDefinition.key, attribute);
    attributeMenuList.appendChild(div);

    switch (true) {
        case attribute.typeHint == SDV.PRIMITIVETYPEHINT.COLOR:
            break;
            
        case attribute.typeHint == SDV.PRIMITIVETYPEHINT.DECIMAL || attribute.typeHint == SDV.PRIMITIVETYPEHINT.DOUBLE || attribute.typeHint == SDV.PRIMITIVETYPEHINT.FLOAT || attribute.typeHint == SDV.PRIMITIVETYPEHINT.INT:
            const numberOptionsDiv = document.createElement("div");
            numberOptionsDiv.id = 'options';
            numberOptionsDiv.style.background = '#ffffff'

            const minLabel = document.createElement("label");
            minLabel.innerHTML = 'min';
            numberOptionsDiv.appendChild(minLabel);
            const minInputElement = document.createElement("input");
            minInputElement.id = 'min';
            minInputElement.setAttribute("type", "text");
            minInputElement.setAttribute("value", attribute.min! + '');
            minInputElement.style.width = '25px';
            numberOptionsDiv.appendChild(minInputElement);
            minInputElement.onchange = () => {
                updateDefinition();
            };

            const maxLabel = document.createElement("label");
            maxLabel.innerHTML = 'max';
            numberOptionsDiv.appendChild(maxLabel);
            const maxInputElement = document.createElement("input");
            maxInputElement.id = 'max';
            maxInputElement.setAttribute("type", "text");
            maxInputElement.setAttribute("value", attribute.max! + '');
            maxInputElement.style.width = '25px';
            numberOptionsDiv.appendChild(maxInputElement);
            maxInputElement.onchange = () => {
                updateDefinition();
            };

            
            const numberDropDown = document.createElement("select");
            for (let a in SDV.ATTRIBUTEVISUALIZATION) {
                let option = document.createElement("option");
                option.setAttribute("name", a);
                option.setAttribute("value", a);
                option.innerHTML = a;
                numberDropDown.appendChild(option);
            }
            numberDropDown.id = 'visualization';
            numberDropDown.onchange = () => {
                updateDefinition()
            }
            numberOptionsDiv.appendChild(numberDropDown);

            div.appendChild(numberOptionsDiv);
            break;
        case attribute.typeHint == SDV.PRIMITIVETYPEHINT.STRING:
            const stringOptionsDiv = document.createElement("div");
            stringOptionsDiv.id = 'options';
            stringOptionsDiv.style.background = '#ffffff'

            const valuesLabel = document.createElement("label");
            valuesLabel.innerHTML = 'values';
            stringOptionsDiv.appendChild(valuesLabel);
            const valuesInputElement = document.createElement("input");
            valuesInputElement.id = 'values';
            valuesInputElement.setAttribute("type", "text");
            valuesInputElement.setAttribute("value", attribute.values! + '');
            stringOptionsDiv.appendChild(valuesInputElement);
            valuesInputElement.onchange = () => {
                updateDefinition();
            };
            
            const dropDown = document.createElement("select");
            for (let a in SDV.ATTRIBUTEVISUALIZATION) {
                let option = document.createElement("option");
                option.setAttribute("name", a);
                option.setAttribute("value", a);
                option.innerHTML = a;
                dropDown.appendChild(option);
            }
            dropDown.onchange = () => {
                updateDefinition()
            }
            dropDown.id = 'visualization';
            stringOptionsDiv.appendChild(dropDown);

            div.appendChild(stringOptionsDiv);
            break;
        default:
            const defaultOptionsDiv = document.createElement("div");
            defaultOptionsDiv.id = 'options';
            defaultOptionsDiv.style.background = '#ffffff'

            const colorInputElement = document.createElement("input");
            colorInputElement.id = 'color';
            colorInputElement.setAttribute("type", "color");
            colorInputElement.setAttribute("value", attributeVisualizationEngine.defaultMaterial.color);

            colorInputElement.onchange = () => {
                updateDefinition()
            }

            defaultOptionsDiv.appendChild(colorInputElement);
            div.appendChild(defaultOptionsDiv);
            break;
    }
    updateDefinition();
};

const updateAttributeMenu = () => {
    while (dropDown.firstChild)
        dropDown.removeChild(dropDown.firstChild);

    for (let a in attributeVisualizationEngine.overview) {
        const attribute = attributeVisualizationEngine.overview[a];
        for(let i = 0; i < attribute.length; i++) {

            // the layers are already handled differently 
            if(a === 'layer' && attribute[i].typeHint === SDV.PRIMITIVETYPEHINT.STRING) continue;

            let option = document.createElement("option");
            option.setAttribute("name", a + ' (' + attribute[i].typeHint + ')');
            const def = {
                key: a,
                type: attribute[i].typeHint
            }
            option.setAttribute("value", JSON.stringify(def));
            option.innerHTML = a + ' (' + attribute[i].typeHint + ')';
            dropDown.appendChild(option);
        }
    }
}

(async () => {
    let viewer = await SDV.api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    let session = await SDV.api.createSession({ 
        ticket: '4e87845052d876e1e8fb70fc43b7112aafe762545f20148b26e06d3636f4aa7af86e0fed0539be8107d2313c6fe5624a8a682d4c47a46d1d257f11be4ba558eb619e49f79bbf0a885984ea33795a2fdddd879374d5dce52f765cfdbadc45fc80bd3ba00ec1d57d-e796f62331f0a78069ed73a2a0c0f2b0', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession'
    });
    viewer.type = SDV.RENDERERTYPE.ATTRIBUTES;

    attributeVisualizationEngine = new SDVAttributeVisualization.AttributeVisualizationEngine(SDV.api, viewer);
    updateLayerMenu();
    updateAttributeMenu();

    attributeVisualizationEngine.addListener(() => {
        updateLayerMenu();
        updateAttributeMenu();
    })
})();