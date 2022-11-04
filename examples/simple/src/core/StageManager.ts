import {
  HTMLElementAnchorCustomData,
  ISessionApi,
  ITreeNode,
  IViewportApi,
  sceneTree,
  TreeNode,
  viewports
} from "@shapediver/viewer";
import { DragManager } from "@shapediver/viewer.features.interaction";
import { UILayout } from "../interfaces/parameterDefinitions";
import { mat4 } from "gl-matrix";

/**
 * This is the data that is provided to the callbacks of every stage.
 * The data can be adjusted on each stage.
 *
 * As can be seen in the documentation below, the stage that provides the property is mentioned.
 * If no stage is mentioned, than the properties are provided from the start.
 */
export interface IStageData {
  stageManager: StageManager;
  viewport: IViewportApi;
  session: ISessionApi;
  uiData: UILayout;
  forwardDiv: HTMLDivElement;
  backwardDiv: HTMLDivElement;
  interactionParentNode: ITreeNode;

  // set in Stage 1
  boatNode?: ITreeNode;

  // set in Stage 2
  boatTransformationMatrix: mat4;

  // set in Stage 3
  dragManager?: DragManager;

  // set in Stage 3
  topNodeAnchorData?: HTMLElementAnchorCustomData;
  // set in Stage 3
  topNode?: ITreeNode;
  // set in Stage 3
  topNodeAnchorDataMirrored?: HTMLElementAnchorCustomData;
  // set in Stage 3
  topNodeMirrored?: ITreeNode;
  // set in Stage 3
  bottomNodeAnchorData?: HTMLElementAnchorCustomData;
  // set in Stage 3
  bottomNode?: ITreeNode;
  // set in Stage 3
  bottomNodeAnchorDataMirrored?: HTMLElementAnchorCustomData;
  // set in Stage 3
  bottomNodeMirrored?: ITreeNode;

  // set in Stage 4
  topControlNodeAnchorData?: HTMLElementAnchorCustomData;
  // set in Stage 3
  topControlNode?: ITreeNode;
  // set in Stage 4
  sideControlNodeAnchorData?: HTMLElementAnchorCustomData;
  // set in Stage 3
  sideControlNode?: ITreeNode;
  // set in Stage 4
  sideControlNodeAnchorDataMirrored?: HTMLElementAnchorCustomData;
  // set in Stage 3
  sideControlNodeMirrored?: ITreeNode;
  // set in Stage 4
  bottomControlNodeAnchorData?: HTMLElementAnchorCustomData;
  // set in Stage 3
  bottomControlNode?: ITreeNode;
}

/**
 * A Stage is defined by it's name and icon.
 *
 * When the stage starts, the onStart callback is called.
 * When the stage ends, the onEnd callback is called.
 */
export class Stage {
  // #region Properties (4)

  public icon: HTMLImageElement;
  public name: string;
  public onEndCallback: (data: IStageData) => Promise<void>;
  public onStartCallback: (
    data: IStageData,
    backwards: boolean
  ) => Promise<void>;
  public onResetCallback: (data: IStageData) => Promise<void>;

  // #endregion Properties (4)

  // #region Constructors (1)

  constructor(
    name: string,
    icon: string,
    onStartCallback: (data: IStageData, backwards: boolean) => Promise<void>,
    onEndCallback: (data: IStageData) => Promise<void>,
    onResetCallback: (data: IStageData) => Promise<void>
  ) {
    this.name = name;

    // NOTE UI: This loads the icon. See the StageManager below for how the icon is added.
    this.icon = new Image(100, 100);
    this.icon.src = icon;

    this.onStartCallback = onStartCallback;
    this.onEndCallback = onEndCallback;
    this.onResetCallback = onResetCallback;
  }

  // #endregion Constructors (1)

  // #region Public Methods (2)

  public async onEnd(data: IStageData) {
    await this.onEndCallback(data);
  }

  public async onStart(data: IStageData, backwards: boolean) {
    await this.onStartCallback(data, backwards);
  }

  public async onReset(data: IStageData) {
    await this.onResetCallback(data);
  }

  // #endregion Public Methods (2)
}

/**
 * The StageManager is responsibly for handling the stages.
 * When calling continue, the current stage ends and the new one starts.
 */
export class StageManager {
  // #region Properties (6)

  public currentStageIndex: number = 0;
  public session: ISessionApi;
  public stageData: IStageData;
  public stages: Stage[] = [];
  public stagesDiv: HTMLDivElement;
  public viewport: IViewportApi;

  // #endregion Properties (6)

  // #region Constructors (1)

  constructor(
    stages: Stage[],
    stagesDiv: HTMLDivElement,
    viewport: IViewportApi,
    session: ISessionApi
  ) {
    this.stages = stages;
    this.stagesDiv = stagesDiv;
    this.viewport = viewport;
    this.session = session;

    // NOTE UI: Here we create the div and image for the forward button.
    const forwardDiv = document.createElement("div");
    forwardDiv.style.position = "absolute";
    forwardDiv.style.right = "0%";
    forwardDiv.style.bottom = "0%";

    const forwardImg = new Image(100, 100);
    forwardImg.src =
      "./icons/arrow-right-circle-outline.svg";
    forwardImg.onclick = () => {
      this.goForward();
    };
    forwardDiv.appendChild(forwardImg);

    // NOTE UI: Here we create the div and image for the backward button.
    const backwardDiv = document.createElement("div");
    backwardDiv.style.position = "absolute";
    backwardDiv.style.right = "100px";
    backwardDiv.style.bottom = "0%";

    const backwardImg = new Image(100, 100);
    backwardImg.src =
      "./icons/arrow-left-circle-outline.svg";
    backwardImg.onclick = () => {
      this.goBackward();
    };
    backwardDiv.appendChild(backwardImg);

    // create a node that is used to store interaction nodes
    const interactionParentNode = new TreeNode();
    sceneTree.root.addChild(interactionParentNode);

    sceneTree.root.updateVersion();
    viewport.update();

    this.stageData = {
      stageManager: this,
      viewport,
      session,
      uiData: session.getOutputByName("uiLayout")[0]
        ? session.getOutputByName("uiLayout")[0].content![0].data
        : [],
      forwardDiv,
      backwardDiv,
      interactionParentNode,
      boatTransformationMatrix: mat4.create()
    };
  }

  // #endregion Constructors (1)

  // #region Public Methods (2)

  /**
   * The forward functions ends the current stage and starts the next one (if available).
   */
  public async goForward() {
    await this.endStage(this.currentStageIndex);
    if (this.stages[this.currentStageIndex + 1])
      await this.startStage(this.currentStageIndex + 1);
    this.currentStageIndex++;
  }
  /**
   * The backward functions ends the current stage and starts the next one (if available).
   */
  public async goBackward() {
    await this.resetStage(this.currentStageIndex);
    if (this.stages[this.currentStageIndex - 1])
      await this.startStage(this.currentStageIndex - 1, true);
    this.currentStageIndex--;
  }

  /**
   * When the StageManager starts, the icons and arrows inbetween are created.
   *
   * It then starts the first stage.
   */
  public async start() {
    if (this.stages.length === 0) return;

    // NOTE UI: Here we add all the icons of the stages and the arrows inbetween.
    // The border of the icons will be changed when the stage is active.
    // The icons of the stages have no further purpose than visualization.
    const arrowImage = new Image(50, 50);
    arrowImage.src = "./icons/arrow-right-thin.svg";
    for (let i = 0; i < this.stages.length; i++) {
      this.stagesDiv!.appendChild(this.stages[i].icon);
      this.stages[i].icon.style.border = "thick solid #00000000";
      this.stages[i].icon.style.borderRadius = "10px";
      if (i !== this.stages.length - 1)
        this.stagesDiv!.appendChild(arrowImage.cloneNode(true));
    }

    this.startStage(this.currentStageIndex);
  }

  // #endregion Public Methods (2)

  // #region Private Methods (2)

  /**
   * End the stage with the specified index.
   *
   * @param index
   */
  private async endStage(index: number) {
    this.stages[index].icon.style.border = "thick solid #00000000";
    await this.stages[index].onEnd(this.stageData);
  }

  /**
   * Start the stage with the specified index.
   *
   * @param index
   */
  private async startStage(index: number, backwards = false) {
    this.stages[index].icon.style.border = "thick solid #000";
    await this.stages[index].onStart(this.stageData, backwards);
  }

  /**
   * Reset the stage with the specified index.
   *
   * @param index
   */
  private async resetStage(index: number) {
    this.stages[index].icon.style.border = "thick solid #00000000";
    await this.stages[index].onReset(this.stageData);
  }

  // #endregion Private Methods (2)
}
