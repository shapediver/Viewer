import { vec2, vec3 } from 'gl-matrix'
import { Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { GeometryData } from '@shapediver/viewer.shared.types'
import { container } from 'tsyringe'
import { AbstractCamera } from '@shapediver/viewer.rendering-engine.camera-engine'
import { Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.services'

import { IManager } from '../interfaces/IManager'
import { RenderingEngine } from '../RenderingEngine'

export class SceneTracingManager implements IManager {
    // #region Properties (2)

    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _tree: Tree = <Tree>container.resolve(Tree);

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {}

    // #endregion Constructors (1)

    // #region Public Methods (3)

    public convert3Dto2D(p: vec3): {
        container: vec2, client: vec2, page: vec2, hidden: boolean
    } {
        const canvasPageCoordinates = this._renderingEngine.canvas.canvasElement.getBoundingClientRect(),
            width = this._renderingEngine.canvas.canvasElement.width,
            height = this._renderingEngine.canvas.canvasElement.height;

        const camera = this._renderingEngine.cameraEngine.camera;
        if (!camera){
            const error = new SDError('RenderingEngine: No camera is defined for this viewer.');
            this._logger.warn(LOGGINGTOPIC.VIEWER, error.message);
            throw error;
        }

        const direction = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), p, camera.position));
        const tracing = this.trace(camera.position, direction);
        const pos: vec2 = (<AbstractCamera>camera).project(vec3.clone(p));

        pos[0] = (pos[0] * (width / 2)) + (width / 2);
        pos[1] = - (pos[1] * (height / 2)) + (height / 2);

        // take care of correction by device pixel ratio
        pos[0] = pos[0] / devicePixelRatio;
        pos[1] = pos[1] / devicePixelRatio;

        return {
            hidden: tracing.length > 1 && tracing[0].distance > 0 && tracing[0].distance < Infinity && tracing[0].distance < vec3.distance(camera.position, p),
            container: vec2.clone(pos),
            client: vec2.fromValues(pos[0] + canvasPageCoordinates.left, pos[1] + canvasPageCoordinates.top),
            page: vec2.fromValues(pos[0] + canvasPageCoordinates.left + window.pageXOffset, pos[1] + canvasPageCoordinates.top + window.pageYOffset)
        };
    }

    public init(): void {}

    public trace(origin: vec3, direction: vec3, root: TreeNode = this._tree.root) {
        const tracingData: { distance: number, data: GeometryData }[] = [];
        const trace = (root: TreeNode) => {
            for (let i = 0; i < root.data.length; i++)
                if (root.data[i] instanceof GeometryData) {
                    const dist = (<GeometryData>root.data[i]).intersect(origin, direction);
                    if (dist) tracingData.push({ distance: dist, data: <GeometryData>root.data[i] })
                }
            for (let i = 0; i < root.children.length; i++)
                trace(root.children[i]);
        }
        trace(root);

        tracingData.sort((a: { distance: number, data: GeometryData }, b: { distance: number, data: GeometryData }) => {
            return a.distance - b.distance;
        })
        return tracingData;
    }

    // #endregion Public Methods (3)
}