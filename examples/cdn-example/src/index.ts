import * as SDV from "@shapediver/viewer"

(async () => {
    const viewer = await <SDV.IViewer>(<any>window).SDV.api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    const session = await <SDV.ISession>(<any>window).SDV.api.createSession({ ticket: '53af6cbde9e2308f1851ffd0895cbd7b13328cf2bddefbe8a93f2faf9949d2bee5185ee07a5de7ba0e918fed48e07386d21157c53f1665c65e66349edd421d6c3340934b4e2a7ee388422ac4e2ad0230825b7d6f01f3b44c83d62582fa329aa6607217c99968e8c4a13d1acb08083076819db788fadf-6a161aeaf69fff37bcf1ba53679be40e', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', id: 'mySession' });

    const globalDiv = document.getElementById("session");

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

        let parameterInputElement: HTMLInputElement | HTMLSelectElement | null = null;
        if (parameterObject.type === SDV.PARAMETERTYPE.INT || parameterObject.type === SDV.PARAMETERTYPE.FLOAT || parameterObject.type === SDV.PARAMETERTYPE.EVEN || parameterObject.type === SDV.PARAMETERTYPE.ODD) {

            parameterInputElement = document.createElement("input");
            parameterInputElement.setAttribute("id", parameterObject.id);
            parameterInputElement.setAttribute("type", "range");
            parameterInputElement.setAttribute("min", parameterObject.min! + '');
            parameterInputElement.setAttribute("max", parameterObject.max! + '');
            parameterInputElement.setAttribute("value", parameterObject.value);

            if (parameterObject.type === SDV.PARAMETERTYPE.INT) parameterInputElement.setAttribute("step", '1');
            else if (parameterObject.type === SDV.PARAMETERTYPE.EVEN || parameterObject.type === SDV.PARAMETERTYPE.ODD) parameterInputElement.setAttribute("step", '2');
            else parameterInputElement.setAttribute("step", 1 / Math.pow(10, parameterObject.decimalplaces!) + '');

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
                option.setAttribute("value", j + '');
                option.setAttribute("name", parameterObject.choices![j]);
                option.innerHTML = parameterObject.choices![j];
                if (parameterObject.value == j) option.setAttribute("selected", "");
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
            globalDiv!.appendChild(paramDiv);
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
            if (response && response.content && response!.content[0] && response!.content[0].href)
                (<any>window).location = response!.content[0].href;
        };
        
        exportDiv.appendChild(exportInputElement);
        globalDiv!.appendChild(exportDiv);
    }

})()