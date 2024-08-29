import * as SDV from '@shapediver/viewer';
import { addListener } from '@shapediver/viewer';
import { Gumball } from '@shapediver/viewer.features.gumball';
import { InteractionData, InteractionEngine, MultiSelectManager, InteractionEventResponseMapping, HoverManager, IMultiSelectEvent } from '@shapediver/viewer.features.interaction';
import { createCustomUi, IBooleanElement } from '@shapediver/viewer.shared.demo-helper';

(<any>window).SDV = SDV;

(async () => {
    const viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    });
    const session = await SDV.createSession({
        id: 'mySession',
        ticket: '15c0551e793c59b3b558655913c0f33efce8ea2effc58b6f6907a063e8c6bb77502f6e72db0408855ac0acb68e4b92a0490cf845bf782d357247a6d5b4604f01880bcf95c43f15c6c0789aa2e8bef59d6df321aac7292c3891e945e4101fbec6f584ef03c17442-710443a1a5148421098322a671d18b37',
        modelViewUrl: 'https://sddev3.eu-central-1.shapediver.com'
    });

    const doorsOutput = session.getOutputByName('Boxes')[0];
    doorsOutput.node!.getNodesByNameWithRegex(new RegExp(/^box_/)).forEach(door => {
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
            createCustomUi([
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
