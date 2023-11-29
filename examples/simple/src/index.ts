import * as SDV from '@shapediver/viewer';
import {
    IDropdownElement,
    createCustomUi,
    createUi
} from '@shapediver/viewer.utils.demo-helper';
import {
    assignGemMaterial,
    assignStandardMaterial,
    createGemMaterialMenu,
    createStandardMaterialMenu,
    gemMaterials,
    materials,
    standardMaterials
} from './uiHelper';
import { Converter } from '@shapediver/viewer.shared.services';

(<any>window).SDV = SDV;

(async () => {
    const viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas'),
        branding: {
            spinnerPositioning: SDV.SPINNER_POSITIONING.CENTER
        }
    });
    const session = await SDV.createSession({
        id: 'mySession',
        ticket:
            'e897c17b344c3a8e2543e4bc857e2fe20264d97f85063bb10c29f55807607b2737fdf4c9aa0426592d7b2f015e355becce72f5958302691ebb41ba83d690d6d7d5488585b759b5bd32dcbcc1b97445b1032bd59a55ab8a564191e3bdf73423e656b66f6cbd1836-177e73da6b276c3abc4b0edc42b40c78',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com'
    });

    // First, we find the output. This can be done via name, id or format.
    const materialOutputs = session
        .getOutputByName('materials')
        .find((o) => !o.format.includes('material'))!;

    // We assign an update callback. This is executed whenever the node is internally adapted.
    materialOutputs.updateCallback = () => {
        materialOutputs.node?.traverse((n) => {
            if (Object.keys(standardMaterials).includes(n.name))
                standardMaterials[n.name].node = n;
            if (Object.keys(gemMaterials).includes(n.name))
                gemMaterials[n.name].node = n;
        });

        for (const name in gemMaterials) {
            // we assign the material to the node
            assignGemMaterial(viewport, gemMaterials[name].node!);
            // and update to see the changes
            gemMaterials[name].node?.updateVersion();
            viewport.update();
        }

        for (const name in standardMaterials) {
            // we assign the material to the node
            assignStandardMaterial(viewport, standardMaterials[name].node!);
            // and update to see the changes
            standardMaterials[name].node?.updateVersion();
            viewport.update();
        }
    };

    // we call this update callback once, to see our applied changes
    materialOutputs.updateCallback();

    for (const name in materials) {
        if (Object.keys(gemMaterials).includes(name)) {
            createGemMaterialMenu(viewport, materials[name].div, name);
        } else {
            createStandardMaterialMenu(viewport, materials[name].div, name);
        }
    }

    const subMenuDiv = document.createElement('div');

    createCustomUi(
        [
            <IDropdownElement>{
                name: 'materials',
                onChangeCallback: (value: any) => {
                    while (subMenuDiv.firstChild)
                        subMenuDiv.removeChild(subMenuDiv.firstChild);
                    subMenuDiv.appendChild(Object.values(materials)[value].div);
                },
                type: 'dropdown',
                choices: Object.keys(materials),
                value: -1
            }
        ],
        document.getElementById('menu_left') as HTMLDivElement
    );
    document.getElementById('menu_left')?.appendChild(subMenuDiv);

    // create the UI
    createUi(session as any, document.getElementById('menu_right') as HTMLDivElement);

    await new Promise(resolve => setTimeout(resolve, 2500));
    session.getParameterByName("Gallery Rail Style")[0].value = "2";
    session.getParameterByName("Secret Stone")[0].value = "2";
    session.getParameterByName("His and Hers Secret Stones")[0].value = true;
    await session.customize();

    console.log(gemMaterials)
    for(let i = 0; i < 12; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        gemMaterials["secretStones_1"].materialSettings.colorTransferBegin = Converter.instance.toHexColor(`hsl(${360*(i/12)}, 100%, 50%)`);
        gemMaterials["secretStones_1"].materialSettings.colorTransferEnd = Converter.instance.toHexColor(`hsl(${360*(i/12)}, 100%, 50%)`);
        assignGemMaterial(viewport, gemMaterials["secretStones_1"].node!)
        viewport.update();
        for(let j = 0; j < 12; j++) {


            await new Promise(resolve => setTimeout(resolve, 1000));

            gemMaterials["secretStones_0"].materialSettings.colorTransferBegin = Converter.instance.toHexColor(`hsl(${360*(j/12)}, 100%, 50%)`);
            gemMaterials["secretStones_0"].materialSettings.colorTransferEnd = Converter.instance.toHexColor(`hsl(${360*(j/12)}, 100%, 50%)`);
            assignGemMaterial(viewport, gemMaterials["secretStones_0"].node!)
            viewport.update();

            
        }
    }
})();
