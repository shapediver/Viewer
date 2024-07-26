import * as SDV from '@shapediver/viewer';
import { Gumball } from '@shapediver/viewer.features.gumball';
import { createCustomUi, IBooleanElement, IDropdownElement } from '@shapediver/viewer.shared.demo-helper';

(<any>window).SDV = SDV;

(async () => {
    const viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas')
    });
    const session = await SDV.createSession({
        id: 'mySession',
        ticket: '50eb2a26ddaa432ca18288b8a120ef194fa35bb813e4f43ae89d657991a865f9deaa20a1c840e47cdf6dbc019cd16ae15a9a6b3a7d91722455299d6bd29b1f26b3ff3b7adaac1df3d50f3ba4d010a560180dff8f745c946dadb41167a3431e223d69b32743f167-5b9465f92a0cf9c235b8ea315aab0cd5',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com'
    });

        
    // As the gizmo currently does not work with the post processing effects, we remove them here
    Object.keys(viewport.postProcessing.getEffectTokens()).forEach((token) => {
        viewport.postProcessing.removeEffect(token);
    });
    
    const gumball = new Gumball(viewport, session.getOutputByName("Shelf")[0].node!);

    const menuDiv = document.createElement('div');
    menuDiv.id = 'menu';
    menuDiv.style.position = 'absolute';
    menuDiv.style.top = '1rem';
    menuDiv.style.left = '1rem';
    menuDiv.style.zIndex = '100';
    document.body.appendChild(menuDiv);

    const spaces: ('local' | 'world')[] = ['local', 'world'];
    createCustomUi([
        <IDropdownElement> {
            name: 'space',
            type: 'dropdown',
            value: spaces.indexOf(gumball.space),
            choices: spaces,
            onInputCallback: (value: number) => {
                gumball.space = spaces[value];
            }
        },
        <IBooleanElement>{
            name: 'enableTranslation',
            type: 'boolean',
            value: gumball.enableTranslation,
            onInputCallback: (value: boolean) => {
                gumball.enableTranslation = value;
            }
        },
        <IBooleanElement>{
            name: 'enableRotation',
            type: 'boolean',
            value: gumball.enableRotation,
            onInputCallback: (value: boolean) => {
                gumball.enableRotation = value;
            }
        },
        <IBooleanElement>{
            name: 'enableScaling',
            type: 'boolean',
            value: gumball.enableScaling,
            onInputCallback: (value: boolean) => {
                gumball.enableScaling = value;
            }
        },

    ], menuDiv);
})();
