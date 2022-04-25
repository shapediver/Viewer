

import { api, CAMERATYPE, ENVIRONMENT_MAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE } from '@shapediver/viewer'
import * as SDV from '@shapediver/viewer'
import { mat4 } from 'gl-matrix';

(<any>window).SDV = SDV;

(async () => {
    let viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    let session = await api.createSession({
        ticket: "763b55012bb599a42885c5eefbc8bb7292f1f211175b12debf16df90f308f5f8475fea13ba834f90ca370409c3e6cb3f528171825b73c259fc094b8c07cc94efd06e602cba841f315d721567af2ab6bb98880fbf57bb14da292f527da2ebf0ba6af8d772e90fb6-db87ccc766ade2163dbe3d5f66ea55a1",
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com',
        id: 'mySession',
    });


    const globalDiv = <HTMLDivElement>document.getElementById("session");

    // get all parameters and sort them
    const parameters = Object.values(session.parameters);
    parameters.sort((a, b) => (a.order || Infinity) - (b.order || Infinity));
    for (let i = 0, il = parameters.length; i < il; i++) {
        // get the parameter and assign the properties
        const parameterObject = parameters[i];

        const paramDiv = document.createElement("div");
        const label = document.createElement("label");
        label.setAttribute("for", parameterObject.id);
        label.innerHTML = parameterObject.name;

        // for the different types of the parameter, we need different inputs, or at least different options for inputs

        let parameterInputElement:
            | HTMLInputElement
            | HTMLSelectElement
            | null = null;
        if (
            parameterObject.type === SDV.PARAMETERTYPE.INT ||
            parameterObject.type === SDV.PARAMETERTYPE.FLOAT ||
            parameterObject.type === SDV.PARAMETERTYPE.EVEN ||
            parameterObject.type === SDV.PARAMETERTYPE.ODD
        ) {
            parameterInputElement = document.createElement("input");
            parameterInputElement.setAttribute("id", parameterObject.id);
            parameterInputElement.setAttribute("type", "range");
            parameterInputElement.setAttribute("min", parameterObject.min + "");
            parameterInputElement.setAttribute("max", parameterObject.max + "");
            parameterInputElement.setAttribute("value", parameterObject.value);

            if (parameterObject.type === SDV.PARAMETERTYPE.INT)
                parameterInputElement.setAttribute("step", "1");
            else if (
                parameterObject.type === SDV.PARAMETERTYPE.EVEN ||
                parameterObject.type === SDV.PARAMETERTYPE.ODD
            )
                parameterInputElement.setAttribute("step", "2");
            else
                parameterInputElement.setAttribute(
                    "step",
                    1 / Math.pow(10, parameterObject.decimalplaces!) + ""
                );
        } else if (parameterObject.type === SDV.PARAMETERTYPE.BOOL) {
            parameterInputElement = document.createElement("input");
            parameterInputElement.setAttribute("id", parameterObject.id);
            parameterInputElement.setAttribute("type", "checkbox");
            parameterInputElement.setAttribute("checked", parameterObject.value);
        } else if (parameterObject.type === SDV.PARAMETERTYPE.STRING) {
            parameterInputElement = document.createElement("input");
            parameterInputElement.setAttribute("id", parameterObject.id);
            parameterInputElement.setAttribute("type", "text");
            parameterInputElement.setAttribute("value", parameterObject.value);
        } else if (parameterObject.type === SDV.PARAMETERTYPE.COLOR) {
            parameterInputElement = document.createElement("input");
            parameterInputElement.setAttribute("id", parameterObject.id);
            parameterInputElement.setAttribute("type", "color");
            parameterInputElement.setAttribute("value", parameterObject.value);
        } else if (parameterObject.type === SDV.PARAMETERTYPE.STRINGLIST) {
            parameterInputElement = document.createElement("select");
            parameterInputElement.setAttribute("id", parameterObject.id);
            for (let j = 0; j < parameterObject.choices!.length; j++) {
                let option = document.createElement("option");
                option.setAttribute("value", j + "");
                option.setAttribute("name", parameterObject.choices![j]);
                option.innerHTML = parameterObject.choices![j];
                if (parameterObject.value === j) option.setAttribute("selected", "");
                parameterInputElement.appendChild(option);
            }
        }

        if (parameterInputElement) {
            parameterInputElement.onchange = async () => {
                parameterObject.value = parameterInputElement!.value;
                await session.customize();
            };

            if (parameterObject.hidden) paramDiv.setAttribute("hidden", "");
            paramDiv.appendChild(label);
            paramDiv.appendChild(parameterInputElement);
            globalDiv.appendChild(paramDiv);
        }
    }

    // get all exports and sort them
    const exports = Object.values(session.exports);
    exports.sort((a, b) => (a.order || Infinity) - (b.order || Infinity));
    for (let i = 0; i < exports.length; i++) {
        // get the export and assign the properties
        const exportObject = exports[i];
        const exportDiv = document.createElement("div");
        const exportInputElement = document.createElement("input");

        exportInputElement.setAttribute("id", exportObject.id);
        exportInputElement.setAttribute("type", "button");
        exportInputElement.setAttribute("name", exportObject.name);
        exportInputElement.setAttribute("value", exportObject.name);

        exportInputElement.onclick = async () => {
            const response = await exportObject.request();
            console.log(response);
            if (
                response &&
                response.content &&
                response.content[0] &&
                response.content[0].href
            )
                console.log(response.content[0].href);
        };

        exportDiv.appendChild(exportInputElement);
        globalDiv.appendChild(exportDiv);
    }
})();