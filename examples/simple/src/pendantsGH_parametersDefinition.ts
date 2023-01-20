export type Point3d = [number,number,number]; //X, Y, Z coordinates
export type Line = [Point3d, Point3d];

export interface INurbsCurve{
    rational: boolean, 
    order: number,  // Degree of the curve
    pointcount: number,  // Amount of control points of the curve
    knots: number[];
    points: Point3d[],
}

export enum PendantGeometryType {
    NURBSCURVE = "nurbscurve", // This information indicates if the curve is of type NURBS, meaning that is flexible. 
    LINE = "line" // This information indicates if the curve is of a line, meaning that is rigid. 
}

export interface IAddress{
    content: number, //content index is equal to the index of the glTF URL provided in the parameter lamps_GLTF_names
    transformation: number //transformation index applied to the gltf
}

export interface IPendant //this is provided by the "pendantsLayout_JSON" export
{
    type: PendantGeometryType, // Indicates if the curve is a line or a NURBS curve.
    data: INurbsCurve | Line, // Provides the properties of the pendant curve.
    length: number,
    id: string, // Id of the curve.
    address: IAddress
}

export  enum CanopyGeometryType{
    CIRCLE = "circle",
    POLYLINE = "polyline" //polyline in this case refers to the rectangle canopy option
}

export interface ICircle{
    center: Point3d,
    radius: number
}
export type Rectangle = [Point3d, Point3d, Point3d, Point3d, Point3d]; //Points of the corners of the rectangle

export interface ICanopy
{
    type:  CanopyGeometryType, // Indicates if the ccanopy is rectangular or circular.
    data:  ICircle | Rectangle, // Provides the properties of the canopy curve.
    jacksPosition?: Point3d[]  // Array of points that indicate the starting position of the jacks.
}

export enum Aircraft{
    NONE, // No aircraft cable will be processed.
    STRAIGHT, // This option reproduces a neckless shape. The start and end point of the curve is the same.  This option is used in "87.3 series".
    ANGLE // This option computes a straigt angled line. The angle is the reflected vector in between the start and end of the coaxial cable. This option is used in "87 swag series".
}

export interface IPendantsLayout //you can find an example in the file "pendantsLayout.json"
{
    pendants: IPendant[],
    canopy?: ICanopy,
    aircraft: Aircraft 
}

export interface IEndPointsInstruction //you can find an example in the file "endPointsInstructions.json"
{
    id: string, // Id of the curve to rebuild.
    start: Point3d, // New initial point of the curve to rebuild.
    end: Point3d, // New end point of the curvve to rebuild.
}


export interface IFlexibilityInstruction //you can find an example in the file "flexibilityInstructions.json"
{
    id: string, // Id of the curve to rebuild.
    pointsQuantity?: number, // Optional new amount of control points that the curve to rebuild will have. If this value is not provided, the corresponding default value located in the parameters group will be used.
    amplitude?: number, // Optional new amplitude that the curve to rebuild will have. If this value is not provided, the corresponding default value located in the parameters group will be used.
    flexibility?: number, // Optional new flexibility that the curve to rebuild will have. If this value is not provided, the corresponding default value located in the parameters group will be used.
    additionalDisplacementStartLimit?: number, // Optional new additional displacement start limit that the curve to rebuild will have. If this value is not provided, the corresponding default value located in the parameters group will be used.
    additionalDisplacementEndLimit?: number, // Optional new additional displacement end limit that the curve to rebuild will have. If this value is not provided, the corresponding default value located in the parameters group will be used.
    additionalDisplacementSeed?: number, // Optional new additional displacement seed that generates a set of random vectors that the control points of the curve will follow in order to be achieve more complexity. If this value is not provided, the corresponding default value located in the parameters group will be used.
}