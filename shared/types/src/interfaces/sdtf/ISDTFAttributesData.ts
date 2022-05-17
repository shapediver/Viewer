import { ITreeNodeData } from "../../../../node-tree/dist";

export enum PRIMITIVE_TYPEHINT {
  DOUBLE = 'double',
  COLOR = 'color',
  STRING = 'string',
  BOOL = 'bool',
  FLOAT = 'float',
  DECIMAL = 'decimal',
  CULTUREINFO = 'cultureinfo',
  INT = 'int',
}

export enum GEOMETRY_TYPEHINT {
  COMPLEX = 'geometry.complex',
  INTERVAL2 = 'geometry.interval2',
  PATH = 'grasshopper.path',
  ARC = 'geometry.arc',
  BOUNDINGBOX = 'geometry.boundingbox',
  BOX = 'geometry.box',
  CIRCLE = 'geometry.circle',
  CONE = 'geometry.cone',
  CYLINDER = 'geometry.cylinder',
  ELLIPSE = 'geometry.ellipse',
  INTERVAL = 'geometry.interval',
  LINE = 'geometry.line',
  MATRIX = 'geometry.matrix',
  PLANE = 'geometry.plane',
  POINT2D = 'geometry.point2d',
  POINT2F = 'geometry.point2f',
  POINT3D = 'geometry.point3d',
  POINT3F = 'geometry.point3f',
  POINT4D = 'geometry.point4d',
  POLYLINE = 'geometry.polyline',
  RAY = 'geometry.ray',
  RECTANGLE = 'geometry.rectangle',
  SPHERE = 'geometry.sphere',
  TORUS = 'geometry.torus',
  TRANSFORM = 'geometry.transform',
  VECTOR2D = 'geometry.vector2d',
  VECTOR2F = 'geometry.vector2f',
  VECTOR3D = 'geometry.vector3d',
  VECTOR3F = 'geometry.vector3f',
}

// https://shapediver.atlassian.net/browse/SS-2957
//   export enum RHINOTYPEHINT {
//     TEMP = 'temp'
//   }

export interface ISDTFAttributeData {
  // #region Properties (2)

  readonly typeHint: PRIMITIVE_TYPEHINT | GEOMETRY_TYPEHINT | string;
  readonly value: any;

  // #endregion Properties (2)
}

export interface ISDTFAttributesData extends ITreeNodeData {
  // #region Properties (1)

  readonly attributes: {
    [key: string]: ISDTFAttributeData
  };

  // #endregion Properties (1)

  // #region Public Methods (1)

  clone(): ISDTFAttributesData;

  // #endregion Public Methods (1)
}
