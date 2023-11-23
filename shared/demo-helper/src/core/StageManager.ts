export interface IStageData {
    stageManager: StageManager,
    goForwardDiv: HTMLDivElement,
    goBackwardDiv: HTMLDivElement
}

export class Stage {
    public name: string;
    public icon: HTMLImageElement;
    public onStartCallback: (data: IStageData) => Promise<void>;
    public onEndCallback: (data: IStageData) => Promise<void>;
    public onRevertCallback: (data: IStageData) => Promise<void>;

    constructor(name: string, icon: string, onStartCallback: (data: IStageData) => Promise<void>, onEndCallback: (data: IStageData) => Promise<void>, onRevertCallback: (data: IStageData) => Promise<void>) {
        this.name = name;
        this.icon = new Image(100, 100);
        this.icon.src = icon;

        this.onStartCallback = onStartCallback;
        this.onEndCallback = onEndCallback;
        this.onRevertCallback = onRevertCallback;
    }

    async onStart(data: IStageData) {
        await this.onStartCallback(data)
    }

    async onEnd(data: IStageData) {
        await this.onEndCallback(data)
    }

    async onRevert(data: IStageData) {
        await this.onRevertCallback(data)
    }
}

export class StageManager {
    public stages: Stage[] = [];
    public currentStage: number = 0;
    public stagesDiv: HTMLDivElement;

    public stageData: IStageData;

    constructor(stages: Stage[], stagesDiv: HTMLDivElement) {
        this.stages = stages;
        this.stagesDiv = stagesDiv;

        const goForwardDiv = document.createElement('div');
        goForwardDiv.style.position = "absolute";
        goForwardDiv.style.right = "0%";
        goForwardDiv.style.bottom = "0%";

        const goForwardImg = new Image(150, 150)
        goForwardImg.src = "https://shapediverviewer.s3.amazonaws.com/v3/graphics/arrow-right-circle-outline.svg";
        goForwardImg.onclick = () => { this.goForward(); };
        goForwardDiv.appendChild(goForwardImg);

        const goBackwardDiv = document.createElement('div');
        goBackwardDiv.style.position = "absolute";
        goBackwardDiv.style.left = "0%";
        goBackwardDiv.style.bottom = "0%";

        const goBackwardImg = new Image(150, 150)
        goBackwardImg.src = "https://shapediverviewer.s3.amazonaws.com/v3/graphics/arrow-left-circle-outline.svg";
        goBackwardImg.onclick = () => { this.goBackward(); };
        goBackwardDiv.appendChild(goBackwardImg);

        this.stageData = {
            stageManager: this,
            goForwardDiv,
            goBackwardDiv
        }
    }

    async start() {
        if (this.stages.length === 0) return;

        const arrowImage = new Image(50, 50);
        arrowImage.src = "https://shapediverviewer.s3.amazonaws.com/v3/graphics/arrow-right-thin.svg";
        for (let i = 0; i < this.stages.length; i++) {
            this.stagesDiv!.appendChild(this.stages[i].icon);
            this.stages[i].icon.style.border = "thick solid #00000000";
            this.stages[i].icon.style.borderRadius = "10px";
            if (i !== this.stages.length - 1) 
                this.stagesDiv!.appendChild(arrowImage.cloneNode(true));
        }
        
        const mainDiv = document.getElementById('main-div');
        mainDiv?.appendChild(this.stageData.goForwardDiv)
        mainDiv?.appendChild(this.stageData.goBackwardDiv)
        
        await this.startStage(this.currentStage);
    }

    async goForward() {
        await this.endStage(this.currentStage);
        if (this.stages[this.currentStage + 1])
            await this.startStage(this.currentStage + 1)
        this.currentStage++;
    }

    async goBackward() {
        await this.revertStage(this.currentStage);

        if (this.stages[this.currentStage - 1])
            await this.startStage(this.currentStage - 1)
        this.currentStage--;
    }

    async startStage(index: number) {
        this.stages[index].icon.style.border = "thick solid #f00";
        await this.stages[index].onStart(this.stageData);
    }

    async endStage(index: number) {
        this.stages[index].icon.style.border = "thick solid #00000000";
        await this.stages[index].onEnd(this.stageData);
    }

    async revertStage(index: number) {
        this.stages[index].icon.style.border = "thick solid #00000000";
        await this.stages[index].onRevert(this.stageData);
    }
}