import { sceneTree, addListener, createSession, createViewport, EVENTTYPE, ITreeNode, MaterialStandardData, CustomData, MATERIAL_ALPHA, VISIBILITY_MODE, GeometryData, ThreejsData } from '@shapediver/viewer';
import { InteractionEngine, DragManager, InteractionData, IDragEvent, CameraPlaneConstraint, PlaneConstraint, LineConstraint } from '@shapediver/viewer.features.interaction';
import { IPendantsLayout, IPendant, Line } from './pendantsGH_parametersDefinition'
import { mat4, vec3 } from 'gl-matrix';
import * as THREE from "three";

type MaterialSettings = {
    [key: string]: {
        [key: string]: {
            alphaMode?: MATERIAL_ALPHA,
            color?: string,
            ior?: number,
            thickness?: number,
            opacity?: number
        }
    }
}

// NOTE GUSTAVS - MATERIAL UPDATE: Currently this is a local file, but this can live anywhere. 
let materialSettings: MaterialSettings = require('./materialSettings.json');

/**
 * NOTE GUSTAVS - MATERIAL UPDATE: This function applies the materialsSettings that are stored in the JSON to all materials of the provided pendant node.
 * 
 * @param pendant 
 * @param lampLabel 
 * @returns 
 */
const updateMaterial = (pendant: ITreeNode, lampLabel: string) => {
    if (!materialSettings[lampLabel]) return;

    pendant.traverse(node => {
        for (let i = 0; i < node.data.length; i++) {
            if (node.data[i] instanceof GeometryData) {
                const geometryData = <GeometryData>node.data[i];
                const materialData = <MaterialStandardData>(geometryData.primitive.material);
                if (!materialData) continue;

                const settings = materialSettings[lampLabel][materialData.name || ''];

                if (settings) {
                    if (settings.alphaMode !== undefined)
                        materialData.alphaMode = settings.alphaMode;
    
                    if (settings.color !== undefined)
                        materialData.color = settings.color;
    
                    if (settings.ior !== undefined)
                        materialData.ior = settings.ior;
    
                    if (settings.thickness !== undefined)
                        materialData.thickness = settings.thickness;
    
                    if (settings.opacity !== undefined)
                        materialData.opacity = settings.opacity;
    
                    materialData.updateVersion();
                    geometryData.updateVersion();
                    node.updateVersion();
                }
            }
        }
    })
}

// NOTE GUSTAVS: This is almost the same type as the IEndPointsInstruction in pendantsGH_parametersDefinition, only without the "start" property.
let instructionsEndpoints: {
    id: string,
    end: number[]
}[] = [];

(async () => {
    let viewport = await createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas'),
        visibility: VISIBILITY_MODE.MANUAL
    })
    const pendants = await createSession({
        ticket:
            'cb92435dea7deaaa15584cf1907cb70b39ea7b5910e94a5800fd339eb42c59fc016ecf15d98097b41283406f05a569ebdc9ca9b695a969cc8166c6d426da145a639c857cf09962b47d7289e28c9b06ba3c533b1b6330c218f9d2e0724f0760b03ce99b7f04c19eb5119fbbba6b1499349f903d4458f01275-390a9bc908987be09229c49fec7a0fd3',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com',
        id: 'pendants'
    });

    // NOTE GUSTAVS: this is the label of the lamps from the code snippet you sent me without the ".gltf"
    const lampNames: string[] = []

    pendants.getParameterByName("coaxialCable_type")[0].value = 0;
    pendants.getParameterByName("aircraftCable_type")[0].value = 0;
    pendants.getParameterByName("import_template")[0].value = "";
    await pendants.customize();

    // NOTE GUSTAVS - PENDANT INFO: Here I load the pendantsLayout_JSON initially into pendantsLayoutJSON.
    const pendantsLayoutExport = await pendants.getExportByName('pendantsLayout_JSON')[0].request();
    const fetchRepsonse = await fetch(pendantsLayoutExport.content![0].href);
    let pendantsLayoutJSON: IPendantsLayout = await fetchRepsonse.json();
    pendants.getParameterByName('pendantsLayout_JSON')[0].value = new Blob([JSON.stringify(pendantsLayoutJSON)], { type: "application/json" });


    const interactionEngine = new InteractionEngine(viewport);

    const dragManager = new DragManager();
    dragManager.effectMaterial = new MaterialStandardData({ color: '#ffff00' });
    interactionEngine.addInteractionManager(dragManager);

    const cameraPlaneConstraint = new CameraPlaneConstraint();
    dragManager.addDragConstraint(cameraPlaneConstraint);

    const callback = async (newNode?: ITreeNode, oldNode?: ITreeNode) => {
        if (!newNode) return;
        newNode.children.forEach((subNode, indexGroup) => {
            subNode.children.forEach((pendant, indexLamp) => {
                // NOTE GUSTAVS - PENDANT INFO: Here is where I add the data of the JSON to the pendant geometry objects.
                const pendantInfo = pendantsLayoutJSON.pendants.find(p => p.address.content === indexGroup && p.address.transformation === indexLamp)!;

                pendant.addData(new CustomData(pendantInfo));
                pendant.addData(new InteractionData({ drag: true }));

                // NOTE GUSTAVS - MATERIAL UPDATE: Here I update the materials with the settings that are stored in the JSON file.
                updateMaterial(pendant, lampNames[indexGroup] + '.gltf');
            })
        }
        );
        viewport.update();
    };

    const items = pendants
        .getOutputByName('lamps')
        .find(obj => obj.format?.[0] != 'material')!;

    items.updateCallback = callback;
    callback(items.node!);

    // NOTE GUSTAVS: By setting the visibilityMode to MANUAL, you can control when the scene is shown. This avoids showing inbetween states where the scene is not fully loaded.
    viewport.show = true;

    const positionRestriction = (e: IDragEvent) => {
        const dragEvent = e as IDragEvent;
        const node = dragEvent.node;

        // NOTE GUSTAVS - PENDANT INFO: Here I get the previously stored data from the node.
        const pendantCustomData: IPendant = (node.data.find(d => d instanceof CustomData)! as CustomData).data as IPendant;
        const lineData = pendantCustomData.data as Line;

        const dragTransformation = dragEvent.node.getTransformation("SD_drag_matrix")!;

        // get the current position (p) and the line (l1, l2) in world space
        const p = mat4.getTranslation(vec3.create(), node.worldMatrix);

        const l1 = vec3.fromValues(lineData[0][0], lineData[0][1], lineData[0][2]);

        // restrict the values
        p[0] = l1[0];
        p[1] = l1[1];

        const min = pendants.getParameterByName("room_height")[0].value- pendants.getParameterByName("pendants_height_lowest")[0].value;
        const max = pendants.getParameterByName("room_height")[0].value- pendants.getParameterByName("pendants_height_highest")[0].value;
        p[2] = Math.max(Math.min(p[2], max), min);
        
        // reset the translation of the drag matrix before calculating the world matrix for the inverse
        // to avoid inversion of the translation
        dragTransformation.matrix[12] = 0;
        dragTransformation.matrix[13] = 0;
        dragTransformation.matrix[14] = 0;

        // move the adjusted position from world to object space
        const d = vec3.transformMat4(vec3.create(), p, mat4.invert(mat4.create(), node.worldMatrix))

        // set this as the translation part of the matrix
        dragTransformation.matrix[12] = d[0];
        dragTransformation.matrix[13] = d[1];
        dragTransformation.matrix[14] = d[2];

        dragEvent.node.updateVersion();

        return dragTransformation.matrix;
    }
    

    addListener(EVENTTYPE.INTERACTION.DRAG_MOVE, async (e) => {
        positionRestriction(e as IDragEvent);
    });

    addListener(EVENTTYPE.INTERACTION.DRAG_END, async (e) => {
        positionRestriction(e as IDragEvent);
        const dragEvent = e as IDragEvent;
        const node = dragEvent.node;

        // NOTE GUSTAVS - PENDANT INFO: Here I get the previously stored data from the node.
        const pendantCustomData: IPendant = (node.data.find(d => d instanceof CustomData)! as CustomData).data as IPendant;

        // NOTE GUSTAVS: instead of the dragMatrix, which would only provide the offset, we need to get the position in world coordinates
        const endPosition = mat4.getTranslation(vec3.create(), node.worldMatrix);

        // NOTE GUSTAVS: to keep the movement of previously moved pendants, we need to keep them stored and provide them again, as there is no State in the Grasshopper model
        const instruction = instructionsEndpoints.find(instruction => instruction.id === pendantCustomData.id);
        if (instruction) {
            // there was a previous instruction, we overwrite the end point
            instruction.end = [endPosition[0], endPosition[1], endPosition[2]];
        } else {
            // there was no previous instruction, we create a new one
            instructionsEndpoints.push({
                id: pendantCustomData.id,
                end: [endPosition[0], endPosition[1], endPosition[2]]
            })
        }

        // NOTE GUSTAVS: not only do we need to adjust the instructions_endPoints_JSON, we also need to load the pendantsLayout_JSON again.
        pendants.getParameterByName('instructions_endPoints_JSON')[0].value = JSON.stringify(instructionsEndpoints);
        await pendants.customize();
    });
})();