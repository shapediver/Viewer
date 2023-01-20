import { addListener, createViewport, ENVIRONMENT_MAP, FLAG_TYPE, GeometryData, ITaskEvent, ITreeNode, IViewportApi, MaterialStandardData, MATERIAL_ALPHA, MATERIAL_SIDE, sceneTree, TASK_TYPE, VISIBILITY_MODE } from "@shapediver/viewer";
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine";
import { EVENTTYPE } from "@shapediver/viewer.shared.services";
import { createCustomUi, IBooleanElement, IDropdownElement, IStringElement } from "@shapediver/viewer.utils.demo-helper";
import { container } from "tsyringe";
import { addGLTF, createMenu } from "./utils";

// list of models and the path to them
export const models = ["Bocci/100_Light_Model/100_Var1_Grey.gltf", "Bocci/100_Light_Model/100_Var1_White.gltf", "Bocci/100_Light_Model/100_Var2_Grey.gltf", "Bocci/100_Light_Model/100_Var2_White.gltf", "Bocci/100_Light_Model/100_Var3_Grey.gltf", "Bocci/100_Light_Model/100_Var3_White.gltf", "Bocci/14_Light_Model/14_Amber1.gltf", "Bocci/14_Light_Model/14_Clear1.gltf", "Bocci/14_Light_Model/14_Grey1.gltf", "Bocci/14_Light_Model/_archiv/14_Amber.gltf", "Bocci/14_Light_Model/_archiv/14_Clear.gltf", "Bocci/14_Light_Model/_archiv/14_Grey.gltf", "Bocci/16_Light_Model/16_Grey1_1.gltf", "Bocci/16_Light_Model/16_Grey2_1.gltf", "Bocci/16_Light_Model/16_White1_1.gltf", "Bocci/16_Light_Model/16_White2_1.gltf", "Bocci/16_Light_Model/_archiv/16_Grey1.gltf", "Bocci/16_Light_Model/_archiv/16_Grey2.gltf", "Bocci/16_Light_Model/_archiv/16_White1.gltf", "Bocci/16_Light_Model/_archiv/16_White2.gltf", "Bocci/21_Light_Model/21_Var1_1.gltf", "Bocci/21_Light_Model/21_Var2_1.gltf", "Bocci/21_Light_Model/21_Var3_1.gltf", "Bocci/21_Light_Model/_archiv/21_Var1.gltf", "Bocci/21_Light_Model/_archiv/21_Var2.gltf", "Bocci/21_Light_Model/_archiv/21_Var3.gltf", "Bocci/28_Light_Model/28_Var2_green.gltf", "Bocci/28_Light_Model/28_Var3_green.gltf", "Bocci/38_Light_Model/38_Var1.gltf", "Bocci/38_Light_Model/38_Var2.gltf", "Bocci/38_Light_Model/38_Var3.gltf", "Bocci/44_Light_Model/44_Var1.gltf", "Bocci/44_Light_Model/44_Var2.gltf", "Bocci/44_Light_Model/44_Var3.gltf", "Bocci/44_Light_Model/44_Var4.gltf", "Bocci/44_Light_Model/44_Var5.gltf", "Bocci/57_Light_Model/57_Var1_White.gltf", "Bocci/57_Light_Model/57_Var2_LightMirrored.gltf", "Bocci/57_Light_Model/57_Var3_Grey.gltf", "Bocci/57_Light_Model/57_Var4_DarkMirrored.gltf", "Bocci/73V_Light_Model/73V_Var1.gltf", "Bocci/73V_Light_Model/73V_Var2.gltf", "Bocci/73V_Light_Model/73V_Var3.gltf", "Bocci/73_Light_Model/73_Var1_clear.gltf", "Bocci/73_Light_Model/73_Var1_grey1.gltf", "Bocci/73_Light_Model/73_Var1_grey2.gltf", "Bocci/73_Light_Model/73_Var1_grey3.gltf", "Bocci/73_Light_Model/73_Var2_clear.gltf", "Bocci/73_Light_Model/73_Var2_grey1.gltf", "Bocci/73_Light_Model/73_Var2_grey2.gltf", "Bocci/73_Light_Model/73_Var2_grey3.gltf", "Bocci/73_Light_Model/73_Var3_clear.gltf", "Bocci/73_Light_Model/73_Var3_grey1.gltf", "Bocci/73_Light_Model/73_Var3_grey2.gltf", "Bocci/73_Light_Model/73_Var3_grey3.gltf", "Bocci/74_Light_Model/74_Var1.gltf", "Bocci/84_2500_3500_Light_Model/84_Var1_2500K.gltf", "Bocci/84_2500_3500_Light_Model/84_Var1_3500K.gltf", "Bocci/87_Light_Model/87_Var1.gltf", "Bocci/87_Light_Model/87_Var2.gltf", "Bocci/87_Light_Model/87_Var3.gltf", "Bocci/87_Light_Model/87_Var4.gltf"]
export const path = 'https://shapediverexternalgeometry.s3.amazonaws.com/';


let viewport: IViewportApi;


(async () => {
    // create a viewport
    viewport = await createViewport({
        canvas: <HTMLCanvasElement>document.getElementById('canvas'),
        id: 'myViewer',
        visibility: VISIBILITY_MODE.MANUAL,
        branding: { backgroundColor: '#35363a' }
    });

    // adjust some of the settings
    viewport.groundPlaneVisibility = false;
    viewport.gridVisibility = false;
    viewport.ambientOcclusion = false;
    viewport.shadows = false;
    viewport.clearColor = '#35363a';

    viewport.environmentMap = ENVIRONMENT_MAP.PHOTO_STUDIO;
    viewport.createLightScene();

    // wait for the environment map to load
    const promises = [];
    promises.push(new Promise<void>((resolve) => {
        addListener(EVENTTYPE.TASK.TASK_END, (e) => {
            const taskEvent = e as ITaskEvent;
            if (taskEvent.type === TASK_TYPE.ENVIRONMENT_MAP_LOADING) resolve();
        });
    }));

    // create the main menu
    const menuDiv = document.getElementById('menu') as HTMLDivElement;
    menuDiv.style.visibility = "hidden";
    createMenu(viewport);

    promises.push(addGLTF(viewport, path + models[0]));

    await Promise.all(promises);

    // once everything is loaded, show it
    viewport.show = true;
    menuDiv.style.visibility = "";
})();