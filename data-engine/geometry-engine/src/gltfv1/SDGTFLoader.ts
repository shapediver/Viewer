import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Logger, LOGGING_TOPIC, ShapeDiverViewerDataProcessingError } from '@shapediver/viewer.shared.services'
import {
  ACCESSORCOMPONENTTYPE_V1 as ACCESSOR_COMPONENTTYPE,
  ACCESSORTYPE_V1 as ACCESSORTYPE,
  ISDGTF_v1,
} from '@shapediver/viewer.data-engine.shared-types'
import {
  AttributeData,
  GeometryData,
  MaterialStandardData,
  PRIMITIVE_MODE,
  PrimitiveData,
} from '@shapediver/viewer.shared.types'
import { container } from 'tsyringe'
import { mat4, vec3, vec4 } from 'gl-matrix'

export class SDGTFLoader {
    // #region Properties (5)

    private readonly BINARY_EXTENSION_HEADER_LENGTH = 20;
    private readonly _logger: Logger = <Logger>container.resolve(Logger);

    private _body!: ArrayBuffer;
    private _content!: ISDGTF_v1;

    // #endregion Properties (5)

    // #region Public Methods (1)

    public async load(binaryGeometry: ArrayBuffer, gltfLength: number): Promise<ITreeNode> {
        if (gltfLength < binaryGeometry.byteLength) {
            const headerDataView = new DataView(binaryGeometry, gltfLength, this.BINARY_EXTENSION_HEADER_LENGTH + 1);
            const header = {
                magic: String.fromCharCode(headerDataView.getUint8(0)) + String.fromCharCode(headerDataView.getUint8(1)) + String.fromCharCode(headerDataView.getUint8(2)) + String.fromCharCode(headerDataView.getUint8(3)) + String.fromCharCode(headerDataView.getUint8(4)),
                version: headerDataView.getUint32(5, true),
                length: headerDataView.getUint32(9, true),
                contentLength: headerDataView.getUint32(13, true),
                contentFormat: headerDataView.getUint32(17, true)
            }
            if (header.magic != 'sdgTF') {
                const error = new ShapeDiverViewerDataProcessingError('SDGTFLoader.load: Invalid data: sdgTF magic wrong.');
                throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `SDGTFLoader.load`, error);
            }

            // create content
            const contentDataView = new DataView(binaryGeometry, gltfLength + this.BINARY_EXTENSION_HEADER_LENGTH + 1, header.contentLength);
            const contentDecoded = new TextDecoder().decode(contentDataView);
            this._content = JSON.parse(contentDecoded);
            this._body = binaryGeometry.slice(gltfLength + this.BINARY_EXTENSION_HEADER_LENGTH + 1 + header.contentLength, gltfLength + header.length);
        } else {
            return new TreeNode();
        }

        try {
            return await this.loadScene();
        } catch (e) {
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `SDGTFLoader.load`, e);
        }
    }

    // #endregion Public Methods (1)

    // #region Private Methods (6)

    private convertToIndicesArray(indices: number[]): Uint8Array | Uint16Array | Uint32Array {
        const max = Math.max(0, ...indices);
        if(max < (1 << 8) - 1) {
            return new Uint8Array(indices);
        } else if (max < (1 << 16) - 1) {
            return new Uint16Array(indices);
        } else {
            return new Uint32Array(indices);
        }
    }

    private async loadAccessor(accessorName: string): Promise<AttributeData> {
        if (!this._content.accessors![accessorName]) throw new Error('Accessor not available.')
        const accessor = this._content.accessors![accessorName];
        const bufferView = this._body;

        const itemSize = ACCESSORTYPE[<keyof typeof ACCESSORTYPE>accessor.type];
        const ArrayType = ACCESSOR_COMPONENTTYPE[<keyof typeof ACCESSOR_COMPONENTTYPE>accessor.componentType];

        const elementBytes = ArrayType.BYTES_PER_ELEMENT;
        const itemBytes = elementBytes * itemSize;
        const byteOffset = accessor.byteOffset || 0;

        return new AttributeData(new ArrayType(bufferView, byteOffset, itemSize * accessor.count), itemSize, itemBytes, byteOffset, elementBytes, false, accessor.count);
    }

    private async loadArcs(): Promise<ITreeNode> {
        if (!this._content.arcs) throw new Error('Arcs not available.')
        const arc = this._content.arcs;
        const arcNode = new TreeNode('arcs');

        const data = await this.loadAccessor(arc.attributes['ARCS']);

        // data with an absolute classic array of Vec12s ...
        // like you usually have it in any good program
        // not 4 Vec3s, no, that would be to logic, but a Vec12 instead

        const count = data.array.length / data.itemSize;

        for (let i = 0; i < count; ++i) {
            const singleArcNode = new TreeNode('arc_' + i);

            const index = i * 12;
            const arcCenter = vec3.fromValues(data.array[index + 0], data.array[index + 1], data.array[index + 2]);
            const arcXAxis = vec3.fromValues(data.array[index + 3], data.array[index + 4], data.array[index + 5]);
            const arcYAxis = vec3.fromValues(data.array[index + 6], data.array[index + 7], data.array[index + 8]);
            const arcRadius = data.array[index + 9];
            const arcMinAngle = data.array[index + 10];
            const arcMaxAngle = data.array[index + 11];
            const arcZAxis = vec3.cross(vec3.create(), arcXAxis, arcYAxis)

            if (arcRadius <= 0) {
                this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'SDGTFLoader.loadArcs: Arc radius is <= 0.');
                continue;
            }
            const points: number[] = [];
            const getPointOnArc = (t: number): void => {
                const twoPi = Math.PI * 2;
                let deltaAngle = arcMaxAngle - arcMinAngle;
                const samePoints = Math.abs(deltaAngle) < Number.EPSILON;
                // ensures that deltaAngle is 0 .. 2 PI
                while (deltaAngle < 0) deltaAngle += twoPi;
                while (deltaAngle > twoPi) deltaAngle -= twoPi;
                deltaAngle = deltaAngle < Number.EPSILON ? samePoints ? 0 : twoPi : deltaAngle;
                const angle = arcMinAngle + t * deltaAngle;
                let x = arcRadius * Math.cos(angle);
                let y = arcRadius * Math.sin(angle);
                points.push(x, y, 0);
            }

            const numberOfPoints = Math.max(3, Math.round(50 * ((arcMaxAngle - arcMinAngle) / 2 * Math.PI)));
            for (let d = 0; d <= numberOfPoints; d++)
                getPointOnArc(d / numberOfPoints);

            const array = new Float32Array(points);
            const attributes: {
                [key: string]: AttributeData
            } = {};
            attributes['POSITION'] = new AttributeData(array, 3, 0, 0, 0, false, array.length / 3)

            const geometry = new GeometryData(new PrimitiveData(attributes, PRIMITIVE_MODE.LINE_STRIP, null));
            singleArcNode.data.push(geometry);

            singleArcNode.addTransformation({
                id: 'arc_' + i + '_translation',
                matrix: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(arcCenter[0], arcCenter[1], arcCenter[2]))
            });

            const arcRotationMatrix = mat4.transpose(mat4.create(), mat4.fromValues(
                arcXAxis[0], arcYAxis[0], arcZAxis[0], 0,
                arcXAxis[1], arcYAxis[1], arcZAxis[1], 0,
                arcXAxis[2], arcYAxis[2], arcZAxis[2], 0,
                0, 0, 0, 1
            ));
            singleArcNode.addTransformation({
                id: 'arc_' + i + '_rotation',
                matrix: arcRotationMatrix
            });

            arcNode.addChild(singleArcNode);
        }
        return arcNode;
    }

    private async loadBeziercurve(beziercurveName: string): Promise<ITreeNode> {
        if (!this._content.beziercurves![beziercurveName]) throw new Error('Beziercurve not available.')
        const beziercurve = this._content.beziercurves![beziercurveName];
        const beziercurveNode = new TreeNode(beziercurveName);

        const controlPointsData = await this.loadAccessor(beziercurve.attributes['CONTROLPOINTS']); // vec3
        const controlPoints: vec4[] = [];
        for (let i = 0; i < controlPointsData.array.length; i += 3)
            controlPoints.push(vec4.fromValues(controlPointsData.array[i], controlPointsData.array[i + 1], controlPointsData.array[i + 2], 1));

        const knotsData = await this.loadAccessor(beziercurve.attributes['KNOTS']); // scalar
        const knots: number[] = [knotsData.array[0]];
        for (let i = 0; i < knotsData.array.length; i++)
            knots.push(knotsData.array[i]);
        knots.push(knotsData.array[knotsData.array.length - 1])
        const degree = beziercurve.degree;

        const findSpan = (u: number): number => {
            const n = knots.length - degree - 1;
            if (u >= knots[n])
                return n - 1;
            if (u <= knots[degree])
                return degree;

            let low = degree;
            let high = n;
            let mid = Math.floor((low + high) / 2);

            while (u < knots[mid] || u >= knots[mid + 1]) {
                if (u < knots[mid]) {
                    high = mid;
                } else {
                    low = mid;
                }
                mid = Math.floor((low + high) / 2);
            }
            return mid;
        }

        const calcBasisFunctions = (span: number, u: number) => {
            const N = [];
            const left = [];
            const right = [];
            N[0] = 1.0;

            for (let j = 1; j <= degree; ++j) {
                left[j] = u - knots[span + 1 - j];
                right[j] = knots[span + j] - u;

                let saved = 0.0;
                for (let r = 0; r < j; ++r) {
                    const rv = right[r + 1];
                    const lv = left[j - r];
                    const temp: number = N[r] / (rv + lv);
                    N[r] = saved + rv * temp;
                    saved = lv * temp;
                }
                N[j] = saved;
            }
            return N;
        }

        const calcBSplinePoint = (u: number): vec4 => {
            const span = findSpan(u);
            const N = calcBasisFunctions(span, u);
            const C = vec4.create();
            for (let j = 0; j <= degree; ++j) {
                const point = controlPoints[span - degree + j];
                const Nj = N[j];
                const wNj = point[3] * Nj;
                vec4.add(C, C, vec4.fromValues(point[0] * wNj, point[1] * wNj, point[2] * wNj, point[3] * Nj))
            }
            return C;
        }

        const points: number[] = [];
        const getPointOnBezierCurve = (t: number): void => {
            const u = knots[0] + t * (knots[knots.length - 1] - knots[0]); // linear mapping t->u
            // following results in (wx, wy, wz, w) homogeneous point
            let hpoint = calcBSplinePoint(u);
            if (hpoint[3] !== 1.0) {
                // project to 3D space: (wx, wy, wz, w) -> (x, y, z, 1)
                hpoint = vec4.divide(vec4.create(), hpoint, vec4.fromValues(hpoint[3], hpoint[3], hpoint[3], hpoint[3]))
            }
            points.push(hpoint[0], hpoint[1], hpoint[2]);
        }

        // Number of points calculation
        // We go through the control points, measure the distance
        let distance = 0;
        for (let i = 1; i < controlPoints.length; i++)
            distance += vec3.distance(vec3.fromValues(controlPoints[i - 1][0], controlPoints[i - 1][1], controlPoints[i - 1][2]), vec3.fromValues(controlPoints[i][0], controlPoints[i][1], controlPoints[i][2]));

        const numberOfPoints = Math.min(100, Math.max(25, Math.floor(distance / 0.1)));
        for (let d = 0; d <= numberOfPoints; d++)
            getPointOnBezierCurve(d / numberOfPoints);

        const array = new Float32Array(points);
        const attributes: {
            [key: string]: AttributeData
        } = {};
        attributes['POSITION'] = new AttributeData(array, 3, 0, 0, 0, false, array.length / 3)

        const geometry = new GeometryData(new PrimitiveData(attributes, PRIMITIVE_MODE.LINE_STRIP, null));
        beziercurveNode.data.push(geometry);

        return beziercurveNode;
    }

    private async loadCircles(): Promise<ITreeNode> {
        if (!this._content.circles) throw new Error('Circles not available.')
        const circle = this._content.circles;
        const circleNode = new TreeNode('circles');

        const data = await this.loadAccessor(circle.attributes['CIRCLES']);

        const count = data.array.length / data.itemSize;
        for (let i = 0; i < count; i++) {
            const singleCircleNode = new TreeNode('circle_' + i);

            const index = i * 10;
            const circleCenter = vec3.fromValues(data.array[index + 0], data.array[index + 1], data.array[index + 2]);
            const circleXAxis = vec3.fromValues(data.array[index + 3], data.array[index + 4], data.array[index + 5]);
            const circleYAxis = vec3.fromValues(data.array[index + 6], data.array[index + 7], data.array[index + 8]);
            const circleRadius = data.array[index + 9];
            const circleZAxis = vec3.cross(vec3.create(), circleXAxis, circleYAxis)

            if (circleRadius <= 0) {
                this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'SDGTFLoader.loadCircles: Circle radius is <= 0.');
                continue;
            }

            const points: number[] = [];
            const getPointOnArc = (t: number): void => {
                const twoPi = Math.PI * 2;
                let deltaAngle = 2.0 * Math.PI - 0;
                const samePoints = Math.abs(deltaAngle) < Number.EPSILON;
                // ensures that deltaAngle is 0 .. 2 PI
                while (deltaAngle < 0) deltaAngle += twoPi;
                while (deltaAngle > twoPi) deltaAngle -= twoPi;
                deltaAngle = deltaAngle < Number.EPSILON ? samePoints ? 0 : twoPi : deltaAngle;
                const angle = 0 + t * deltaAngle;
                let x = circleRadius * Math.cos(angle);
                let y = circleRadius * Math.sin(angle);
                points.push(x, y, 0);
            }

            const numberOfPoints = 50;
            for (let d = 0; d <= numberOfPoints; d++)
                getPointOnArc(d / numberOfPoints);

            const array = new Float32Array(points);
            const attributes: {
                [key: string]: AttributeData
            } = {};
            attributes['POSITION'] = new AttributeData(array, 3, 0, 0, 0, false, array.length / 3)

            const geometry = new GeometryData(new PrimitiveData(attributes, PRIMITIVE_MODE.LINE_STRIP, null));
            singleCircleNode.data.push(geometry);

            singleCircleNode.addTransformation({
                id: 'circle_' + i + '_translation',
                matrix: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(circleCenter[0], circleCenter[1], circleCenter[2]))
            });

            const circleRotationMatrix = mat4.transpose(mat4.create(), mat4.fromValues(
                circleXAxis[0], circleYAxis[0], circleZAxis[0], 0,
                circleXAxis[1], circleYAxis[1], circleZAxis[1], 0,
                circleXAxis[2], circleYAxis[2], circleZAxis[2], 0,
                0, 0, 0, 1
            ));
            singleCircleNode.addTransformation({
                id: 'circle_' + i + '_rotation',
                matrix: circleRotationMatrix
            });

            circleNode.addChild(singleCircleNode);

        }
        return circleNode;
    }

    private async loadCylinders(): Promise<ITreeNode> {
        if (!this._content.cylinders) throw new Error('Cylinders not available.')
        const cylinder = this._content.cylinders;
        const cylinderNode = new TreeNode('cylinders');

        const data = await this.loadAccessor(cylinder.attributes['CYLINDERS']);

        const count = data.array.length / data.itemSize;
        for (let i = 0; i < count; i++) {
            const singleCylinderNode = new TreeNode('cylinder_' + i);

            const index = i * 7;
            const cylinderTop = vec3.fromValues(data.array[index + 0], data.array[index + 1], data.array[index + 2]);
            const cylinderBottom = vec3.fromValues(data.array[index + 3], data.array[index + 4], data.array[index + 5]);
            const cylinderRadius = data.array[index + 6];
            const cylinderAxis = vec3.sub(vec3.create(), cylinderTop, cylinderBottom)
            const dotX = Math.abs(vec3.dot(cylinderAxis, vec3.fromValues(1, 0, 0)));
            const dotY = Math.abs(vec3.dot(cylinderAxis, vec3.fromValues(0, 1, 0)));

            let cylinderXAxis: vec3;
            if (dotX < dotY) {
                cylinderXAxis = vec3.cross(vec3.create(), cylinderAxis, vec3.fromValues(1, 0, 0));
            } else {
                cylinderXAxis = vec3.cross(vec3.create(), cylinderAxis, vec3.fromValues(0, 1, 0));

            }
            const cylinderYAxis = vec3.cross(vec3.create(), cylinderAxis, cylinderXAxis);

            vec3.normalize(cylinderAxis, cylinderAxis);
            vec3.normalize(cylinderXAxis, cylinderXAxis);
            vec3.normalize(cylinderYAxis, cylinderYAxis);

            if (cylinderRadius <= 0) {
                this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'SDGTFLoader.loadCylinders: Cylinder radius is <= 0.');
                continue;
            }

            const indices: number[] = [];
            const vertices: number[] = [];
            const normals: number[] = [];
            const uvs: number[] = [];


            const height = vec3.distance(cylinderTop, cylinderBottom);
            const halfHeight = height / 2;
            const thetaStart = 0, thetaLength = Math.PI * 2
            let indexCounter = 0;
            const indexArray: number[][] = [];

            const heightSegments = 1, radialSegments = 50;

            const normal = vec3.create();
            const vertex = vec3.create();
            let groupCount = 0;
            // this will be used to calculate the normal
            const slope = 0;
            // generate vertices, normals and uvs
            for (let y = 0; y <= heightSegments; y++) {
                const indexRow = [];
                const v = y / heightSegments;
                // calculate the radius of the current row
                const radius = cylinderRadius;
                for (let x = 0; x <= radialSegments; x++) {
                    const u = x / radialSegments;
                    const theta = u * thetaLength + thetaStart;
                    const sinTheta = Math.sin(theta);
                    const cosTheta = Math.cos(theta);
                    // vertex
                    vertex[0] = radius * sinTheta;
                    vertex[1] = - v * height + halfHeight;
                    vertex[2] = radius * cosTheta;
                    vertices.push(vertex[0], vertex[1], vertex[2]);
                    // normal
                    vec3.normalize(normal, vec3.fromValues(sinTheta, slope, cosTheta))
                    normals.push(normal[0], normal[1], normal[2]);
                    // uv
                    uvs.push(u, 1 - v);
                    // save index of vertex in respective row
                    indexRow.push(indexCounter++);
                }
                // now save vertices of the row in our index array
                indexArray.push(indexRow);
            }

            // generate indices
            for (let x = 0; x < radialSegments; x++) {
                for (let y = 0; y < heightSegments; y++) {
                    // we use the index array to access the correct indices
                    const a = indexArray[y][x];
                    const b = indexArray[y + 1][x];
                    const c = indexArray[y + 1][x + 1];
                    const d = indexArray[y][x + 1];
                    // faces
                    indices.push(a, b, d);
                    indices.push(b, c, d);
                    // update group counter
                    groupCount += 6;
                }
            }

            const attributes: {
                [key: string]: AttributeData
            } = {};
            attributes['POSITION'] = new AttributeData(new Float32Array(vertices), 3, 0, 0, 0, false, vertices.length / 3)
            attributes['NORMAL'] = new AttributeData(new Float32Array(normals), 3, 0, 0, 0, false, normals.length / 3)
            attributes['TEXCOORD_0'] = new AttributeData(new Float32Array(uvs), 2, 0, 0, 0, false, uvs.length / 2)

            const geometry = new GeometryData(new PrimitiveData(attributes, PRIMITIVE_MODE.TRIANGLES, new AttributeData(this.convertToIndicesArray(indices), 1, 0, 0, 0, false, indices.length)));
            singleCylinderNode.data.push(geometry);

            singleCylinderNode.addTransformation({
                id: 'cylinder_' + i + '_translation',
                matrix: mat4.translate(mat4.create(), mat4.create(), cylinderBottom)
            });

            const cylinderRotationMatrix = mat4.transpose(mat4.create(), mat4.fromValues(
                cylinderXAxis[0], cylinderYAxis[0], cylinderAxis[0], 0,
                cylinderXAxis[1], cylinderYAxis[1], cylinderAxis[1], 0,
                cylinderXAxis[2], cylinderYAxis[2], cylinderAxis[2], 0,
                0, 0, 0, 1
            ));
            singleCylinderNode.addTransformation({
                id: 'cylinder_' + i + '_rotation',
                matrix: cylinderRotationMatrix
            });


            singleCylinderNode.addTransformation({
                id: 'cylinder_' + i + '_rotation2',
                matrix: mat4.rotateX(mat4.create(), mat4.create(), 0.5 * Math.PI)
            });
            singleCylinderNode.addTransformation({
                id: 'cylinder_' + i + '_translation2',
                matrix: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, 0, 0.5 * vec3.distance(cylinderTop, cylinderBottom)))
            });
            cylinderNode.addChild(singleCylinderNode);

        }
        return cylinderNode;
    }

    private async loadSpheres(): Promise<ITreeNode> {
        if (!this._content.spheres) throw new Error('Spheres not available.')
        const sphere = this._content.spheres;
        const sphereNode = new TreeNode('spheres');

        const data = await this.loadAccessor(sphere.attributes['SPHERES']);

        const count = data.array.length / data.itemSize;
        for (let i = 0; i < count; i++) {
            const singleSphereNode = new TreeNode('sphere_' + i);

            const index = i * 4;
            const sphereTranslation = vec3.fromValues(data.array[index + 0], data.array[index + 1], data.array[index + 2]);
            const sphereRadius = data.array[index + 3];
            if (sphereRadius <= 0) {
                this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'SDGTFLoader.loadSpheres: Sphere radius is <= 0.');
                continue;
            }

            const indices: number[] = [];
            const vertices: number[] = [];
            const normals: number[] = [];
            const uvs: number[] = [];
            const grid: number[][] = [];

            // for some reason, this doesn't work with values > 15
            // let's not look into it, it's legacy stuff
            const heightSegments = 15, widthSegments = 15;
            const phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI;
            const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);

            let indexCounter = 0;

            // generate vertices, normals and uvs

            for (let iy = 0; iy <= heightSegments; iy++) {
                const verticesRow = [];
                const v = iy / heightSegments;

                // special case for the poles
                let uOffset = 0;
                if (iy == 0 && thetaStart == 0) {
                    uOffset = 0.5 / widthSegments;
                } else if (iy == heightSegments && thetaEnd == Math.PI) {
                    uOffset = - 0.5 / widthSegments;
                }
                for (let ix = 0; ix <= widthSegments; ix++) {
                    const u = ix / widthSegments;
                    // vertex
                    const vertex = vec3.fromValues(
                        - sphereRadius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength),
                        sphereRadius * Math.cos(thetaStart + v * thetaLength),
                        sphereRadius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength)
                    );
                    vertices.push(vertex[0], vertex[1], vertex[2]);
                    // normal
                    const normal = vec3.normalize(vec3.create(), vertex);
                    normals.push(normal[0], normal[1], normal[2]);
                    // uv
                    uvs.push(u + uOffset, 1 - v);
                    verticesRow.push(indexCounter++);
                }
                grid.push(verticesRow);
            }

            // indices
            for (let iy = 0; iy < heightSegments; iy++) {
                for (let ix = 0; ix < widthSegments; ix++) {
                    const a = grid[iy][ix + 1];
                    const b = grid[iy][ix];
                    const c = grid[iy + 1][ix];
                    const d = grid[iy + 1][ix + 1];
                    if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
                    if (iy !== heightSegments - 1 || thetaEnd < Math.PI) indices.push(b, c, d);
                }
            }

            const attributes: {
                [key: string]: AttributeData
            } = {};
            attributes['POSITION'] = new AttributeData(new Float32Array(vertices), 3, 0, 0, 0, false, vertices.length / 3)
            attributes['NORMAL'] = new AttributeData(new Float32Array(normals), 3, 0, 0, 0, false, normals.length / 3)
            attributes['TEXCOORD_0'] = new AttributeData(new Float32Array(uvs), 2, 0, 0, 0, false, uvs.length / 2)

            const geometry = new GeometryData(new PrimitiveData(attributes, PRIMITIVE_MODE.TRIANGLES, new AttributeData(this.convertToIndicesArray(indices), 1, 0, 0, 0, false, indices.length)));
            singleSphereNode.data.push(geometry);

            singleSphereNode.addTransformation({
                id: 'sphere_' + i + '_translation',
                matrix: mat4.translate(mat4.create(), mat4.create(), sphereTranslation)
            });
            sphereNode.addChild(singleSphereNode);

        }
        return sphereNode;
    }

    private async loadPoint(pointName: string): Promise<ITreeNode> {
        if (!this._content.points![pointName]) throw new Error('Point not available.')
        const point = this._content.points![pointName];
        const pointNode = new TreeNode(pointName);

        const attributes: {
            [key: string]: AttributeData
        } = {};

        const data = await this.loadAccessor(point.attributes['POINTS']);
        attributes['POSITION'] = new AttributeData(data.array, 3, data.itemBytes, data.byteOffset, data.elementBytes, data.normalized, data.count)

        const geometry = new GeometryData(new PrimitiveData(attributes, PRIMITIVE_MODE.POINTS, null));
        pointNode.data.push(geometry);

        return pointNode;
    }

    private async loadPolyline(polylineName: string): Promise<ITreeNode> {
        if (!this._content.polylines![polylineName]) throw new Error('Polyline not available.')
        const polyLine = this._content.polylines![polylineName];
        const polyLineNode = new TreeNode(polylineName);

        const attributes: {
            [key: string]: AttributeData
        } = {};

        const data = await this.loadAccessor(polyLine.attributes['VERTICES']);
        attributes['POSITION'] = new AttributeData(data.array, 3, data.itemBytes, data.byteOffset, data.elementBytes, data.normalized, data.count)

        const geometry = new GeometryData(new PrimitiveData(attributes, PRIMITIVE_MODE.LINE_STRIP, null));
        polyLineNode.data.push(geometry);

        return polyLineNode;
    }

    private async loadSurfacepatch(surfacepatchName: string): Promise<ITreeNode> {
        if (!this._content.surfacepatches![surfacepatchName]) throw new Error('Surfacepatch not available.')
        const surfacepatch = this._content.surfacepatches![surfacepatchName];
        const surfacepatchNode = new TreeNode(surfacepatchName);

        const controlPointCountU = surfacepatch.controlPointCountU;
        const controlPointCountV = surfacepatch.controlPointCountV;

        const controlPointsData = await this.loadAccessor(surfacepatch.attributes['CONTROLPOINTS']); // vec3
        const controlPoints: vec4[][] = [];
        let pointCount = 0;
        for (let u = 0; u < controlPointCountU; u++) {
            let innerArray = []
            for (let v = 0; v < controlPointCountV; v++) {
                innerArray.push(vec4.fromValues(controlPointsData.array[pointCount * 3], controlPointsData.array[pointCount * 3 + 1], controlPointsData.array[pointCount * 3 + 2], 1));
                pointCount++;
            }
            controlPoints.push(innerArray);
        }

        const knotsUData = await this.loadAccessor(surfacepatch.attributes['KNOTSU']); // scalar
        const knotsU: number[] = [knotsUData.array[0]];
        for (let i = 0; i < knotsUData.array.length; i++)
            knotsU.push(knotsUData.array[i]);
        knotsU.push(knotsUData.array[knotsUData.array.length - 1])

        const knotsVData = await this.loadAccessor(surfacepatch.attributes['KNOTSV']); // scalar
        const knotsV: number[] = [knotsVData.array[0]];
        for (let i = 0; i < knotsVData.array.length; i++)
            knotsV.push(knotsVData.array[i]);
        knotsV.push(knotsVData.array[knotsVData.array.length - 1])

        const degreeU = surfacepatch.degreeU;
        const degreeV = surfacepatch.degreeV;

        const findSpan = (knots: number[], degree: number, u: number): number => {
            const n = knots.length - degree - 1;
            if (u >= knots[n])
                return n - 1;
            if (u <= knots[degree])
                return degree;

            let low = degree;
            let high = n;
            let mid = Math.floor((low + high) / 2);

            while (u < knots[mid] || u >= knots[mid + 1]) {
                if (u < knots[mid]) {
                    high = mid;
                } else {
                    low = mid;
                }
                mid = Math.floor((low + high) / 2);
            }
            return mid;
        }

        const calcBasisFunctions = (knots: number[], degree: number, span: number, u: number) => {
            const N = [];
            const left = [];
            const right = [];
            N[0] = 1.0;

            for (let j = 1; j <= degree; ++j) {
                left[j] = u - knots[span + 1 - j];
                right[j] = knots[span + j] - u;

                let saved = 0.0;
                for (let r = 0; r < j; ++r) {
                    const rv = right[r + 1];
                    const lv = left[j - r];
                    const temp: number = N[r] / (rv + lv);
                    N[r] = saved + rv * temp;
                    saved = lv * temp;
                }
                N[j] = saved;
            }
            return N;
        }

        const calcSurfacePoint = (u: number, v: number): vec3 => {

            const uspan = findSpan(knotsU, degreeU, u);
            const vspan = findSpan(knotsV, degreeV, v);
            const Nu = calcBasisFunctions(knotsU, degreeU, uspan, u);
            const Nv = calcBasisFunctions(knotsV, degreeV, vspan, v);
            const temp: vec4[] = [];

            for (let l = 0; l <= degreeV; ++l) {

                temp[l] = vec4.create();
                for (let k = 0; k <= degreeU; ++k) {

                    const point = vec4.clone(controlPoints[uspan - degreeU + k][vspan - degreeV + l]);
                    const w = point[3];
                    point[0] *= w;
                    point[1] *= w;
                    point[2] *= w;
                    vec4.add(temp[l], temp[l], vec4.multiply(vec4.create(), point, vec4.fromValues(Nu[k], Nu[k], Nu[k], Nu[k])))
                }
            }

            const Sw = vec4.create();
            for (let l = 0; l <= degreeV; ++l) {
                vec4.add(Sw, Sw, vec4.multiply(vec4.create(), temp[l], vec4.fromValues(Nv[l], Nv[l], Nv[l], Nv[l])))
            }

            vec4.divide(Sw, Sw, vec4.fromValues(Sw[3], Sw[3], Sw[3], Sw[3]))
            return vec3.fromValues(Sw[0], Sw[1], Sw[2]);
        }

        const getPointOnSurfacepatch = (t1: number, t2: number): vec3 => {
            const u = knotsU[0] + t1 * (knotsU[knotsU.length - 1] - knotsU[0]); // linear mapping t1->u
            const v = knotsV[0] + t2 * (knotsV[knotsV.length - 1] - knotsV[0]); // linear mapping t2->u
            return calcSurfacePoint(u, v);
        }

        const numberOfPoints = 15;

        const indices: number[] = [];
        const vertices = [];

        for (let d = 0; d <= numberOfPoints; d++) {
            const v = d / numberOfPoints;
            for (let f = 0; f <= numberOfPoints; f++) {
                const u = f / numberOfPoints;
                const vertex = getPointOnSurfacepatch(u, v);
                vertices.push(vertex[0], vertex[1], vertex[2]);
            }
        }

        for (let d = 0; d < numberOfPoints; d++) {
            for (let f = 0; f < numberOfPoints; f++) {
                const i1 = d * (numberOfPoints + 1) + f;
                const i2 = d * (numberOfPoints + 1) + f + 1;
                const i3 = (d+1) * (numberOfPoints + 1) + f;
                const i4 = (d+1) * (numberOfPoints + 1) + f + 1;
                // faces one and two
                indices.push(i3, i2, i1);
                indices.push(i2, i3, i4);
            }
        }

        const attributes: {
            [key: string]: AttributeData
        } = {};
        attributes['POSITION'] = new AttributeData(new Float32Array(vertices), 3, 0, 0, 0, false, vertices.length / 3);
        // to not compute normals ourselves, we just let three.js do it
        // in our geometry loader, this array will cause the computation of vertex normals
        attributes['NORMAL'] = new AttributeData(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), 3, 0, 0, 0, false, vertices.length / 3);
        
        const geometry = new GeometryData(new PrimitiveData(attributes, PRIMITIVE_MODE.TRIANGLES, new AttributeData(this.convertToIndicesArray(indices), 1, 0, 0, 0, false, indices.length)));
        surfacepatchNode.data.push(geometry);

        return surfacepatchNode;
    }


    private async loadScene(): Promise<ITreeNode> {
        const sceneNode = new TreeNode('sdgtf_content');

        // arcs
        if (this._content.arcs)
            sceneNode.addChild(await this.loadArcs());

        // beziercurves
        if (this._content.beziercurves) {
            for (let beziercurve in this._content.beziercurves)
                sceneNode.addChild(await this.loadBeziercurve(beziercurve));
        }

        // circles
        if (this._content.circles)
            sceneNode.addChild(await this.loadCircles());

        // cylinders
        if (this._content.cylinders)
            sceneNode.addChild(await this.loadCylinders());

        //points
        if (this._content.points) {
            for (let point in this._content.points)
                sceneNode.addChild(await this.loadPoint(point));
        }

        // polylines
        if (this._content.polylines) {
            for (let line in this._content.polylines)
                sceneNode.addChild(await this.loadPolyline(line));
        }

        // spheres
        if (this._content.spheres)
            sceneNode.addChild(await this.loadSpheres());

        // surfacepatches
        if (this._content.surfacepatches) {
            for (let surfacepatch in this._content.surfacepatches)
                sceneNode.addChild(await this.loadSurfacepatch(surfacepatch));
        }
        return sceneNode;
    }

    // #endregion Private Methods (6)
}