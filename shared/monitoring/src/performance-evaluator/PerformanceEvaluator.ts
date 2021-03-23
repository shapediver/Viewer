import { singleton } from "tsyringe";

@singleton()
export class PerformanceEvaluator {

    private readonly _eval: {
        [key: string]: {
            start: number,
            pauses: {
                pause: number,
                continue?: number,
                duration?: number
            }[],
            end?: number,
            duration?: number,
        }
    } = {};

    /**
     * Start the evaluation with a specific id.
     * 
     * @param id 
     */
    public start(id: string, time?: number): void {
        this._eval[id] = {
            start: time || new Date().getTime(),
            pauses: []
        }
    }
    
    /**
     * Pause the evaluation for a specific id.
     * If already paused, it does nothing.
     * 
     * @param id 
     */
    public pause(id: string): void {
        if(!this._eval[id]) return;
        if(this._eval[id].end) return;

        if(this._eval[id].pauses.length === 0) {
            this._eval[id].pauses.push({
                pause: new Date().getTime()
            });
        } else if(this._eval[id].pauses[this._eval[id].pauses.length-1].continue) {
            this._eval[id].pauses.push({
                pause: new Date().getTime()
            });
        }
    }

    /**
     * Continue the evaluation for a specific id.
     * If already continued, it does nothing.
     * 
     * @param id 
     */
    public continue(id: string): void {
        if(!this._eval[id]) return;
        if(this._eval[id].pauses.length === 0) return;
        if(this._eval[id].end) return;
            
        const pause = this._eval[id].pauses[this._eval[id].pauses.length-1];
        if(!pause.continue) {
            pause.continue = new Date().getTime();
            pause.duration = pause.continue - pause.pause;
        }
    }

    /**
     * End the performance evaluation and calculate the duration.
     * 
     * @param id 
     */
    public end(id: string): void {
        if(!this._eval[id]) return;
        if(this._eval[id].end) return;

        this._eval[id].end = new Date().getTime();

        let pauseDuration = 0;
        for(let i = 0; i < this._eval[id].pauses.length; i++) {
            pauseDuration += this._eval[id].pauses[i].duration ? this._eval[id].pauses[i].duration! : this._eval[id].end! - this._eval[id].pauses[i].pause;
        }

        this._eval[id].duration = this._eval[id].end! - this._eval[id].start - pauseDuration;
    }

    /**
     * Get the evaluation data for a specific id.
     * 
     * @param id 
     */
    public getEvaluation(id: string): 
    {
        start: number,
        pauses: {
            pause: number,
            continue?: number,
            duration?: number
        }[],
        end?: number,
        duration?: number,
    } {
        return this._eval[id];
    }

    /**
     * Get the evaluation data for a specific id.
     * 
     * @param id 
     */
    public getEvaluationToString(id: string): string {
        const e = this._eval[id];
        return `Performance Evaluation for ${id}: ${e.duration}ms\n`;
    }
}