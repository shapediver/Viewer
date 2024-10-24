import { z } from 'zod';
import { RestrictionDefinition } from './IRestrictionSettings';

// #region Interfaces (2)

export type DrawingParameterValue = {
    points: number[][]
};

/**
 * General properties of a drawing tools parameter.
 */
export interface IDrawingParameterSettings {
    // #region Properties (2)

    geometry?: {
        /**
         * The mode of the geometry.
         * 
         * If the mode is set to 'lines', the points are connected in the order they are defined.
         * If the mode is set to 'points', the points are not connected.
         * 
         * @default 'lines'
         */
        mode: 'points' | 'lines';

        /**
         * The minimum amount of points, if undefined, the geometry is not restricted.
         * This value is checked whenever the user tries to update or finish the drawing tool.
         * 
         * @default undefined
         */
        minPoints?: number;

        /**
         * The maximum amount of points, if undefined, the geometry is not restricted.
         * This value is checked whenever the user tries to update or finish the drawing tool.
         * 
         * @default undefined
         */
        maxPoints?: number;

        /**
         * If the mode is set to 'lines', if it is a closed line or not.
         * If the mode is set to 'points', this setting is ignored.
         * 
         * A line can be closed by connecting the last point with the first point.
         * 
         * @default true
         */
        close: boolean;

        /**
         * If the mode is set to 'lines', if the line is automatically closed.
         * If the mode is set to 'points', this setting is ignored.
         * 
         * The first and last point are always connected if the line is automatically closed.
         * 
         * @default true
         */
        autoClose: boolean;
    },
    restrictions?: RestrictionDefinition[]

    // #endregion Properties (2)
}

// #endregion Interfaces (2)

// #region Variables (2)

export const IDrawingParameterJsonSchema = z.object({
    geometry: z.object({
        mode: z.enum(['points', 'lines']),
        minPoints: z.number().optional(),
        maxPoints: z.number().optional(),
        strictMinMaxPoints: z.boolean().optional(),
        close: z.boolean(),
    }).optional(),
    restrictions: z.array(z.any()).optional()
});

export const validateDrawingParameterSettings = (param: unknown) => {
    return IDrawingParameterJsonSchema.safeParse(param);
};

// #endregion Variables (2)
