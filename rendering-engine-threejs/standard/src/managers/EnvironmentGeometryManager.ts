import * as THREE from 'three'
import { MATERIAL_SIDE, MaterialData, ISceneEvent } from '@shapediver/viewer.shared.types'
import { vec3 } from 'gl-matrix'
import { Box } from '@shapediver/viewer.shared.math'
import { Converter, EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services'

import { RenderingEngine } from '..'
import { IManager } from '../interfaces/IManager'
import { SDNode } from '../types/SDNode'
import { container } from 'tsyringe'
import { SDData } from '../types/SDData'

export class EnvironmentGeometryManager implements IManager {
    // #region Properties (5)
    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);

    private _environmentGeometryObject!: SDNode;
    private _grid!: THREE.GridHelper;
    private _gridObject!: SDData;
    private _groundPlane!: THREE.Mesh;
    private _groundPlaneObject!: SDData;
    private _groundPlaneColor: string = '#d3d3d3';
    private _gridColor: string = '#444444';

    private _initialized: boolean = false;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        this._eventEngine.addListener(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, (e) => {
            const bb = new Box(this._renderingEngine.sceneTreeManager.boundingBox.min, this._renderingEngine.sceneTreeManager.boundingBox.max);

            if (((bb.min[0] === 0 && bb.min[1] === 0 && bb.min[2] === 0) && (bb.max[0] === 0 && bb.max[1] === 0 && bb.max[2] === 0)) || bb.isEmpty()) return;

            if(!this._initialized) {
                this.changeSceneExtents(bb)
            } else {
                let eps = 0.005;
                let bs = bb.boundingSphere;
                if(this._grid) this._grid.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
                if(this._groundPlane) this._groundPlane.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
            }
        })
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get gridColor(): string {
        return this._gridColor;
    } 
    
    public set gridColor(value: string) {
        this._gridColor = value;
        (<THREE.LineBasicMaterial>this._grid.material).color = new THREE.Color(this._gridColor);
    }

    public get groundPlaneColor(): string {
        return this._groundPlaneColor;
    } 
    
    public set groundPlaneColor(value: string) {
        this._groundPlaneColor = value;
        let mat = new MaterialData();
        mat.color = this._groundPlaneColor;
        mat.side = MATERIAL_SIDE.FRONT;
        mat.roughness = 1;
        mat.metalness = 0;
        this._groundPlane.material = this._renderingEngine.materialLoader.load(mat);
    }

    public get grid(): THREE.GridHelper {
        return this._grid;
    }

    public get groundPlane(): THREE.Mesh {
        return this._groundPlane;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (2)

    public assignGroundPlaneColor(color: string) {
        (<THREE.MeshStandardMaterial>this._groundPlane.material).color = new THREE.Color(this._converter.toThreeJsColorInput(color));
        (<THREE.MeshStandardMaterial>this._groundPlane.material).needsUpdate = true;
    }    
    
    public assignGroundPlaneEnvironmentIntensity(intensity: number) {
        (<THREE.MeshStandardMaterial>this._groundPlane.material).envMapIntensity = intensity;
        (<THREE.MeshStandardMaterial>this._groundPlane.material).needsUpdate = true;
    }

    public changeSceneExtents(bb: Box) {
        if (((bb.min[0] === 0 && bb.min[1] === 0 && bb.min[2] === 0) && (bb.max[0] === 0 && bb.max[1] === 0 && bb.max[2] === 0)) || bb.isEmpty()) return;

        this._initialized = true;
        let sceneExtents = vec3.distance(bb.min, bb.max);

        /**
         * https://shapediver.atlassian.net/browse/SS-2961 evaluate this magic
         * 
         * magic begin
         */

        let divisions = 0.1;
        let gridExtents = 1.0;
        if (sceneExtents > 1) {
            let tmp = Math.floor(sceneExtents).toString();
            let temp = Math.pow(10, tmp.length - 1);
            gridExtents = Math.max(Math.ceil(sceneExtents / temp) * temp, 1);
            temp = temp / 10;
            divisions = gridExtents / temp;
        }
        else if (sceneExtents !== 0) {
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
        (<THREE.LineBasicMaterial>this._grid.material).opacity = 0.15;
        (<THREE.LineBasicMaterial>this._grid.material).transparent = true;
        (<THREE.LineBasicMaterial>this._grid.material).color = new THREE.Color(this._gridColor);
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
        this._environmentGeometryObject = new SDNode('environmentGeometry', '');
        this._renderingEngine.sceneTreeManager.scene.add(this._environmentGeometryObject);
        
        this._gridObject = new SDData('grid', '');
        this._grid = new THREE.GridHelper();
        (<THREE.LineBasicMaterial>this._grid.material).opacity = 0.15;
        (<THREE.LineBasicMaterial>this._grid.material).transparent = true;
        (<THREE.LineBasicMaterial>this._grid.material).color = new THREE.Color(this._gridColor);
        this._grid.rotateX(Math.PI / 2);
        this._grid.visible = this._renderingEngine.gridVisibility;
        this._gridObject.add(this._grid);
        this._gridObject.userData.ambientOcclusion = false;
        this._environmentGeometryObject.add(this._gridObject);

        this._groundPlaneObject = new SDData('grid', '');
        let mat = new MaterialData();
        mat.color = this._groundPlaneColor;
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