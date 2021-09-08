import 'reflect-metadata'

import { api, CAMERATYPE, ENVIRONMENTMAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
import { mat4, vec3 } from 'gl-matrix';

(<any>window).RENDERERTYPE = RENDERERTYPE;
(<any>window).CAMERATYPE = CAMERATYPE;
(<any>window).ORTHOGRAPHIC_CAMERA_DIRECTION = ORTHOGRAPHIC_CAMERA_DIRECTION;
(<any>window).LIGHTTYPE = LIGHTTYPE;
(<any>window).VISIBILITYMODE = VISIBILITYMODE;
(<any>window).LOGGINGLEVEL = LOGGINGLEVEL;
(<any>window).EVENTTYPE = EVENTTYPE;
(<any>window).EXPORTTYPE = EXPORTTYPE;
(<any>window).PARAMETERTYPE = PARAMETERTYPE;
(<any>window).PARAMETERVISUALIZATION = PARAMETERVISUALIZATION;
(<any>window).ENVIRONMENTMAP = ENVIRONMENTMAP;

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;


const part1 = <HTMLDivElement>document.getElementById('part1');
const part2 = <HTMLDivElement>document.getElementById('part2');

const bbText = <HTMLParagraphElement>document.getElementById('bb');
const slider = <HTMLInputElement>document.getElementById('scale');
const min = <HTMLInputElement>document.getElementById('min');
const max = <HTMLInputElement>document.getElementById('max');
const value = <HTMLInputElement>document.getElementById('value');
min.value = slider.min;
max.value = slider.max;
slider.step = slider.min;
slider.value = '1';
value.value = slider.value;

const submit = <HTMLButtonElement>document.getElementById('submit');
const ticket = <HTMLInputElement>document.getElementById('ticket');

submit.onclick = async () => {
    part2.style.visibility = 'hidden'
    api.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, (e) => {
        if(e && (<any>e).boundingBox) {
            const min = vec3.clone((<any>e).boundingBox.min)
            const max = vec3.clone((<any>e).boundingBox.max)
            const size = vec3.fromValues(max[0]-min[0], max[1]-min[1], max[2]-min[2]);
            bbText.textContent = `${Math.round(size[0] * 100) / 100} x ${Math.round(size[1] * 100) / 100} x ${Math.round(size[2] * 100) / 100}`;
        }
    })


    const ticketInput = ticket.value;
    let viewer = await api.createAndInitializeViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    part1.style.visibility = 'visible'
    let session = await api.createAndInitializeSession({ ticket: ticketInput, modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com', id: 'mySession'});

    slider.onchange = () => {
        value.value = slider.value;
        (<any>window).changeScale(+value.value);
    }

    value.onchange = () => {
        slider.value = value.value;
        (<any>window).changeScale(+value.value);
    }

    max.onchange = () => {
        if(slider.value > max.value) {
            slider.value = max.value;
            value.value = max.value;
            (<any>window).changeScale(+value.value);
        }
        slider.max = max.value;
    }
    min.onchange = () => {
        if(slider.value < min.value) {
            slider.value = min.value;
            value.value = min.value;
            (<any>window).changeScale(+value.value);
        }
        slider.min = min.value;
        slider.step = min.value;
    }
}

(<any>window).changeScale = (scale: number) => {
    api.sessions['mySession'].node.transformations = [];
    api.sessions['mySession'].node.transformations.push({
        id: 'scale',
        matrix: mat4.fromValues(scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, 1)
    })   
    api.sessions['mySession'].node.updateVersion(); 
    api.update();
    api.viewers['myViewer'].camera?.zoomTo()
}

(<any>window).loadAR = async () => {
    api.viewers['myViewer'].blur = true;
    await api.viewInAR();
    api.viewers['myViewer'].blur = false;
}