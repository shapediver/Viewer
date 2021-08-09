import { singleton } from 'tsyringe'

@singleton()
export class PerformanceEvaluator {

    private _eval: {
        start: number;
        section: {
            [key: string]: {
                start: number;
                end?: number;
                duration?: number;
            };
        };
        end?: number;
        duration?: number;
    } | undefined;

    /**
     * Start the evaluation with a specific id.
     * 
     * @param id 
     */
    public start(time?: number): void {
        this._eval = {
            start: time || performance.now(),
            section: {}
        }
    }

    /**
     * Start the evaluation of a section with a specific id.
     * 
     * @param id 
     */
    public startSection(sectionId: string, time?: number): void {
        if (!this._eval) return;
        if (this._eval.end) return;
        this._eval.section[sectionId] = {
            start: time || performance.now(),
        }
    }

    /**
     * End the performance evaluation of a section and calculate the duration.
     * 
     * @param id 
     */
    public endSection(sectionId: string): void {
        if (!this._eval) return;
        if (this._eval.end) return;
        if (!this._eval.section[sectionId]) return;
        if (this._eval.section[sectionId].end) return;

        this._eval.section[sectionId].end = performance.now();

        this._eval.section[sectionId].duration = this._eval.section[sectionId].end! - this._eval.section[sectionId].start;
    }

    /**
     * End the performance evaluation and calculate the duration.
     * 
     * @param id 
     */
    public end(): void {
        if (!this._eval) return;
        if (this._eval.end) return;

        this._eval.end = performance.now();
        this._eval.duration = this._eval.end! - this._eval.start;
    }

    /**
     * Get the evaluation data for a specific id.
     * 
     * @param id 
     */
    public getEvaluation(): {
        start: number,
        section: {
            [key: string]: {
                start: number,
                end?: number,
                duration?: number
            }
        },
        end?: number,
        duration?: number,
    } | undefined {
        return this._eval;
    }

    /**
     * Get the evaluation data for a specific id.
     * 
     * @param id 
     */
    public getEvaluationToString(): string {
        const e = this._eval;
        return `Performance Evaluation: ${e!.duration}ms\n`;
    }
}