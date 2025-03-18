import { SDData } from '../../objects/SDData';
import * as THREE from 'three';
import { Color, MaterialShadowData } from '@shapediver/viewer.shared.types';
import { RenderingEngine } from '../..';
import { vec3 } from 'gl-matrix';
import { Converter } from '@shapediver/viewer.shared.services';
import { SDObject } from '../../objects/SDObject';
import { IEnvironmentGeometry } from './IEnvironmentGeometry';

export class GroundPlaneShadow implements IEnvironmentGeometry {
    // #region Properties (4)

    private readonly _converter: Converter = Converter.instance;

    private _color: Color = '#d3d3d3ff';
    private _groundPlaneShadow!: THREE.Mesh;
    private _groundPlaneShadowObject!: SDData;

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine, private readonly _parent: SDObject) {
        this._groundPlaneShadowObject = new SDData('groundPlaneShadow', '');
        const matShadow = new MaterialShadowData();
        matShadow.color = this._color;
        matShadow.opacity = this._converter.toAlpha(this._color);
        this._groundPlaneShadow = new THREE.Mesh(new THREE.PlaneGeometry(), this._renderingEngine.materialLoader.load(matShadow));
        this._groundPlaneShadow.receiveShadow = true;
        this._groundPlaneShadow.visible = false;
        this._groundPlaneShadowObject.add(this._groundPlaneShadow);
        this._groundPlaneShadowObject.userData.ambientOcclusion = false;
        this._parent.add(this._groundPlaneShadowObject);
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (4)

    public get color(): Color {
        return this._color;
    }

    public set color(value: Color) {
        this._color = value;
        this.assignGroundPlaneShadowColor(value);
    }

    public get visible(): boolean {
        return this._groundPlaneShadow.visible;
    }

    public set visible(value: boolean) {
        this._groundPlaneShadow.visible = value;
    }

    // #endregion Public Getters And Setters (4)

    // #region Public Methods (2)

    public changeSceneExtents(position: vec3, divisions: number, gridExtents: number): void {
        this._groundPlaneShadow.geometry = new THREE.PlaneGeometry(2 * gridExtents, 2 * gridExtents, 2, 2);
        this._groundPlaneShadow.position.set(position[0], position[1], position[2]);
    }

    public updatePosition(position: vec3): void {
        this._groundPlaneShadow.position.set(position[0], position[1], position[2]);
    }

    // #endregion Public Methods (2)

    // #region Private Methods (1)

    private assignGroundPlaneShadowColor(color: Color) {
        (<THREE.ShadowMaterial>this._groundPlaneShadow.material).opacity = this._converter.toAlpha(color);
        (<THREE.ShadowMaterial>this._groundPlaneShadow.material).color = this._renderingEngine.createThreeJsColor(color);
        (<THREE.ShadowMaterial>this._groundPlaneShadow.material).needsUpdate = true;
    }

    // #endregion Private Methods (1)
}