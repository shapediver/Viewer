export enum CONTENT_TYPE {
  IMAGE_JPEG = 'image/jpeg',
  IMAGE_PNG = 'image/png',
  IMAGE_TIF = 'image/tif',
  IMAGE_GIF = 'image/gif',
  IMAGE_BMP = 'image/bmp',
  MODEL_VND_3DM = 'model/vnd.3dm',
}

export enum CONTENT_ENCODING {
  GZIP = 'gzip',
  COMPRESS = 'compress',
  DEFLATE = 'deflate',
  IDENTITY = 'identity',
  BR = 'br'
}

export enum PRIMITIVE_TYPEHINT {
  DOUBLE = 'double',
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

// TODO
export enum RHINO_TYPEHINT {
  TEMP = 'temp'
}