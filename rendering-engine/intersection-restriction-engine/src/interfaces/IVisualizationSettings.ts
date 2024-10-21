import { IMaterialBasicLineDataProperties, IMaterialMultiPointDataProperties } from '@shapediver/viewer.shared.types';

export interface IVisualizationSettings {
    // #region Properties (5)

    /**
     * If the distance labels are shown.
     * The distance labels display the distance between the points.
     * 
     * @default true
     */
    distanceLabels: boolean,
    /**
     * The multiplication factor of the point size when interactions are performed.
     * If the factor is set to 2, the point size is doubled when interacting.
     * 
     * @default 2
     */
    distanceMultiplicationFactor: number,
    /**
     * The material properties of the lines.
     */
    lines: IMaterialBasicLineDataProperties
    /**
     * If the point labels are shown.
     * The point labels display the position of the points.
     * 
     * @default false
     */
    pointLabels: boolean,
    /**
     * The material properties of the points.
     */
    points: IMaterialMultiPointDataProperties,

    // #endregion Properties (5)
}
