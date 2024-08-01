import * as SDV from '@shapediver/viewer';
import { addListener } from '@shapediver/viewer';
import { Gumball } from '@shapediver/viewer.features.gumball';
import { InteractionData, InteractionEngine, MultiSelectManager, InteractionEventResponseMapping, HoverManager, IMultiSelectEvent } from '@shapediver/viewer.features.interaction';
import { createCustomUi, IBooleanElement, IDropdownElement } from '@shapediver/viewer.shared.demo-helper';

(<any>window).SDV = SDV;

(async () => {
    const viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    });
    const session = await SDV.createSession({
        id: 'mySession',
        ticket: '3bd25bd6c28eb03a40868ff726a574fc7b53e02734af17066ac917c59cc1e55fcbab57acd8b9ff1e3ecfc3f64ae43f4787648b2c6951fc2c63df9164d4161954f2838906f0abd854d4cb778ce70b3914f6f9bb8e6da0969a23f90363f43aa2329fd93d9cf850db-0c977a4c28f85600ea079045f25c1182',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com'
    });

    const doorsOutput = session.getOutputByName('Doors')[0];
    doorsOutput.node!.getNodesByNameWithRegex(new RegExp(/^Door_/)).forEach(door => {
        door.addData(new InteractionData({ hover: true, select: true }));
        door.updateVersion();
    });

    const interactionEngine = new InteractionEngine(viewport);

    const multiSelectManager = new MultiSelectManager();
    multiSelectManager.useModifierKeys = true;
    multiSelectManager.effectMaterial = new SDV.MaterialStandardData({ color: 'red' });
    interactionEngine.addInteractionManager(multiSelectManager);

    const hoverManager = new HoverManager();
    hoverManager.effectMaterial = new SDV.MaterialStandardData({ color: 'blue' });
    interactionEngine.addInteractionManager(hoverManager);



    const menuDiv = document.createElement('div');
    menuDiv.id = 'menu';
    menuDiv.style.position = 'absolute';
    menuDiv.style.top = '1rem';
    menuDiv.style.left = '1rem';
    menuDiv.style.zIndex = '100';
    document.body.appendChild(menuDiv);

    let gumball: Gumball | undefined;

    const eventListenerCallback = (e: IMultiSelectEvent) => {
        console.log('MultiSelectEvent', e.nodes);
        if (gumball) {
            gumball.close();

            while (menuDiv.firstChild)
                menuDiv.removeChild(menuDiv.firstChild);
        }

        if (e.nodes.length > 0) {
            console.log('Create Gumball');

            gumball = new Gumball(viewport, e.nodes);

            const spaces: ('local' | 'world')[] = ['local', 'world'];
            createCustomUi([
                <IDropdownElement>{
                    name: 'space',
                    type: 'dropdown',
                    value: spaces.indexOf(gumball.space),
                    choices: spaces,
                    onInputCallback: (value: number) => {
                        gumball!.space = spaces[value];
                    }
                },
                <IBooleanElement>{
                    name: 'enableTranslation',
                    type: 'boolean',
                    value: gumball.enableTranslation,
                    onInputCallback: (value: boolean) => {
                        gumball!.enableTranslation = value;
                    }
                },
                <IBooleanElement>{
                    name: 'enableRotation',
                    type: 'boolean',
                    value: gumball.enableRotation,
                    onInputCallback: (value: boolean) => {
                        gumball!.enableRotation = value;
                    }
                },
                <IBooleanElement>{
                    name: 'enableScaling',
                    type: 'boolean',
                    value: gumball.enableScaling,
                    onInputCallback: (value: boolean) => {
                        gumball!.enableScaling = value;
                    }
                },
            ], menuDiv);
        }
    };

    addListener(SDV.EVENTTYPE_INTERACTION.MULTI_SELECT_ON, (e) => {
        const multiSelectEvent = e as InteractionEventResponseMapping[SDV.EVENTTYPE_INTERACTION.MULTI_SELECT_ON];
        eventListenerCallback(multiSelectEvent);
    });
    addListener(SDV.EVENTTYPE_INTERACTION.MULTI_SELECT_OFF, (e) => {
        const multiSelectEvent = e as InteractionEventResponseMapping[SDV.EVENTTYPE_INTERACTION.MULTI_SELECT_OFF];
        eventListenerCallback(multiSelectEvent);
    });
})();
