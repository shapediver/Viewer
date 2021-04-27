import { ICameraInterpolation } from "../interface/ICameraInterpolation";
import { ICameraControls } from "../interface/ICameraControls";
import * as TWEEN from "@tweenjs/tween.js";
import { CameraMultipleInterpolation } from "./interpolationMethods/CameraMultipleInterpolation";
import { CameraSphericalInterpolation } from "./interpolationMethods/CameraSphericalInterpolation";
import { vec3 } from "gl-matrix";
import { ICameraControlsUsage } from "../interface/ICameraControlsUsage";
import { ICamera } from "../../engine/interface/ICamera";
import { CameraLinearInterpolation } from "./interpolationMethods/CameraLinearInterpolation";

export class CameraInterpolationManager {
    // #region Properties (3)


    private TweenWrapper = class {
        private _properties: { delta: 0 } = { delta: 0 };
        private _tween!: TWEEN.Tween<{  delta: number }>;
        private _resolve!: Function;

        constructor(options: {default: boolean, duration: number, easing: (amount: number) => number, coordinates: string, interpolation: Function }, cb: ICameraInterpolation, onComplete: Function) {
            this._tween = new TWEEN.Tween(this._properties);
            this._tween.easing(options.easing);            
            this._tween.to({ delta: 1.0 }, options.duration);

            this._tween.onUpdate((v) => {
                cb.onUpdate(v);
            });
            
            this._tween.onStop((v) => {
                if(cb.onStop) cb.onStop(v);
                this._resolve(true);
            });
            this._tween.onComplete((v) => {
                if(cb.onComplete) cb.onComplete(v);
                onComplete();
                this._resolve(true);
            });
        }

        public start(): Promise<boolean> {
            return new Promise((resolve) => {
                this._resolve = resolve;
                this._tween.start();
            });
        }

        public stop(): void {
            this._tween.stop();
        }
    };
    private _tween: any;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(
        private readonly _camera: ICamera,
        private readonly _cameraControls: ICameraControlsUsage
        ) {
    }

    // #endregion Constructors (1)

    // #region Public Methods (3)

    public active(): boolean {
        return this._tween ? true : false;
    }
    /**
     * cameraTween
     */
    public interpolate(path: { position: vec3, target: vec3 }[], options: { easing?: string | Function; duration?: number; default?: boolean; coordinates?: string; interpolation?: string | Function; } = {}) : Promise<boolean> 
    {

        const newPath: { position: vec3, target: vec3 }[] = [];
        for(let i = 0; i < path.length; i++)
            newPath.push({
                position: path[i].position,
                target: path[i].target,
            });
                

        if(this._tween) {
            this._tween.stop();
            this._tween = null;
        }
        let parsedOptions = this.optionsParser(options);
        
        this._tween = new this.TweenWrapper(
            parsedOptions, 
            newPath.length === 2 ? 
                this.getCameraInterpolation(newPath[0], newPath[1], parsedOptions.coordinates) :
                new CameraMultipleInterpolation(this._camera, this._cameraControls, newPath, parsedOptions.interpolation), 
            () => { this._tween = null; }
        );
        return this._tween.start();
    }

    public stop(): void {
        if(this._tween) this._tween.stop();
        this._tween = null;
    }

    // #endregion Public Methods (3)

    // #region Private Methods (2)

    private getCameraInterpolation(from: { position: vec3, target: vec3 }, to: { position: vec3, target: vec3 }, type: string) {
        switch(type) {
            case 'linear':
                return new CameraLinearInterpolation(this._camera, this._cameraControls, from, to);
            case 'spherical':
                return new CameraSphericalInterpolation(this._camera, this._cameraControls, from, to);
            case 'cylindrical':
                return new CameraSphericalInterpolation(this._camera, this._cameraControls, from, to);
            default:
                return new CameraMultipleInterpolation(this._camera, this._cameraControls, [from, to], TWEEN.Interpolation.CatmullRom);
        }
    }

    private optionsParser(options: { default?: boolean, duration?: number, easing?: string|Function, coordinates?: string, interpolation?: string|Function} ): {default: boolean, duration: number, easing: (amount: number) => number, coordinates: string, interpolation: Function }
    {

        return {
            default: options.default || false,
            duration: options.duration && options.duration >= 0 ? options.duration : 0,
            easing: TWEEN.Easing.Quartic.InOut,// TODO typeof options.easing === 'string' ? Easing[<typeof Easing>options.easing] TWEEN.Easing.Quartic.InOut : typeof options.easing === 'function' ? options.easing : TWEEN.Easing.Quartic.InOut,
            coordinates: options.coordinates !== 'spherical' && options.coordinates !== 'linear' && options.coordinates !== 'cylindrical' ? 'cylindrical' : options.coordinates, 
            interpolation: TWEEN.Interpolation.CatmullRom// TODO this._globalUtils.typeCheck(options.interpolation, 'string') ? this._globalUtils.getAtPath(TWEEN.Interpolation, options.interpolation) || TWEEN.Interpolation.CatmullRom : typeof options.interpolation === 'function' ? options.interpolation : TWEEN.Interpolation.CatmullRom
        };
    }

    // #endregion Private Methods (2)
}