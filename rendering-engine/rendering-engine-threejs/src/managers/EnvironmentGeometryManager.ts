import { vec3 } from 'gl-matrix';
import { Box, IBox } from '@shapediver/viewer.shared.math';
import { Converter, EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services';

import { RenderingEngine } from '..';
import { SDObject } from '../objects/SDObject';
import { IManager } from '@shapediver/viewer.rendering-engine.rendering-engine';
import { Grid } from './environmentGeometry/Grid';
import { GroundPlaneShadow } from './environmentGeometry/GroundPlaneShadow';
import { GroundPlane } from './environmentGeometry/GroundPlane';
import { ContactShadow } from './environmentGeometry/ContactShadow';

export class EnvironmentGeometryManager implements IManager {
    // #region Properties (9)

    private readonly _converter: Converter = Converter.instance;
    private readonly _eventEngine: EventEngine = EventEngine.instance;

    private _contactShadow?: ContactShadow;
    private _environmentGeometryObject!: SDObject;
    private _grid?: Grid;
    private _groundPlane?: GroundPlane;
    private _groundPlaneShadow?: GroundPlaneShadow;
    private _initialized: boolean = false;

    // #endregion Properties (9)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        this._eventEngine.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, () => {
            this.updateEnvironmentGeometryPosition();
        });
    }

    // #endregion Constructors (1)

    // #region Public Getters And Setters (5)

    public get contactShadow(): ContactShadow {
        return this._contactShadow!;
    }

    public get grid(): Grid {
        return this._grid!;
    }

    public get groundPlane(): GroundPlane {
        return this._groundPlane!;
    }

    public get groundPlaneShadow(): GroundPlaneShadow {
        return this._groundPlaneShadow!;
    }

    // #endregion Public Getters And Setters (5)

    // #region Public Methods (3)

    public changeSceneExtents(bb: IBox) {
        if (((bb.min[0] === 0 && bb.min[1] === 0 && bb.min[2] === 0) && (bb.max[0] === 0 && bb.max[1] === 0 && bb.max[2] === 0)) || bb.isEmpty()) return;

        this._initialized = true;
        const sceneExtents = vec3.distance(bb.min, bb.max);
        const { divisions, gridExtents } = this.evaluateGridMeasurements(sceneExtents);
        const bs = bb.boundingSphere;
        const position = vec3.fromValues(bs.center[0], bs.center[1], bb.min[2]);
        const eps = bb.boundingSphere.radius * 0.001;

        this._grid?.changeSceneExtents(vec3.sub(vec3.create(), position, vec3.fromValues(0, 0, eps)), divisions, gridExtents);
        this._groundPlaneShadow?.changeSceneExtents(vec3.sub(vec3.create(), position, vec3.fromValues(0, 0, eps * 3)), divisions, gridExtents);
        this._contactShadow?.changeSceneExtents(vec3.sub(vec3.create(), position, vec3.fromValues(0, 0, eps * 2)), divisions, gridExtents);
        this._groundPlane?.changeSceneExtents(vec3.sub(vec3.create(), position, vec3.fromValues(0, 0, eps * 4)), divisions, gridExtents);
    }

    public init(): void {
        this._environmentGeometryObject = new SDObject('environmentGeometry', '');
        this._renderingEngine.sceneTreeManager.scene.add(this._environmentGeometryObject);

        this._contactShadow = new ContactShadow(this._renderingEngine, this._environmentGeometryObject);
        this._grid = new Grid(this._renderingEngine, this._environmentGeometryObject);
        this._groundPlaneShadow = new GroundPlaneShadow(this._renderingEngine, this._environmentGeometryObject);
        this._groundPlane = new GroundPlane(this._renderingEngine, this._environmentGeometryObject);
    }

    public updateEnvironmentGeometryPosition(): void {
        const bb = new Box(this._renderingEngine.sceneTreeManager.boundingBox.min, this._renderingEngine.sceneTreeManager.boundingBox.max);
        if (((bb.min[0] === 0 && bb.min[1] === 0 && bb.min[2] === 0) && (bb.max[0] === 0 && bb.max[1] === 0 && bb.max[2] === 0)) || bb.isEmpty()) return;

        if (!this._initialized) {
            this.changeSceneExtents(bb);
        } else {
            const bs = bb.boundingSphere;
            const eps = bb.boundingSphere.radius * 0.001;

            const sceneExtents = vec3.distance(bb.min, bb.max);
            const { divisions, gridExtents } = this.evaluateGridMeasurements(sceneExtents);
            // only shadow plane needs to be updated
            const position = vec3.fromValues(bs.center[0], bs.center[1], bb.min[2]);
            this._grid?.updatePosition(vec3.sub(vec3.create(), position, vec3.fromValues(0, 0, eps)));
            this._contactShadow?.changeSceneExtents(vec3.sub(vec3.create(), position, vec3.fromValues(0, 0, eps * 3)), divisions, gridExtents);
            this._groundPlaneShadow?.changeSceneExtents(vec3.sub(vec3.create(), position, vec3.fromValues(0, 0, eps * 2)), divisions, gridExtents);
            this._groundPlane?.updatePosition(vec3.sub(vec3.create(), position, vec3.fromValues(0, 0, eps * 4)));
        }
    }

    // #endregion Public Methods (3)

    // #region Private Methods (1)

    /**
     * Creates the grid extents and divisions with the specified scene extents.
     * 
     * https://shapediver.atlassian.net/browse/SS-2961 evaluate this magic.
     */
    private evaluateGridMeasurements(sceneExtents: number) {
        let divisions = 0.1;
        let gridExtents = 1.0;
        if (sceneExtents > 1) {
            const tmp = Math.floor(sceneExtents).toString();
            let temp = Math.pow(10, tmp.length - 1);
            gridExtents = Math.max(Math.ceil(sceneExtents / temp) * temp, 1);
            temp = temp / 10;
            divisions = gridExtents / temp;
        }
        else if (sceneExtents !== 0) {
            const zeros = 1 - Math.floor(Math.log(sceneExtents) / Math.log(10)) - 2;
            const r = sceneExtents.toFixed(zeros + 1);
            const firstDigit = parseInt(r.substr(r.length - 1)) + 1;
            let gridExtentsS = '0.';
            for (let i = 0; i < zeros; ++i)
                gridExtentsS = gridExtentsS + '0';
            gridExtents = parseFloat(gridExtentsS + firstDigit);
            divisions = firstDigit * 10;
        }

        return { divisions, gridExtents };
    }

    // #endregion Private Methods (1)
}