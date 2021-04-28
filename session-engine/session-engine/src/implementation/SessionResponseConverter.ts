import { ShapeDiverResponseBase as ShapeDiverResponse } from "@shapediver/api.geometry-api-dto-v1"

export const mergeResponses = (r1: ShapeDiverResponse, r2: ShapeDiverResponse, ): ShapeDiverResponse => {
    if(!r1)
        r1 = { version: r2.version };

    // convert version
    if (r2.version)
        r1.version = r2.version;

    // convert version
    if (r2.collection)
        r1.collection = r2.collection;

    // merge actions
    if (r2.actions) {
        for (let i = 0, len = r2.actions.length; i < len; i++) {
            r1.actions = r1.actions || [];
            if (r1.actions.findIndex((value) => value.name === r2.actions![i].name) === -1)
                r1.actions.push(r2.actions[i])
        }
    }

    // merge templates
    if (r2.templates) {
        for (let i = 0, len = r2.templates.length; i < len; i++) {
            r1.templates = r1.templates || [];
            if (r1.templates.findIndex((value) => value.name === r2.actions![i].name) === -1)
                r1.templates.push(r2.templates[i])
        }
    }

    // convert config
    if (r2.config && !r1.config)
        r1.config = r2.config;

    // convert name
    if (r2.name && !r1.name)
        r1.name = r2.name;

    // convert parameters
    if (r2.parameters) {
        for (let parameterId in r2.parameters) {
            r1.parameters = r1.parameters || {};
            r1.parameters[parameterId] = r2.parameters[parameterId];
        }
    }

    // convert outputs
    if (r2.outputs) {
        for (let outputId in r2.outputs) {
            r1.outputs = r1.outputs || {};
            r1.outputs[outputId] = r2.outputs[outputId];
            if ('version' in r2.outputs[outputId] || !('version' in r1.outputs[outputId]))
                r1.outputs[outputId] = r2.outputs[outputId];
        }
    }

    // convert exports
    if (r2.exports) {
        for (let exportId in r2.exports) {
            r1.exports = r1.exports || {};
            if ('version' in r2.exports[exportId] || !('version' in r1.exports[exportId]))
                r1.exports[exportId] = r2.exports[exportId];
        }
    }

    return r1;
}