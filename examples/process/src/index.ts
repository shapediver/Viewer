
import * as SDV from '@shapediver/viewer';
import { StageManager } from './core/StageManager';
import { stageAttributeVisualization } from './stages/StageAV';
import { stageLightControls } from './stages/StageLC';

(<any>window).SDV = SDV;

(async () => {
    const stageManager = new StageManager([
        stageAttributeVisualization,
        stageLightControls,
    ], <HTMLDivElement>document.getElementById('stages'));

    stageManager.start();
})();