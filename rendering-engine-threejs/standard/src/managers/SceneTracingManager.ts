import { vec2, vec3 } from 'gl-matrix'
import { ITree, ITreeNode, Tree, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { GeometryData } from '@shapediver/viewer.shared.types'
import { container } from 'tsyringe'
import { AbstractCamera, OrthographicCamera, ORTHOGRAPHIC_CAMERA_DIRECTION } from '@shapediver/viewer.rendering-engine.camera-engine'
import { Logger, LOGGING_TOPIC, ShapeDiverViewerGeneralError } from '@shapediver/viewer.shared.services'

import { IManager } from '../interfaces/IManager'
import { RenderingEngine } from '../RenderingEngine'

export class SceneTracingManager implements IManager {
    // #region Properties (2)

    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _tree: ITree = <ITree>container.resolve(Tree);

    // #endregion Properties (2)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) { }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    public convert3Dto2D(p: vec3): {
        container: vec2, client: vec2, page: vec2, hidden: boolean
    } {
        const canvasPageCoordinates = this._renderingEngine.canvas.getBoundingClientRect(),
            width = this._renderingEngine.canvas.width,
            height = this._renderingEngine.canvas.height;

        const camera = this._renderingEngine.cameraEngine.camera;
        if (!camera) {
            const error = new ShapeDiverViewerGeneralError('SceneTracingManager.convert3Dto2D: No camera is defined for this viewer.');
            throw this._logger.handleError(LOGGING_TOPIC.SESSION, 'SceneTracingManager.convert3Dto2D', error);
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

    public init(): void { }

    public trace(origin: vec3, direction: vec3, root: ITreeNode = this._tree.root) {
        const tracingData: { distance: number, node: ITreeNode, data: GeometryData }[] = [];
        const trace = (node: ITreeNode) => {
            if (node.excludeViewports.includes(this._renderingEngine.id)) return;
            if (node.restrictViewports.length > 0 && !node.restrictViewports.includes(this._renderingEngine.id)) return;

            for (let i = 0; i < node.data.length; i++)
                if (node.data[i] instanceof GeometryData) {
                    const dist = (<GeometryData>node.data[i]).intersect(origin, direction);
                    if (dist) tracingData.push({ distance: dist, node, data: <GeometryData>node.data[i] })
                }
            for (let i = 0; i < node.children.length; i++)
                trace(node.children[i]);
        }
        trace(root);

        tracingData.sort((a: { distance: number, data: GeometryData }, b: { distance: number, data: GeometryData }) => {
            return a.distance - b.distance;
        })
        return tracingData;
    }

    /**
     * Calculate the ray that is created by the mouse event and the camera.
     * 
     * @param event 
     * @returns 
     */
    public mouseEventToRay(event: MouseEvent): {
        origin: vec3,
        direction: vec3
    } {
        const rect = this._renderingEngine.canvas.getBoundingClientRect();
        const camera = this._renderingEngine.cameraEngine.camera;
        if (!camera) {
            const error = new ShapeDiverViewerGeneralError('SceneTracingManager.mouseEventToRay: No camera is defined for this viewer.');
            throw this._logger.handleError(LOGGING_TOPIC.VIEWPORT, `SceneTracingManager.mouseEventToRay`, error);
        }

        let _mouse_x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        let _mouse_y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

        let origin = vec3.clone(camera.position);
        if(camera instanceof OrthographicCamera) {
            if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.TOP) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.right, _mouse_y*camera.top, 0))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.left, _mouse_y*camera.top, 0))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(0, _mouse_x*camera.left, _mouse_y*camera.top))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(0, _mouse_x*camera.right, _mouse_y*camera.top))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.right, 0, _mouse_y*camera.top))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.BACK) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.left, 0, _mouse_y*camera.top))
            }
        }

        let direction = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), camera.unproject(vec3.fromValues(_mouse_x, _mouse_y, 0.5)), origin));

        return { origin, direction };
    }

    /**
     * Create the ray that is created by the touch event and the camera.
     * 
     * @param event 
     * @returns 
     */
    public touchEventToRay(event: TouchEvent): {
        origin: vec3,
        direction: vec3
    } {
        if (event.touches.length > 1) {
            const error = new ShapeDiverViewerGeneralError('SceneTracingManager.touchEventToRay: No touches in this event.');
            throw this._logger.handleError(LOGGING_TOPIC.VIEWPORT, `SceneTracingManager.touchEventToRay`, error);
        }
        const touch = event.changedTouches[0];

        const rect = this._renderingEngine.canvas.getBoundingClientRect();
        const camera = this._renderingEngine.cameraEngine.camera;
        if (!camera) {
            const error = new ShapeDiverViewerGeneralError('SceneTracingManager.touchEventToRay: No camera is defined for this viewer.');
            throw this._logger.handleError(LOGGING_TOPIC.VIEWPORT, `SceneTracingManager.touchEventToRay`, error);
        }

        let _mouse_x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        let _mouse_y = - ((touch.clientY - rect.top) / rect.height) * 2 + 1;

        let origin = vec3.clone(camera.position);
        if(camera instanceof OrthographicCamera) {
            if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.TOP) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.right, _mouse_y*camera.top, 0))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.left, _mouse_y*camera.top, 0))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(0, _mouse_x*camera.left, _mouse_y*camera.top))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(0, _mouse_x*camera.right, _mouse_y*camera.top))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.right, 0, _mouse_y*camera.top))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.BACK) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.left, 0, _mouse_y*camera.top))
            }
        }
        let direction = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), camera.unproject(vec3.fromValues(_mouse_x, _mouse_y, 0.5)), origin));

        return { origin, direction };
    }

    /**
     * Create the ray that is created by the touch event and the camera.
     * 
     * @param event 
     * @returns 
     */
    public touchToRay(event: Touch): {
        origin: vec3,
        direction: vec3
    } {
        const rect = this._renderingEngine.canvas.getBoundingClientRect();
        const camera = this._renderingEngine.cameraEngine.camera;
        if (!camera) {
            const error = new ShapeDiverViewerGeneralError('SceneTracingManager.touchToRay: No camera is defined for this viewer.');
            throw this._logger.handleError(LOGGING_TOPIC.VIEWPORT, `SceneTracingManager.touchToRay`, error);
        }

        let _mouse_x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        let _mouse_y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

        let origin = vec3.clone(camera.position);
        if(camera instanceof OrthographicCamera) {
            if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.TOP) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.right, _mouse_y*camera.top, 0))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.left, _mouse_y*camera.top, 0))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(0, _mouse_x*camera.left, _mouse_y*camera.top))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(0, _mouse_x*camera.right, _mouse_y*camera.top))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.right, 0, _mouse_y*camera.top))
            } else if(camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.BACK) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x*camera.left, 0, _mouse_y*camera.top))
            }
        }
        let direction = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), camera.unproject(vec3.fromValues(_mouse_x, _mouse_y, 0.5)), origin));

        return { origin, direction };
    }

    // #endregion Public Methods (3)
}