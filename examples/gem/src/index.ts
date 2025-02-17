import * as SDV from '@shapediver/viewer';
(<any>window).SDV = SDV;

(async () => {
    const viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas'),
        visibility: SDV.VISIBILITY_MODE.MANUAL
    });

    const session = await SDV.createSession({
        id: 'mySession',
        ticket:
            '74c3770b576506e6aa742643c7ac1b4882dd9b6a16c2eb0fbd34262161c9968c6738850ab8ecedb0408a2a0b526ddc30082e140675885d1006153399eb794eafbc1087ac14267b8271f21f0858ab6ad0b471d00bf1bc7e01c110c314ec08680e1844330f3ad160-27310430139584a2657b0cdba69714ac',
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
    });

    const settings = SDV.defaultSettings['jewelry'];
    await session.applySettings({ version: '', viewer: { config: settings() } }, {
        viewport: {
            ar: true,
            camera: true,
            environment: true,
            general: true,
            light: true,
            postprocessing: true,
            scene: true
        }
    });

    viewport.environmentMap = SDV.ENVIRONMENT_MAP.JEWELRY_STUDIO;

    await viewport.camera?.zoomTo(undefined, { duration: 0 });

    // we create an update callback that is assigned to the outputs below
    const updateCallback = (newNode?: SDV.ITreeNode) => {
        if (!newNode) return;
        // we assign the material material
        newNode.traverseData((d) => {
            if (d instanceof SDV.GeometryData) {
                if (d.material && d.material.name === 'diamond_material') {
                    (<SDV.GeometryData>d).material = new SDV.MaterialGemData({
                        envMap: SDV.ENVIRONMENT_MAP.GEM_STUDIO,
                        refractionIndex: 2.4,
                        impurityMap: undefined,
                        impurityScale: 0,
                        colorTransferBegin: '#ffffff',
                        colorTransferEnd: '#ffffff',
                        dispersion: 0.0,
                        tracingDepth: 4,
                        tracingOpacity: 1,
                        contrast: 1.35
                    });
                }
            }
        });

        // and update to see the changes
        newNode.updateVersion();
        viewport.update();
    };
    // We assign an update callback. This is executed whenever the node is internally adapted.
    session.updateCallback = updateCallback;
    // we call this update callback once, to see our applied changes
    updateCallback(session.node);

    viewport.show = true;

})();
