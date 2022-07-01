import * as TWEEN from '@tweenjs/tween.js'
import { vec3 } from 'gl-matrix'

import { CameraMultipleInterpolation } from './interpolationMethods/CameraMultipleInterpolation'
import { CameraSphericalInterpolation } from './interpolationMethods/CameraSphericalInterpolation'
import { ICameraControlsUsage } from '../../interfaces/controls/ICameraControlsUsage'
import { ICamera, ICameraOptions } from '../../interfaces/camera/ICamera'
import { CameraLinearInterpolation } from './interpolationMethods/CameraLinearInterpolation'
import { CameraCylindricalInterpolation } from './interpolationMethods/CameraCylindricalInterpolation'
import { ICameraInterpolation } from '../../interfaces/interpolation/ICameraInterpolation'

export class CameraInterpolationManager {
    // #region Properties (3)


    private TweenWrapper = class {
        private _properties: { delta: 0 } = { delta: 0 };
        private _tween!: TWEEN.Tween<{  delta: number }>;
        private _resolve!: Function;

        constructor(options: {duration: number, easing: (amount: number) => number, coordinates: string, interpolation: Function }, cb: ICameraInterpolation, onComplete: Function) {
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
    public interpolate(path: { position: vec3, target: vec3 }[], options: ICameraOptions = {}) : Promise<boolean> 
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
                return new CameraCylindricalInterpolation(this._camera, this._cameraControls, from, to);
            default:
                return new CameraMultipleInterpolation(this._camera, this._cameraControls, [from, to], TWEEN.Interpolation.CatmullRom);
        }
    }

    private optionsParser(options: ICameraOptions): {duration: number, easing: (amount: number) => number, coordinates: string, interpolation: (v: number[], k: number) => number }
    {
        let easing = TWEEN.Easing.Quartic.InOut;
        if(typeof options.easing === 'string') {
            const keys = options.easing.split('.');
            const easingFamily = TWEEN.Easing[<keyof typeof TWEEN.Easing>keys[0]];
            if(easingFamily) {
                const easingFunction = easingFamily[<keyof typeof easingFamily>keys[1]];
                if(easingFunction) easing = easingFunction;
            }
        } else if(typeof options.easing === 'function') {
            easing = <(amount: number) => number>options.easing;
        }

        let interpolation = TWEEN.Interpolation.CatmullRom;
        if(typeof options.interpolation === 'string') {
            const interpolationFunction = TWEEN.Interpolation[<keyof typeof TWEEN.Interpolation>options.interpolation];
            if(interpolationFunction && interpolationFunction !== TWEEN.Interpolation.Utils) interpolation = <(v: number[], k: number) => number>interpolationFunction;
        } else if(typeof options.interpolation === 'function') {
            interpolation = <(v: number[], k: number) => number>options.interpolation;
        }

        return {
            duration: options.duration && options.duration >= 0 ? options.duration : 0,
            easing,
            coordinates: options.coordinates !== 'spherical' && options.coordinates !== 'linear' && options.coordinates !== 'cylindrical' ? 'cylindrical' : options.coordinates, 
            interpolation
        };
    }

    // #endregion Private Methods (2)
}