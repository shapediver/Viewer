import * as THREE from 'three';
import { AbstractCamera, ORTHOGRAPHIC_CAMERA_DIRECTION, OrthographicCamera } from '@shapediver/viewer.rendering-engine.camera-engine';
import { IManager } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { RenderingEngine } from '../RenderingEngine';
import { ShapeDiverViewerViewportError } from '@shapediver/viewer.shared.services';
import { vec2, vec3 } from 'gl-matrix';

export class SceneTracingManager implements IManager {
    // #region Properties (1)

    private readonly _raycaster = new THREE.Raycaster();

    // #endregion Properties (1)

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
        if (!camera)
            throw new ShapeDiverViewerViewportError('SceneTracingManager.convert3Dto2D: No camera is defined for this viewer.');


        if(camera instanceof OrthographicCamera) {
            const direction = vec3.sub(vec3.create(), camera.target, camera.position);
            const length = vec3.length(direction);
            vec3.divide(direction, direction, vec3.fromValues(length, length, length));
            this._raycaster.ray.direction.set(direction[0], direction[1], direction[2]);

            // set the origin of the ray to the opposite direction of the camera with the start at the initial provided point
            this._raycaster.ray.origin.set(p[0] + direction[0] * length, p[1] + direction[1] * length, p[2] + direction[2] * length);
        } else {
            this._raycaster.ray.direction.set(p[0], p[1], p[2]);
            this._raycaster.ray.origin.set(0, 0, 0);
            (camera.convertedObject[this._renderingEngine.id] as THREE.Camera).localToWorld(this._raycaster.ray.origin);
            this._raycaster.ray.direction.sub(this._raycaster.ray.origin);
            this._raycaster.ray.direction.normalize();
        }

        let closestIntersectionDistance = Number.MAX_VALUE;
        this._renderingEngine.sceneTreeManager.scene.traverseVisible((obj: THREE.Object3D) => {
            if (obj instanceof THREE.Mesh) {
                const curIntersections = this._raycaster.intersectObject(obj);
                if (curIntersections.length)
                    if (curIntersections[0].distance < closestIntersectionDistance)
                        closestIntersectionDistance = curIntersections[0].distance;
            }
        });

        const pos: vec2 = (<AbstractCamera>camera).project(vec3.clone(p));

        pos[0] = (pos[0] * (width / 2)) + (width / 2);
        pos[1] = - (pos[1] * (height / 2)) + (height / 2);

        // take care of correction by device pixel ratio
        pos[0] = pos[0] / devicePixelRatio;
        pos[1] = pos[1] / devicePixelRatio;

        // epsilon is added as a distance spacer as users tend to put the anchors of html elements directly at the vertices
        // with this we prevent flickering
        const eps = 0.0001;

        return {
            hidden: closestIntersectionDistance + eps < vec3.distance(camera.position, p),
            container: vec2.clone(pos),
            client: vec2.fromValues(pos[0] + canvasPageCoordinates.left, pos[1] + canvasPageCoordinates.top),
            page: vec2.fromValues(pos[0] + canvasPageCoordinates.left + window.pageXOffset, pos[1] + canvasPageCoordinates.top + window.pageYOffset)
        };
    }

    public init(): void { }

    /**
     * Calculate the ray that is created by the mouse event and the camera.
     * 
     * @param event 
     * @returns 
     */
    public pointerEventToRay(event: PointerEvent): {
        origin: vec3,
        direction: vec3
    } {
        const rect = this._renderingEngine.canvas.getBoundingClientRect();
        const camera = this._renderingEngine.cameraEngine.camera;
        if (!camera)
            throw new ShapeDiverViewerViewportError('SceneTracingManager.pointerEventToRay: No camera is defined for this viewer.');

        const _mouse_x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const _mouse_y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

        let origin = vec3.clone(camera.position);
        if (camera instanceof OrthographicCamera) {
            if (camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.TOP) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x * camera.right, _mouse_y * camera.top, 0));
            } else if (camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x * camera.left, _mouse_y * camera.top, 0));
            } else if (camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(0, _mouse_x * camera.left, _mouse_y * camera.top));
            } else if (camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(0, _mouse_x * camera.right, _mouse_y * camera.top));
            } else if (camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x * camera.right, 0, _mouse_y * camera.top));
            } else if (camera.direction == ORTHOGRAPHIC_CAMERA_DIRECTION.BACK) {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(_mouse_x * camera.left, 0, _mouse_y * camera.top));
            } else {
                origin = vec3.add(vec3.create(), camera.position, vec3.fromValues(0, _mouse_x * camera.left, _mouse_y * camera.top));
            }
        }

        const direction = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), camera.unproject(vec3.fromValues(_mouse_x, _mouse_y, 0.5)), origin));

        return { origin, direction };
    }

    // #endregion Public Methods (3)
}