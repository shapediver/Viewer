export interface IParameter {
  name: string; //name of the parameter
  value: string | number; //value to be set to the parameter
}

export interface IOutput {
  name: string; //this can be the name of an export or a GLTF display output
  parameters?: IParameter[]; // list of parameter names and values that need to be set before requesting the output. After the output is done, the parameters need to go one step backwards to the original values
}

export interface IOptionsGroup {
  step: number; //step number to which this group of options should be added. For example, 0 means the step where the boat is imported.
  title: string; //title of the group of parameters
  icon: string; //URL with an image which is the icon to be shown in the group
  inputsGroup?: string; //optional GH group name. If this is provided, all of the parameters inside the defined grup must be shown
  inputs?: string[]; //optional list of specific parameter names to be shown
  outputs?: IOutput[]; //optional list of specific exports or GTLF display outputs to be shown.
}

export type UILayout = IOptionsGroup[]; //this will be output from the GH model in the output named "uiLayout"

export interface IBoat {
  title: string; //name of the boat to be shown as an option in the user interface.
  geometry?: string; //URL with the OBJ file that has the detailed model. If this is not provided, the simpleGeometry attribute must be used. When the user selects a specific boat title, this URL must be used to create a Blob and send to the parameter "importHull". Geometry URL is just used in the last step, all other steps must used the simpleGeometry attribute.
  simpleGeometry?: string; //URL with the OBJ file that has the simple model. If this is not provided, the geometry attribute must be used. When the user selects a specific boat title, this URL must be used to create a Blob and send to the parameter "importHull". SimpleGeometry URL is used in all steps except the last one.
  texture?: string; //URL with the texture to be applied to the boat. If this is not provided, no texture is added to the boat. This must not be used when the simpleGeometry is being shown. When the user selects a specific boat title, this URL must be used to create a Blob and send to the parameter "importHullTexture".
}

export type BoatsOptions = IBoat[]; //this will be output from the GH model in the output named "boatsOptions"
