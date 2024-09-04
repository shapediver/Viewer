import * as SDV from '@shapediver/viewer';
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


    session.createModelState({}, () => viewport.getScreenshot(), undefined, () => viewport.convertToGlTF());
})();
