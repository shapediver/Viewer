import { addListener, createSession, createViewport, EVENTTYPE, ITreeNode, MaterialStandardData, CustomData, MATERIAL_ALPHA, VISIBILITY_MODE, GeometryData } from '@shapediver/viewer';
import { InteractionEngine, DragManager, InteractionData, IDragEvent, CameraPlaneConstraint } from '@shapediver/viewer.features.interaction';
import { IPendantsLayout, IPendant } from './pendantsGH_parametersDefinition'
import { mat4, vec3 } from 'gl-matrix';

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
            '6859299b3063a6aac2ec0acc03f5455111d75e34812c6a5ba1b937c6d8dc7d4e66d5ccc525da55027b4560c363286725fd79c5c5809edbb538586f1b65fe2cb149b98d59528c932232f371266acab42566975623bcc4d0325a26827dfcf67234374b56e97cbbe4-d1acafc06915a1bab8a7921ad45b5694',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com',
        id: 'pendants',
    });

    pendants.getParameterByName("lamps_GLTF_server")[0].value = 'https://bocci.sfo3.digitaloceanspaces.com/';
    // NOTE GUSTAVS: this is the label of the lamps from the code snippet you sent me without the ".gltf"
    const lampNames = ["configurator/100/100_Var1_White", "configurator/100/100_Var1_Grey"]
    pendants.getParameterByName("lamps_GLTF_names")[0].value = JSON.stringify(lampNames);
    pendants.getParameterByName("lamps_scale")[0].value = 1000;
    // NOTE GUSTAVS: until the issue with the glTF positioning of the lamps is fixed, keep this at 0 to see the movement better.
    pendants.getParameterByName("lamps_radius")[0].value = 0;
    await pendants.customize();

    // NOTE GUSTAVS - PENDANT INFO: Here I load the pendantsLayout_JSON initially into pendantsLayoutJSON.
    const pendantsLayoutExport = await pendants.getExportByName('pendantsLayout_JSON')[0].request();
    const fetchRepsonse = await fetch(pendantsLayoutExport.content![0].href);
    let pendantsLayoutJSON: IPendantsLayout = await fetchRepsonse.json();



    const interactionEngine = new InteractionEngine(viewport);

    const dragManager = new DragManager();
    dragManager.effectMaterial = new MaterialStandardData({ color: '#ffff00' });
    interactionEngine.addInteractionManager(dragManager);

    const cameraPlaneConstraint = new CameraPlaneConstraint();
    dragManager.addDragConstraint(cameraPlaneConstraint);

    const callback = (newNode?: ITreeNode, oldNode?: ITreeNode) => {
        if (!newNode) return;
        newNode.children.forEach((subNode, indexGroup) =>
            subNode.children.forEach((pendant, indexLamp) => {
                // NOTE GUSTAVS - PENDANT INFO: Here is where I add the data of the JSON to the pendant geometry objects.
                const pendantInfo = pendantsLayoutJSON.pendants.find(p => p.address.content === indexGroup && p.address.transformation === indexLamp)!;
                pendant.addData(new CustomData(pendantInfo));
                pendant.addData(new InteractionData({ drag: true }));

                // NOTE GUSTAVS - MATERIAL UPDATE: Here I update the materials with the settings that are stored in the JSON file.
                updateMaterial(pendant, lampNames[indexGroup] + '.gltf');
            })
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

    addListener(EVENTTYPE.INTERACTION.DRAG_END, async (e) => {
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
        pendants.getParameterByName('instructions_endPoints_JSON')[0].value = instructionsEndpoints;
        pendants.getParameterByName('pendantsLayout_JSON')[0].value = new Blob([JSON.stringify(pendantsLayoutJSON)], { type: "application/json" });
        await pendants.customize();

        // NOTE GUSTAVS - PENDANT INFO: Whenever the scene has been updated, you have to request the export to get the new data.
        const pendantsLayoutExport = await pendants.getExportByName('pendantsLayout_JSON')[0].request();
        const fetchRepsonse = await fetch(pendantsLayoutExport.content![0].href);
        pendantsLayoutJSON = await fetchRepsonse.json();
    });
})();