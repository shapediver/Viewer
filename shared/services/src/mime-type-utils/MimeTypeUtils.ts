import { singleton } from "tsyringe";

const extToMimeTypeMapping: {
    [key: string]: string[]
} = {
    svg: ['image/svg+xml'],
    svgz: ['image/svg+xml'],
    jpg: ['image/jpeg'],
    jpeg: ['image/jpeg'],
    png: ['image/png'],
    gif: ['image/gif'],
    bmp: ['image/bmp'],
    tif: ['image/tif'],
    tiff: ['image/tiff'],
    gltf: ['gltf+json', 'model/gltf-binary'],
    glb: ['application/octet-stream', 'model/gltf-binary'],
    bin: ['application/octet-stream', 'application/gltf-buffer'],
    '3dm': ['model/vnd.3dm', 'application/3dm', 'x-world/x-3dmf'],
    '3ds': ['application/x-3ds', 'image/x-3ds', 'application/3ds'],
    fbx: ['application/fbx'],
    dxf: ['application/dxf', 'application/x-autocad', 'application/x-dxf', 'drawing/x-dxf', 'image/vnd.dxf', 'image/x-autocad', 'image/x-dxf', 'zz-application/zz-winassoc-dxf'],
    dwg: ['application/dwg'],
    pdf: ['application/pdf'],
    '3mf': ['model/3mf'],
    stl: ['model/stl', 'application/sla'],
    amf: ['application/amf'],
    ai: ['application/ai'],
    dgn: ['application/dgn'],
    ply: ['application/ply'],
    ps: ['application/postscript'],
    eps: ['application/postscript'],
    skp: ['application/skp'],
    slc: ['application/slc'],
    sldprt: ['application/sldprt'],
    sldasm: ['application/sldasm'],
    stp: ['application/step'],
    step: ['application/step'],
    vda: ['application/vda'],
    gdf: ['application/gdf'],
    vrml: ['model/vrml', 'model/x3d-vrml'],
    wrl: ['model/vrml', 'model/x3d-vrml'],
    vi: ['model/vrml', 'model/x3d-vrml'],
    igs: ['model/iges', 'application/iges'],
    iges: ['model/iges', 'application/iges'],
    obj: ['model/obj', 'application/wavefront-obj'],
    off: ['application/off'],
    txt: ['text/plain'],
    mtl: ['text/plain'],
    g: ['text/plain'],
    gcode: ['text/plain'],
    glsl: ['text/plain'],
    csv: ['text/csv', 'application/vnd.ms-excel'],
    xls: ['application/vnd.ms-excel'],
    xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    xml: ['application/xml', 'text/xml'],
    json: ['application/json'],
    ifc: ['application/x-step'],
    ifcxml: ['application/xml'],
    ifczip: ['application/zip'],
    sdtf: ['model/vnd.sdtf'],
    sddtf: ['model/vnd.sdtf'],
};

@singleton()
export class MimeTypeUtils {
    // #region Public Methods (2)

    /**
     * Try to guess mime types from a file name
     * @param {string} filename
     * @return {string[]} guessed mime type, empty array in case none could be guessed
     */
    public guessMimeTypeFromFilename(filename: string): string[] {
        const parts = filename.split('.');

        if (!(parts.length > 0)) return [];

        const extension = parts[parts.length - 1];
        const supportedExtensions = Object.keys(extToMimeTypeMapping);

        if (!supportedExtensions.includes(extension)) return [];

        return extToMimeTypeMapping[(extension as keyof typeof extToMimeTypeMapping)];
    }

    /**
     * Returns the corresponding file endings for each mime type.
     * @param {string[]} mimeTypes
     * @return {string[]}
     */
    public mapMimeTypeToFileEndings(mimeTypes: string[]): string[] {
        const fileEndings = [];
        for (let i = 0; i < mimeTypes.length; i++) {
            const fileEnding = Object.keys(extToMimeTypeMapping).find(key => extToMimeTypeMapping[key].includes(mimeTypes[i]));
            if (fileEnding) fileEndings.push('.' + fileEnding)
        }
        return fileEndings;
    }

    // #endregion Public Methods (2)
}