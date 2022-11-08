import * as THREE from 'three'
import { MATERIAL_SIDE, MaterialStandardData, ISceneEvent, MaterialShadowData } from '@shapediver/viewer.shared.types'
import { vec3 } from 'gl-matrix'
import { Box, IBox } from '@shapediver/viewer.shared.math'
import { Converter, EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services'

import { RenderingEngine } from '..'
import { IManager } from '../interfaces/IManager'
import { container } from 'tsyringe'
import { SDData } from '../objects/SDData'
import { SDObject } from '../objects/SDObject'

export class EnvironmentGeometryManager implements IManager {
    // #region Properties (5)
    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);

    private _environmentGeometryObject!: SDObject;
    private _grid!: THREE.GridHelper;
    private _gridObject!: SDData;
    private _groundPlane!: THREE.Mesh;
    private _groundPlaneShadow!: THREE.Mesh;
    private _groundPlaneObject!: SDData;
    private _groundPlaneShadowObject!: SDData;
    private _groundPlaneColor: string = '#d3d3d3ff';
    private _groundPlaneShadowColor: string = '#000000ff';
    private _gridColor: string = '#44444426';

    private _initialized: boolean = false;

    // #endregion Properties (5)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        this._eventEngine.addListener(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, (e) => {
            this.updateEnvironmentGeometryPosition();
        })
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get gridColor(): string {
        return this._gridColor;
    } 
    
    public set gridColor(value: string) {
        this._gridColor = value;
        (<THREE.LineBasicMaterial>this._grid.material).opacity = this._gridColor.length <= 8 ? 0.15 : this._converter.toAlpha(this._gridColor);
        (<THREE.LineBasicMaterial>this._grid.material).transparent = (<THREE.LineBasicMaterial>this._grid.material).opacity !== 1;
        (<THREE.LineBasicMaterial>this._grid.material).color = new THREE.Color(this._converter.toThreeJsColorInput(this._gridColor));
        (<THREE.LineBasicMaterial>this._grid.material).needsUpdate = true;
    }

    public get groundPlaneColor(): string {
        return this._groundPlaneColor;
    } 
    
    public set groundPlaneColor(value: string) {
        this._groundPlaneColor = value;
        this.assignGroundPlaneColor(value);
    }

    public get groundPlaneShadowColor(): string {
        return this._groundPlaneShadowColor;
    } 
    
    public set groundPlaneShadowColor(value: string) {
        this._groundPlaneShadowColor = value;
        this.assignGroundPlaneShadowColor(value);
    }

    public get grid(): THREE.GridHelper {
        return this._grid;
    }

    public get groundPlane(): THREE.Mesh {
        return this._groundPlane;
    }

    public get groundPlaneShadow(): THREE.Mesh {
        return this._groundPlaneShadow;
    }

    // #endregion Public Accessors (2)

    // #region Public Methods (2)

    public assignGroundPlaneColor(color: string) {
        (<THREE.MeshPhysicalMaterial>this._groundPlane.material).opacity = this._converter.toAlpha(color);
        (<THREE.MeshPhysicalMaterial>this._groundPlane.material).transparent = (<THREE.MeshPhysicalMaterial>this._groundPlane.material).opacity !== 1;
        (<THREE.MeshPhysicalMaterial>this._groundPlane.material).depthWrite = !(<THREE.MeshPhysicalMaterial>this._groundPlane.material).transparent;
        (<THREE.MeshPhysicalMaterial>this._groundPlane.material).color = new THREE.Color(this._converter.toThreeJsColorInput(color));
        (<THREE.MeshPhysicalMaterial>this._groundPlane.material).needsUpdate = true;
    }    

    public assignGroundPlaneShadowColor(color: string) {
        (<THREE.ShadowMaterial>this._groundPlaneShadow.material).opacity = this._converter.toAlpha(color);
        (<THREE.ShadowMaterial>this._groundPlaneShadow.material).color = new THREE.Color(this._converter.toThreeJsColorInput(color));
        (<THREE.ShadowMaterial>this._groundPlaneShadow.material).needsUpdate = true;
    } 

    public changeSceneExtents(bb: IBox) {
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
        (<THREE.LineBasicMaterial>this._grid.material).opacity = this._gridColor.length <= 8 ? 0.15 : this._converter.toAlpha(this._gridColor);
        (<THREE.LineBasicMaterial>this._grid.material).transparent = (<THREE.LineBasicMaterial>this._grid.material).opacity !== 1;
        (<THREE.LineBasicMaterial>this._grid.material).color = new THREE.Color(this._converter.toThreeJsColorInput(this._gridColor));
        this._grid.rotateX(Math.PI / 2);
        this._grid.visible = this._renderingEngine.gridVisibility;
        this._gridObject.add(this._grid);

        this._groundPlane.geometry = new THREE.PlaneGeometry(2 * gridExtents, 2 * gridExtents, 2, 2);
        this._groundPlaneShadow.geometry = new THREE.PlaneGeometry(2 * gridExtents, 2 * gridExtents, 2, 2);

        let eps = 0.005;
        let bs = bb.boundingSphere;
        this._grid.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
        this._groundPlane.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
        this._groundPlaneShadow.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
    }

    public init(): void {
        this._environmentGeometryObject = new SDObject('environmentGeometry', '');
        this._renderingEngine.sceneTreeManager.scene.add(this._environmentGeometryObject);
        
        this._gridObject = new SDData('grid', '');
        this._grid = new THREE.GridHelper();
        (<THREE.LineBasicMaterial>this._grid.material).opacity = this._gridColor.length <= 8 ? 0.15 : this._converter.toAlpha(this._gridColor);
        (<THREE.LineBasicMaterial>this._grid.material).transparent = (<THREE.LineBasicMaterial>this._grid.material).opacity !== 1;
        (<THREE.LineBasicMaterial>this._grid.material).color = new THREE.Color(this._converter.toThreeJsColorInput(this._gridColor));
        this._grid.rotateX(Math.PI / 2);
        this._grid.visible = this._renderingEngine.gridVisibility;
        this._gridObject.add(this._grid);
        this._gridObject.userData.ambientOcclusion = false;
        this._environmentGeometryObject.add(this._gridObject);

        this._groundPlaneObject = new SDData('groundPlane', '');
        let mat = new MaterialStandardData();
        mat.color = this._groundPlaneColor;
        mat.side = MATERIAL_SIDE.FRONT;
        mat.opacity = this._converter.toAlpha(this._groundPlaneColor);        
        mat.roughness = 1;
        mat.metalness = 0;
        this._groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(), this._renderingEngine.materialLoader.load(mat));
        this._groundPlane.receiveShadow = true;
        this._groundPlane.visible = this._renderingEngine.groundPlaneVisibility;
        this._groundPlaneObject.add(this._groundPlane);
        this._groundPlaneObject.userData.ambientOcclusion = false;
        this._environmentGeometryObject.add(this._groundPlaneObject);

        this._groundPlaneShadowObject = new SDData('groundPlaneShadow', '');
        let matShadow = new MaterialShadowData();
        matShadow.color = this._groundPlaneShadowColor;
        matShadow.opacity = this._converter.toAlpha(this._groundPlaneShadowColor);
        this._groundPlaneShadow = new THREE.Mesh(new THREE.PlaneGeometry(), this._renderingEngine.materialLoader.load(matShadow));
        this._groundPlaneShadow.receiveShadow = true;
        this._groundPlaneShadow.visible = this._renderingEngine.groundPlaneShadowVisibility;
        this._groundPlaneShadowObject.add(this._groundPlaneShadow);
        this._groundPlaneShadowObject.userData.ambientOcclusion = false;
        this._environmentGeometryObject.add(this._groundPlaneShadowObject);

        let eps = 0.005;
        this._grid.position.set(0, 0, -eps);
        this._groundPlane.position.set(0, 0, -eps);
        this._groundPlaneShadow.position.set(0, 0, -eps);
    }

    public updateEnvironmentGeometryPosition(): void {
        const bb = new Box(this._renderingEngine.sceneTreeManager.boundingBox.min, this._renderingEngine.sceneTreeManager.boundingBox.max);
        if (((bb.min[0] === 0 && bb.min[1] === 0 && bb.min[2] === 0) && (bb.max[0] === 0 && bb.max[1] === 0 && bb.max[2] === 0)) || bb.isEmpty()) return;

        if(!this._initialized) {
            this.changeSceneExtents(bb)
        } else {
            let eps = 0.005;
            let bs = bb.boundingSphere;
            if(this._grid) this._grid.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
            if(this._groundPlane) this._groundPlane.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
            if(this._groundPlaneShadow) this._groundPlaneShadow.position.set(bs.center[0], bs.center[1], bb.min[2] - eps);
        }
    }

    // #endregion Public Methods (2)
}