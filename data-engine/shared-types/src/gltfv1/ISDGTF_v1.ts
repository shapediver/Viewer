export interface ISDGTF_v1_Accessor {
    byteOffset: number,
    componentType: number,
    count: number,
    type: string
}

export interface ISDGTF_v1_Attributes {
    attributes: {
        [key: string]: string
    }
}

export interface ISDGTF_v1_Beziercurves extends ISDGTF_v1_Attributes {
    degree: number
}

export interface ISDGTF_v1_Surfacepatch extends ISDGTF_v1_Attributes {
    controlPointCountU: number,
    controlPointCountV: number,
    degreeU: number,
    degreeV: number,
}

export interface ISDGTF_v1 {
    accessors?: { [key: string]: ISDGTF_v1_Accessor },
    arcs?: ISDGTF_v1_Attributes,
    asset: {
        generator: string,
        profile: {
            api: string,
            version: string
        },
        version: number
    },
    beziercurves?: { [key: string]: ISDGTF_v1_Beziercurves },
    circles?: ISDGTF_v1_Attributes,
    cylinders?: ISDGTF_v1_Attributes,
    polylines?: { [key: string]: ISDGTF_v1_Attributes },
    spheres?: ISDGTF_v1_Attributes,
    surfacepatches?: { [key: string]: ISDGTF_v1_Surfacepatch },
    points?: { [key: string]: ISDGTF_v1_Attributes },
}