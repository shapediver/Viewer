

import { api, CAMERA_TYPE, ENVIRONMENT_MAP, EVENTTYPE, EXPORTTYPE, LIGHT_TYPE, LOGGING_LEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETER_TYPE, PARAMETER_VISUALIZATION, RENDERER_TYPE, VISIBILITY_MODE } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'

(<any>window).SDV = SDV;


const getParameterByName = (name: string, url = window.location.href) => {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
const fileIn = getParameterByName('file');

(<any>window).loadAR = async () => {
    (<any>window).file = fileIn;
    await api.viewInAR();
}