export const extensionToMimeTypeMapping: {
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
    hdr: ['image/vnd.radiance'],
    zip: ['application/zip', 'application/x-zip-compressed']
};

/**
 * Given a file name, extract the file extension. 
 * @param fileName 
 * @returns 
 */
export const getFileExtension = (fileName: string) => {
    const match = fileName.match(/\.([0-9a-z]+)$/i);

    return (match && match[1]) ? match[1].toLowerCase() : undefined;
};

/**
 * Guess the mime type of a file by its extension.
 * @param fileName 
 * @returns 
 */
export const guessMimeTypeByExt = (fileName: string) => {
    return guessMimeTypeFromFilename(fileName)[0];
};

/**
 * In case a file is missing a mime type, try to guess it from the file name.
 * @param file 
 * @returns 
 */
export const guessMissingMimeType = (file: File | string): File | string => {
    if (typeof (file) === 'string') {
        return file;
    }
    if (file.type) {
        return file;
    }

    return new File([file], file.name, { type: guessMimeTypeByExt(file.name) });
};

/**
 * Download a blob and use the specified filename.
 *
 * @param blob
 * @param filename
 */
export const downloadBlobFile = (blob: Blob, filename: string) => {
    const modelFile = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = modelFile;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
};

/**
 * Download a blob and use the specified filename with the save as dialog.
 * @param blob 
 * @param filename 
 * @returns 
 */
export const downloadBlobFileSaveAs = async (blob: Blob, filename: string) => {
    const isSupported = window && 'showSaveFilePicker' in window;

    if (!isSupported) return downloadBlobFile(blob, filename);

    const extension = getFileExtension(filename);

    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [
                {
                    accept: { 'multipart/form-data': [`.${extension}`] },
                },
            ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        return handle;

    } catch (err: any) {
        if (err.code === 20) return; // Dialog closed

        if (err.code === 18) { // User interaction time expired
            return downloadBlobFile(blob, filename);
        }

        throw err;
    }
};

/**
 * Fetch and save a file. Optionally, a Response object resulting from a previous fetch call
 * can be provided instead of a URL. 
 *
 * @param urlOrResponse URL to fetch from, or a Response object resulting from a previous fetch call.
 * @param filename
 * @param token If provided a token, use that token in the Authorization header of the fetch request.
 */
export const fetchFileWithToken = async (urlOrResponse: string | Response, filename: string, token: string | null = null, finallyCb = () => { }, isSaveAs = false) => {
    return (typeof urlOrResponse === 'string' ? fetch(urlOrResponse, {
        ...(token ? { headers: { Authorization: token } } : {}),
    }) : Promise.resolve(urlOrResponse))
        .then((res) => res.blob())
        .then((blob) => {
            isSaveAs ? downloadBlobFileSaveAs(blob, filename) : downloadBlobFile(blob, filename);
        }).catch((err) => {
            throw new Error(err.message);
        })
        .finally(() => {
            finallyCb();
        });
};

/**
 * Try to guess mime types from a file name
 * @param {string} filename
 * @return {string[]} guessed mime type, empty array in case none could be guessed
 */
export const guessMimeTypeFromFilename = (filename: string): string[] => {
    const parts = filename.toLowerCase().split('.');

    if (!(parts.length > 0)) return [];

    const extension = parts[parts.length - 1];
    const supportedExtensions = Object.keys(extensionToMimeTypeMapping);

    if (!supportedExtensions.includes(extension)) return [];

    return extensionToMimeTypeMapping[(extension as keyof typeof extensionToMimeTypeMapping)];
};

/**
 * Returns the corresponding file endings for each mime type.
 * @param {string[]} mimeTypes
 * @return {string[]}
 */
export const mapMimeTypeToFileEndings = (mimeTypes: string[]): string[] => {
    const fileEndings = [];
    const types = mimeTypes.map(type => type.toLowerCase());
    for (let i = 0; i < types.length; i++) {
        const fileEnding = Object.keys(extensionToMimeTypeMapping).find(key => extensionToMimeTypeMapping[key].includes(types[i]));
        if (fileEnding) fileEndings.push('.' + fileEnding);
    }
    return fileEndings;
};

/**
 * Returns an extended array of mime types.
 * The provided mime types are are mapped to file endings and the corresponding mime types are added.
 * The types are filtered to only contain unique values.
 * 
 * @param {string[]} mimeTypes
 * @return {string[]}
 */
export const extendMimeTypes = (mimeTypes: string[]): string[] => {
    let types = mimeTypes.map(type => type.toLowerCase());
    // get all endings that are possible for this type
    const endings = mapMimeTypeToFileEndings(types);
    // get all mimeTypes that are possible for these endings
    endings.forEach((e: string) => types = types.concat(guessMimeTypeFromFilename(e)));

    types = types.filter(function (item, pos) {
        return types.indexOf(item) == pos;
    });
    return types;
};