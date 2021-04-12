export enum POSTPROCESSINGTYPE {
    SSAA = 'ssaa',
    SAO = 'sao'
}

export interface IPostProcessingPass {
    type: POSTPROCESSINGTYPE
}