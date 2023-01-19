import { mat4, vec3 } from "gl-matrix";
import { Box, IEvent, IFileParameterApi, IOutputApi, IParameterApi, ISessionApi, ITreeNode, IViewportApi, PARAMETER_TYPE } from "@shapediver/viewer";
import { IDragEvent } from "@shapediver/viewer.features.interaction";

/** 
 * The outputs that were provided me by Edwin that should exist in this model.
 */
export const outputNames = [
    "2d_ring_boundary",
    "2d_texture_boundary",
    "2d_ring",
    "2d_texture",
    "G_A_Flächen",
    "G_A_Linien",
    "G_A_Vermassung",
    "G_B_2"
];

/**
 * The outputs that are used when displaying the ring.
 */
export const ringDisplayOutputNames = [
    "G_A_Flächen",
    "G_A_Linien",
    "G_A_Vermassung",
    "G_B_2"
];

// the BB of the current texture boundary
export let textureBoundaryBB: Box = new Box();
// the BB of the current ring boundary
export let ringBoundaryBB: Box = new Box();

/**
 * Create a a menu for the "texture_rotation", "texture_import" and "TS" (scale) parameters.
 * When the values are updated, also reset the "texture_move" parameter and then customize the scene.
 * The "texture_move" parameter has to be reset, because after rotating the texture vertically, 
 * the position can be out of the ring boundary with the geometry coming from the server.
 * The same issue exists for the scale, and the "texture_import".
 * 
 * @param session 
 * @param textureRotationParameter 
 * @param textureMoveParameter 
 */
export const createMenu = (session: ISessionApi, textureRotationParameter: IParameterApi<any>, textureScaleParameter: IParameterApi<number>, textureImportParameter: IFileParameterApi, textureMoveParameter: IParameterApi<string>) => {
    const menuDiv = <HTMLDivElement>document.getElementById('menu');

    /**
     * ROTATION
     */

    const textureRotationLabel = <HTMLLabelElement>document.createElement('label');
    textureRotationLabel.innerText = "Rotation";
    menuDiv.appendChild(textureRotationLabel);

    const textureRotationSelect = document.createElement('select');
    menuDiv.appendChild(textureRotationSelect);

    for (let i = 0; i < textureRotationParameter.choices!.length; i++) {
        const rotationOption = document.createElement('option');
        textureRotationSelect.appendChild(rotationOption);

        rotationOption.setAttribute("value", i + "");
        rotationOption.setAttribute("name", textureRotationParameter.choices![i]);
        rotationOption.innerHTML = textureRotationParameter.choices![i];
        if (textureRotationParameter.value == i) rotationOption.setAttribute("selected", "");
    }

    textureRotationSelect.onchange = async () => {
        textureRotationParameter.value = textureRotationSelect.value;
        textureMoveParameter.value = "[0,0]";
        await session.customize();
    }

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
        textureMoveParameter.value = "[0,0]";
        await session.customize();
    };

    /**
     * IMPORT
     */
    const textureImportLabel = <HTMLLabelElement>document.createElement('label');
    textureImportLabel.innerText = "Import";
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
            textureMoveParameter.value = "[0,0]";
            await session.customize();
        });
        reader.readAsArrayBuffer(file);
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

/**
 * Update the BB of the texture boundary and the ring boundary 
 * according the the data of the outputs "2d_texture_boundary" and "2d_ring_boundary", respectively.
 * 
 * @param outputs 
 */
export const updateBB = (outputs: { [key: string]: IOutputApi }) => {
    const textureBoundary: number[][] = outputs["2d_texture_boundary"].content![0]
        .data;
    const textureBoundaryBBMin = vec3.fromValues(Infinity, 0, Infinity);
    const textureBoundaryBBMax = vec3.fromValues(-Infinity, 0, -Infinity);
    textureBoundary.forEach((p) => {
        if (p[0] < textureBoundaryBBMin[0]) textureBoundaryBBMin[0] = p[0];
        if (p[2] < textureBoundaryBBMin[2]) textureBoundaryBBMin[2] = p[2];
        if (p[0] > textureBoundaryBBMax[0]) textureBoundaryBBMax[0] = p[0];
        if (p[2] > textureBoundaryBBMax[2]) textureBoundaryBBMax[2] = p[2];
    });
    textureBoundaryBB = new Box(textureBoundaryBBMin, textureBoundaryBBMax);

    const ringBoundary: number[][] = outputs["2d_ring_boundary"].content![0].data;
    const ringBoundaryBBMin = vec3.fromValues(Infinity, 0, Infinity);
    const ringBoundaryBBMax = vec3.fromValues(-Infinity, 0, -Infinity);
    ringBoundary.forEach((p) => {
        if (p[0] < ringBoundaryBBMin[0]) ringBoundaryBBMin[0] = p[0];
        if (p[2] < ringBoundaryBBMin[2]) ringBoundaryBBMin[2] = p[2];
        if (p[0] > ringBoundaryBBMax[0]) ringBoundaryBBMax[0] = p[0];
        if (p[2] > ringBoundaryBBMax[2]) ringBoundaryBBMax[2] = p[2];
    });
    ringBoundaryBB = new Box(ringBoundaryBBMin, ringBoundaryBBMax);
};

/**
 * A callback that is execture on DRAG_MOVE and DRAG_END events.
 * 
 * The current drag matrix is used to create an intermediate bounding box 
 * that is used to evaluate it the texture is still within the ring boundary.
 * 
 * If this is not the case, the matrix is adjusted and the texture node is being updated.
 * 
 * @param e 
 * @returns 
 */
export const positionAdjustementCallback = (e: IEvent): mat4 => {
    const dragEvent = <IDragEvent>e;

    const dragTransformation = dragEvent.node.getTransformation('SD_drag_matrix')!;
    dragTransformation.matrix[13] = 0;

    const draggedTextureBoundaryBB = textureBoundaryBB
        .clone()
        .applyMatrix(dragTransformation.matrix);

    let changed = false;
    if (draggedTextureBoundaryBB.min[0] > ringBoundaryBB.min[0]) {
        changed = true;
        dragTransformation.matrix[12] = ringBoundaryBB.min[0] - textureBoundaryBB.min[0];
    }
    if (draggedTextureBoundaryBB.max[0] < ringBoundaryBB.max[0]) {
        changed = true;
        dragTransformation.matrix[12] = ringBoundaryBB.max[0] - textureBoundaryBB.max[0];
    }
    if (draggedTextureBoundaryBB.min[2] > ringBoundaryBB.min[2]) {
        changed = true;
        dragTransformation.matrix[14] = ringBoundaryBB.min[2] - textureBoundaryBB.min[2];
    }
    if (draggedTextureBoundaryBB.max[2] < ringBoundaryBB.max[2]) {
        changed = true;
        dragTransformation.matrix[14] = ringBoundaryBB.max[2] - textureBoundaryBB.max[2];
    }

    if (changed)
        dragEvent.node.updateVersion();

    return dragTransformation.matrix;
}