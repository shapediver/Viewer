import { IFileParameterApi, IOutputApi, IParameterApi, ISessionApi, ITreeNode, IViewportApi, PARAMETER_TYPE } from "@shapediver/viewer";
import { guessMimeTypeFromFilename } from "./mimeTypes";

/** 
 * The outputs that were provided me by Edwin that should exist in this model.
 */
export const outputNames = [
    "boundary_rectangle",
    "texture_rectangle",
    "boundary",
    "texture",
    "G_B_2",
    "hole",
    "boundary_pnts",
    "hole_rectangle"
];

/**
 * The outputs that are used when displaying the ring.
 */
export const ringDisplayOutputNames = [
    "G_B_2"
];

/**
 * Create a a menu for the "texture_rotation", "texture_image" and "TS" (scale) parameters.
 * When the values are updated, also reset the "texture_position" parameter and then customize the scene.
 * The "texture_position" parameter has to be reset, because after rotating the texture vertically, 
 * the position can be out of the ring boundary with the geometry coming from the server.
 * The same issue exists for the scale, and the "texture_image".
 * 
 * @param session 
 * @param textureRotationParameter 
 * @param textureMoveParameter 
 */
export const createMenu = (session: ISessionApi) => {
    const menuDiv = <HTMLDivElement>document.getElementById('menu');

    const textureRotationParameter = session.getParameterByName('texture_rotation')[0];
    const texturePositionParameter = session.getParameterByName('texture_position')[0];
    const holePositionParameter = session.getParameterByName('hole_position')[0];
    const textureScaleParameter = session.getParameterByName('TS')[0];
    const textureImportParameter = session.getParameterByName('texture_image')[0];
    const boundaryImportParameter = session.getParameterByName('boundary')[0];
    const boundaryLayerParameter = session.getParameterByName('boundary_layer')[0];
    const holeWidthParameter = session.getParameterByName('hole_width')[0];
    const holeHeightParameter = session.getParameterByName('hole_height')[0];


    /**
     * ROTATION
     */
    const textureRotationLabel = <HTMLLabelElement>document.createElement('label');
    textureRotationLabel.innerText = "Rotation";
    menuDiv.appendChild(textureRotationLabel);

    const textureRotationInput = <HTMLInputElement>document.createElement("input");
    textureRotationInput.setAttribute("type", "range");
    textureRotationInput.setAttribute("min", textureRotationParameter.min !== undefined ? textureRotationParameter.min + "" : textureRotationParameter.min + "");
    textureRotationInput.setAttribute("max", textureRotationParameter.max !== undefined ? textureRotationParameter.max + "" : textureRotationParameter.max + "");
    textureRotationInput.setAttribute("value", textureRotationParameter.value + "");
    if (textureRotationParameter.type === PARAMETER_TYPE.INT) {
        textureRotationInput.setAttribute("step", "1");
    } else if (textureRotationParameter.type === PARAMETER_TYPE.EVEN || textureRotationParameter.type === PARAMETER_TYPE.ODD) {
        textureRotationInput.setAttribute("step", "2");
    } else {
        textureRotationInput.setAttribute("step", 1 / Math.pow(10, textureRotationParameter.decimalplaces!) + "");
    }
    menuDiv.appendChild(textureRotationInput);

    textureRotationInput.onchange = async () => {
        textureRotationParameter.value = textureRotationInput.value;
        texturePositionParameter.value = "[0,0]";
        await session.customize();
    };

    /**
     * SCALE
     */
    const textureScaleLabel = <HTMLLabelElement>document.createElement('label');
    textureScaleLabel.innerText = "Scale";
    menuDiv.appendChild(textureScaleLabel);

    const textureScaleInput = <HTMLInputElement>document.createElement("input");
    textureScaleInput.setAttribute("type", "range");
    textureScaleInput.setAttribute("min", textureScaleParameter.min !== undefined ? textureScaleParameter.min + "" : textureScaleParameter.min + "");
    textureScaleInput.setAttribute("max", textureScaleParameter.max !== undefined ? textureScaleParameter.max + "" : textureScaleParameter.max + "");
    textureScaleInput.setAttribute("value", textureScaleParameter.value + "");
    if (textureScaleParameter.type === PARAMETER_TYPE.INT) {
        textureScaleInput.setAttribute("step", "1");
    } else if (textureScaleParameter.type === PARAMETER_TYPE.EVEN || textureScaleParameter.type === PARAMETER_TYPE.ODD) {
        textureScaleInput.setAttribute("step", "2");
    } else {
        textureScaleInput.setAttribute("step", 1 / Math.pow(10, textureScaleParameter.decimalplaces!) + "");
    }
    menuDiv.appendChild(textureScaleInput);

    textureScaleInput.onchange = async () => {
        textureScaleParameter.value = textureScaleInput.value;
        texturePositionParameter.value = "[0,0]";
        await session.customize();
    };

    /**
     * IMPORT TEXTURE
     */
    const textureImportLabel = <HTMLLabelElement>document.createElement('label');
    textureImportLabel.innerText = "Import Texture";
    menuDiv.appendChild(textureImportLabel);

    const textureImportInput = <HTMLInputElement>document.createElement("input") as HTMLInputElement;
    textureImportInput.setAttribute("name", "inputElement");
    textureImportInput.setAttribute("id", textureImportParameter.id);
    textureImportInput.setAttribute("type", "file");
    textureImportInput.setAttribute("accept", textureImportParameter.format!.join(','));
    textureImportInput.classList.value = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-gray-500 dark:focus:border-gray-500";
    menuDiv.appendChild(textureImportInput);

    // the callback
    textureImportInput.onchange = () => {
        // Exit if no files selected
        if (!textureImportInput.files) return;

        let file = textureImportInput.files[0];
        const reader = new FileReader();
        reader.addEventListener("load", async () => {
            const image = <ArrayBuffer>reader.result;
            const blob = new Blob([image], { type: file.type });

            textureImportParameter.value = blob;
            texturePositionParameter.value = "[0,0]";
            await session.customize();
        });
        reader.readAsArrayBuffer(file);
    };

    /**
     * IMPORT
     */
    const boundaryImportLabel = <HTMLLabelElement>document.createElement('label');
    boundaryImportLabel.innerText = "Import Boundary";
    menuDiv.appendChild(boundaryImportLabel);

    const boundaryImportInput = <HTMLInputElement>document.createElement("input") as HTMLInputElement;
    boundaryImportInput.setAttribute("name", "inputElement");
    boundaryImportInput.setAttribute("id", boundaryImportParameter.id);
    boundaryImportInput.setAttribute("type", "file");
    boundaryImportInput.setAttribute("accept", boundaryImportParameter.format!.join(','));
    boundaryImportInput.classList.value = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-gray-500 dark:focus:border-gray-500";
    menuDiv.appendChild(boundaryImportInput);

    // the callback
    boundaryImportInput.onchange = () => {
        // Exit if no files selected
        if (!boundaryImportInput.files) return;

        let file = boundaryImportInput.files[0];
        const reader = new FileReader();
        reader.addEventListener("load", async () => {
            const result = <ArrayBuffer>reader.result;
            const type = file.type || guessMimeTypeFromFilename(file.name)[0];
            const blob = new Blob([result], { type });

            boundaryImportParameter.value = blob;
            holePositionParameter.value = "[0,0]";
            await session.customize();
        });
        reader.readAsArrayBuffer(file);
    };

    /**
     * BOUNDARY LAYER
     */
    const boundaryLayerImportLabel = <HTMLLabelElement>document.createElement('label');
    boundaryLayerImportLabel.innerText = "Boundary Layer";
    menuDiv.appendChild(boundaryLayerImportLabel);

    const boundaryLayerInput = <HTMLInputElement>document.createElement("input") as HTMLInputElement;
    boundaryLayerInput.setAttribute("name", "inputElement");
    boundaryLayerInput.setAttribute("id", boundaryLayerParameter.id);
    boundaryLayerInput.setAttribute("type", "text");
    boundaryLayerInput.setAttribute("value", boundaryLayerParameter.value);
    boundaryLayerInput.classList.value = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-gray-500 focus:border-gray-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-gray-500 dark:focus:border-gray-500";
    menuDiv.appendChild(boundaryLayerInput);

    // the callback
    boundaryLayerInput.onchange = async () => {
        boundaryLayerParameter.value = boundaryLayerInput.value;
        holePositionParameter.value = "[0,0]";
        await session.customize();
    };

    /**
     * HOLE TOGGLE
     */
    const holeToggleLabel = <HTMLLabelElement>document.createElement('label');
    holeToggleLabel.innerText = "Hole Toggle";
    menuDiv.appendChild(holeToggleLabel);

    const holeToggleInput = <HTMLInputElement>document.createElement("input") as HTMLInputElement;
    holeToggleInput.setAttribute("name", "inputElement");
    holeToggleInput.setAttribute("type", "checkbox");
    holeToggleInput.setAttribute("checked", "true");
    holeToggleInput.classList.value = "ml-2 mb-2 mt-2 w-4 h-4 text-gray-600 bg-gray-100 rounded border-gray-300 focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600";
    const checkBoxDiv = <HTMLDivElement>document.createElement("div")
    checkBoxDiv.appendChild(holeToggleInput);
    menuDiv.appendChild(checkBoxDiv)

    // the callback
    holeToggleInput.onchange = async () => {
        if (holeToggleInput.checked) {
            holePositionParameter.value = "[0,0]";
        } else {
            holePositionParameter.value = "";
        }
        await session.customize();
    };


    /**
     * HOLE HEIGHT
     */

    const holeHeightLabel = <HTMLLabelElement>document.createElement('label');
    holeHeightLabel.innerText = "Hole Height";
    menuDiv.appendChild(holeHeightLabel);

    const holeHeightInput = <HTMLInputElement>document.createElement("input");
    holeHeightInput.setAttribute("type", "range");
    holeHeightInput.setAttribute("min", holeHeightParameter.min !== undefined ? holeHeightParameter.min + "" : holeHeightParameter.min + "");
    holeHeightInput.setAttribute("max", holeHeightParameter.max !== undefined ? holeHeightParameter.max + "" : holeHeightParameter.max + "");
    holeHeightInput.setAttribute("value", holeHeightParameter.value + "");
    if (holeHeightParameter.type === PARAMETER_TYPE.INT) {
        holeHeightInput.setAttribute("step", "1");
    } else if (holeHeightParameter.type === PARAMETER_TYPE.EVEN || holeHeightParameter.type === PARAMETER_TYPE.ODD) {
        holeHeightInput.setAttribute("step", "2");
    } else {
        holeHeightInput.setAttribute("step", 1 / Math.pow(10, holeHeightParameter.decimalplaces!) + "");
    }
    menuDiv.appendChild(holeHeightInput);

    holeHeightInput.onchange = async () => {
        holeHeightParameter.value = holeHeightInput.value;
        holePositionParameter.value = "[0,0]";
        await session.customize();
    };



    /**
     * HOLE WIDTH
     */

    const holeWidthLabel = <HTMLLabelElement>document.createElement('label');
    holeWidthLabel.innerText = "Hole Width";
    menuDiv.appendChild(holeWidthLabel);

    const holeWidthInput = <HTMLInputElement>document.createElement("input");
    holeWidthInput.setAttribute("type", "range");
    holeWidthInput.setAttribute("min", holeWidthParameter.min !== undefined ? holeWidthParameter.min + "" : holeWidthParameter.min + "");
    holeWidthInput.setAttribute("max", holeWidthParameter.max !== undefined ? holeWidthParameter.max + "" : holeWidthParameter.max + "");
    holeWidthInput.setAttribute("value", holeWidthParameter.value + "");
    if (holeWidthParameter.type === PARAMETER_TYPE.INT) {
        holeWidthInput.setAttribute("step", "1");
    } else if (holeWidthParameter.type === PARAMETER_TYPE.EVEN || holeWidthParameter.type === PARAMETER_TYPE.ODD) {
        holeWidthInput.setAttribute("step", "2");
    } else {
        holeWidthInput.setAttribute("step", 1 / Math.pow(10, holeWidthParameter.decimalplaces!) + "");
    }
    menuDiv.appendChild(holeWidthInput);

    holeWidthInput.onchange = async () => {
        holeWidthParameter.value = holeWidthInput.value;
        holePositionParameter.value = "[0,0]";
        await session.customize();
    };

}

/**
 * Set the restriction for all ringDisplayOutputNames only to be shown in the ringViewport
 * and all others to be shown only in the textureViewport.
 * 
 * @param outputs 
 * @param textureViewport 
 * @param ringViewport 
 */
export const setOutputRestrictions = (
    outputs: { [key: string]: IOutputApi },
    textureViewport: IViewportApi,
    ringViewport: IViewportApi
) => {
    ringDisplayOutputNames.forEach((n) => {
        console.log(n)
        outputs[n].updateCallback = (newNode?: ITreeNode, oldNode?: ITreeNode) => {
            if (newNode) {
                newNode.excludeViewports.push(textureViewport.id);
                newNode.updateVersion();
            }
        };
        outputs[n].updateCallback!(outputs[n].node);
    });

    outputNames.forEach((n) => {
        if (ringDisplayOutputNames.includes(n)) return;
        outputs[n].updateCallback = (newNode?: ITreeNode, oldNode?: ITreeNode) => {
            if (newNode) {
                newNode.excludeViewports.push(ringViewport.id);
                newNode.updateVersion();
            }
        };
        outputs[n].updateCallback!(outputs[n].node);
    });
};
