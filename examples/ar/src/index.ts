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

const infoText = <HTMLParagraphElement>document.getElementById('info');
const bbText = <HTMLParagraphElement>document.getElementById('bb');
const autoScaling = <HTMLInputElement>document.getElementById('autoScaling');
const autoScalingSlider = <HTMLSpanElement>document.getElementById('slider');
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
const s = <HTMLInputElement>document.getElementById('s');

infoText.textContent += '\n2021-09-09T10:08:22.322Z';// + new Date().toISOString();

const scalingGroup = <HTMLDivElement>document.getElementById('scalingGroup');

scalingGroup.style.display = 'none';

let bbSize = vec3.create();

autoScalingSlider.style.background = '#2196F3';
let autoScalingState = true;
api.autoScaling = true;
autoScaling.onchange = () => {
    console.log(autoScaling)
    autoScalingState = !autoScalingState;
    api.autoScaling = autoScalingState;
    if(autoScalingState) {
        scalingGroup.style.display = 'none';
    	autoScalingSlider.style.background = '#2196F3';
        const maxDimension = Math.max(bbSize[0], Math.max(bbSize[1], bbSize[2]));
        const scalingFactor = 1.0 / maxDimension;
        bbText.textContent = `${Math.round(bbSize[0] * scalingFactor * 100) / 100} x ${Math.round(bbSize[1] * scalingFactor * 100) / 100} x ${Math.round(bbSize[2] * scalingFactor * 100) / 100}`;
    } else {
        scalingGroup.style.display = 'initial';
        autoScalingSlider.style.background = '#ccc';
        bbText.textContent = `${Math.round(bbSize[0] * +value.value * 100) / 100} x ${Math.round(bbSize[1] * +value.value * 100) / 100} x ${Math.round(bbSize[2] * +value.value * 100) / 100}`;
    }
}

submit.onclick = async () => {
    part2.style.visibility = 'hidden'
    api.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, (e) => {
        if(e && (<any>e).boundingBox) {
            const min = vec3.clone((<any>e).boundingBox.min)
            const max = vec3.clone((<any>e).boundingBox.max)
            const size = vec3.fromValues(max[0]-min[0], max[1]-min[1], max[2]-min[2]);
            bbSize = size;
            if(autoScalingState) {
                const maxDimension = Math.max(bbSize[0], Math.max(bbSize[1], bbSize[2]));
                const scalingFactor = 1.0 / maxDimension;
                bbText.textContent = `${Math.round(bbSize[0] * scalingFactor * 100) / 100} x ${Math.round(bbSize[1] * scalingFactor * 100) / 100} x ${Math.round(bbSize[2] * scalingFactor * 100) / 100}`;
            } else {
                bbText.textContent = `${Math.round(size[0] * +value.value * 100) / 100} x ${Math.round(size[1] * +value.value * 100) / 100} x ${Math.round(size[2] * +value.value * 100) / 100}`;
            }
        }
    })

    const ticketInput = ticket.value;
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    part1.style.visibility = 'visible'
    let session = await api.createSession({ ticket: ticketInput, modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com', id: 'mySession'});


    api.enableAR = true;

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

    s.onchange = () => {
        session.parameters['d5fa299b-d1f8-481e-b095-77ebd4c19e1e'].value = s.value;
        session.customize()
    }
}

(<any>window).changeScale = (scale: number) => {
    api.globalScale = vec3.fromValues(scale, scale, scale);
    if(autoScalingState) {
        const maxDimension = Math.max(bbSize[0], Math.max(bbSize[1], bbSize[2]));
        const scalingFactor = 1.0 / maxDimension;
        bbText.textContent = `${Math.round(bbSize[0] * scalingFactor * 100) / 100} x ${Math.round(bbSize[1] * scalingFactor * 100) / 100} x ${Math.round(bbSize[2] * scalingFactor * 100) / 100}`;
    } else {
        bbText.textContent = `${Math.round(bbSize[0] * +value.value * 100) / 100} x ${Math.round(bbSize[1] * +value.value * 100) / 100} x ${Math.round(bbSize[2] * +value.value * 100) / 100}`;
    }
}

(<any>window).loadAR = async () => {
    await api.viewInAR();
}