import * as THREE from 'three'
import { MATERIAL_SIDE, MaterialData } from '@shapediver/viewer.shared.types'
import { vec3 } from 'gl-matrix'
import { Box } from '@shapediver/viewer.shared.math'

import { RenderingEngine } from '..'
import { IManager } from '../interfaces/IManager'
import { SDObject } from '../types/SDObject'

export class EnvironmentGeometryManager implements IManager {
    // #region Properties (5)

    private _environmentGeometryObject!: SDObject;
    private _grid!: THREE.GridHelper;
    private _gridObject!: SDObject;
    private _groundPlane!: THREE.Mesh;
    private _groundPlaneObject!: SDObject;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {}

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    /**
     * Getter grid
     * @return {THREE.GridHelper}
     */
    public get grid(): THREE.GridHelper {
        return this._grid;
    }

    /**
     * Getter groundPlane
     * @return {THREE.Mesh}
     */
    public get groundPlane(): THREE.Mesh {
        return this._groundPlane;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (2)

    public assignGroundPlaneColor(color: string) {
        (<THREE.MeshStandardMaterial>this._groundPlane.material).color = new THREE.Color(color);
        (<THREE.MeshStandardMaterial>this._groundPlane.material).needsUpdate = true;
    }    
    
    public assignGroundPlaneEnvironmentIntensity(intensity: number) {
        (<THREE.MeshStandardMaterial>this._groundPlane.material).envMapIntensity = intensity;
        (<THREE.MeshStandardMaterial>this._groundPlane.material).needsUpdate = true;
    }

    public changeSceneExtents(bb: Box) {
        if (vec3.equals(bb.min, vec3.create()) && vec3.equals(bb.max, vec3.create()))
            bb = new Box(vec3.fromValues(-10, -10, -10), vec3.fromValues(10, 10, 10));

        let sceneExtents = vec3.distance(bb.min, bb.max);

        /**
         * https://shapediver.atlassian.net/browse/SS-2961 evaluate this magic
         * 
         * magic begin
         */

        let divisions = 0.1;
        let gridExtents = sceneExtents;
        if (sceneExtents > 1) {
            let tmp = Math.floor(sceneExtents).toString();
            let temp = Math.pow(10, tmp.length - 1);
            gridExtents = Math.max(Math.ceil(sceneExtents / temp) * temp, 1);
            temp = temp / 10;
            divisions = gridExtents / temp;
        }
        else {
            let zeros = 1 - Math.floor(Math.log(sceneExtents) / Math.log(10)) - 2;
            let r = sceneExtents.toFixed(zeros + 1);
            let firstDigit = parseInt(r.substr(r.length - 1)) + 1;
            let gridExtentsS = '0.';
            for (let i = 0; i < zeros; ++i)
                gridExtentsS = gridExtentsS + '0';
            gridExtents = parseFloat(gridExtentsS + firstDigit);
            divisions = firstDigit * 10;
        }

        /**
         * magic end
         */

        this._gridObject.remove(this._grid);
        this._grid = new THREE.GridHelper(2 * gridExtents, divisions);
        (<THREE.Material>this._grid.material).opacity = 0.15;
        (<THREE.Material>this._grid.material).transparent = true;
        this._grid.rotateX(Math.PI / 2);
        this._grid.visible = this._renderingEngine.gridVisibility;
        this._gridObject.add(this._grid);

        this._groundPlane.geometry = new THREE.PlaneGeometry(2 * gridExtents, 2 * gridExtents, 2, 2);

        let eps = 0.005;
        let bs = bb.boundingSphere;
        this._grid.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
        this._groundPlane.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
    }

    public init(): void {
        this._environmentGeometryObject = new SDObject('environmentGeometry', '');
        this._renderingEngine.sceneTreeManager.scene.add(this._environmentGeometryObject);
        
        this._gridObject = new SDObject('grid', '');
        this._grid = new THREE.GridHelper();
        (<THREE.Material>this._grid.material).opacity = 0.15;
        (<THREE.Material>this._grid.material).transparent = true;
        this._grid.rotateX(Math.PI / 2);
        this._grid.visible = this._renderingEngine.gridVisibility;
        this._gridObject.add(this._grid);
        this._gridObject.userData.ambientOcclusion = false;
        this._environmentGeometryObject.add(this._gridObject);

        this._groundPlaneObject = new SDObject('grid', '');
        let mat = new MaterialData();
        mat.color = '#d3d3d3';
        mat.side = MATERIAL_SIDE.FRONT;
        mat.roughness = 1;
        mat.metalness = 0;
        this._groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(), this._renderingEngine.materialLoader.load(mat));
        this._groundPlane.receiveShadow = true;
        this._groundPlane.visible = this._renderingEngine.groundPlaneVisibility;
        this._groundPlaneObject.add(this._groundPlane);
        this._groundPlaneObject.userData.ambientOcclusion = false;
        this._environmentGeometryObject.add(this._groundPlaneObject);

        let eps = 0.005;
        this._grid.position.set(0, 0, -eps);
        this._groundPlane.position.set(0, 0, -eps);
    }

    // #endregion Public Methods (2)
}