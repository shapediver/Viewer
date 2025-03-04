import { Box } from '@shapediver/viewer.shared.math';
import {
    EventEngine,
    EVENTTYPE,
    Logger,
    SESSION_SETTINGS_MODE,
    SettingsEngine,
    ShapeDiverViewerViewportError,
    StateEngine,
    UuidGenerator
} from '@shapediver/viewer.shared.services';
import { ICreationControlCenterViewport } from '../interfaces/ICreationControlCenterViewport';
import {
    ISceneEvent,
    ISessionEvent,
    ITaskEvent,
    IViewportSettingsSections,
    TASK_TYPE,
    ViewportCreationDefinition,
    VISIBILITY_MODE
} from '@shapediver/viewer.shared.types';
import { ISettings } from '@shapediver/viewer.settings';
import { ITree, Tree } from '@shapediver/viewer.shared.node-tree';
import { RenderingEngine as RenderingEngineThreeJs } from '@shapediver/viewer.rendering-engine.rendering-engine-threejs';
import { ViewportGlobalAccessObject } from './ViewportGlobalAccessObject';

export class CreationControlCenterViewport implements ICreationControlCenterViewport {
    readonly #eventEngine: EventEngine = EventEngine.instance;
    readonly #logger: Logger = Logger.instance;
    readonly #sceneTree: ITree = Tree.instance;
    readonly #stateEngine: StateEngine = StateEngine.instance;
    readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;

    private static _instance: CreationControlCenterViewport;

    public readonly viewportEngines: { [key: string]: RenderingEngineThreeJs } = {};

    public updateViewports?: (
        viewportEngines: { [key: string]: RenderingEngineThreeJs; },
    ) => void;

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    public applyViewportSettings(viewportId: string, settings: ISettings, sections: IViewportSettingsSections = { ar: false, scene: false, camera: false, light: false, environment: false, general: false }): Promise<void> {
        sections = sections || {};

        const settingsEngine: SettingsEngine = new SettingsEngine();
        settingsEngine.loadSettings(settings);

        const promises: Promise<unknown>[] = [];
        this.#stateEngine.viewportEngines[viewportId]?.settingsAssigned.reset();
        promises.push(new Promise<void>(resolve => {
            this.#stateEngine.viewportEngines[viewportId]?.settingsAssigned.then(() => {
                resolve();
            });
        }));

        this.viewportEngines[viewportId].applySettings(sections, settingsEngine);
        return new Promise(resolve => Promise.all(promises).then(() => resolve()));
    }

    public async closeViewportEngine(id: string): Promise<void> {
        if (!this.viewportEngines[id]) return;

        this.#logger.debugLow(`CreationControlCenter.closeViewportEngine: Closing viewport ${id}.`);
        if (this.#stateEngine.viewportEngines[id]?.initialized.resolved === false)
            await new Promise<void>(resolve => { this.#stateEngine.viewportEngines[id]?.initialized.then(() => resolve()); });

        this.#stateEngine.viewportEngines[id]?.settingsAssigned.reset();
        this.#stateEngine.viewportEngines[id]?.environmentMapLoaded.reset();
        this.#stateEngine.viewportEngines[id]?.initialized.reset();

        await this.viewportEngines[id].close();

        (<unknown>this.viewportEngines[id]) = undefined;
        delete this.viewportEngines[id];
        delete this.#stateEngine.viewportEngines[id];

        this.#logger.debug('CreationControlCenter.closeViewportEngine: Viewport closed.');
        if (this.updateViewports) this.updateViewports(this.viewportEngines);

        this.#eventEngine.emitEvent(EVENTTYPE.VIEWPORT.VIEWPORT_CLOSED, { viewportId: id });
    }

    public async createViewportEngine(properties: ViewportCreationDefinition): Promise<RenderingEngineThreeJs> {
        const eventId = this.#uuidGenerator.create();
        const viewportEngineId = properties.id || this.#uuidGenerator.create();
        properties.id = viewportEngineId;
        try {
            const eventStart: ITaskEvent = { type: TASK_TYPE.VIEWPORT_CREATION, id: eventId, progress: 0, status: 'Creating viewport', data: { viewportId: viewportEngineId } };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, eventStart);

            // check if the given id is valid
            if (this.viewportEngines[viewportEngineId]) {
                const eventClose: ITaskEvent = { type: TASK_TYPE.VIEWPORT_CREATION, id: eventId, progress: 0.1, status: 'Closing viewport with same id', data: { viewportId: viewportEngineId } };
                this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventClose);

                this.#logger.warn(`CreationControlCenter.createViewport: Viewer with this id (${viewportEngineId}) already exists. Closing initial instance.`);
                await this.closeViewportEngine(viewportEngineId);
            }

            const viewportEngine = new RenderingEngineThreeJs(properties);
            this.#stateEngine.viewportEngines[viewportEngineId] = new ViewportGlobalAccessObject(viewportEngine);
            this.viewportEngines[viewportEngineId] = viewportEngine;
            viewportEngine.start();

            viewportEngine.cameraEngine.createDefaultCameras();

            if (properties.sessionSettingsMode === SESSION_SETTINGS_MODE.MANUAL) {
                if (!properties.sessionSettingsId)
                    throw new ShapeDiverViewerViewportError('Session with sessionSettingsMode MANUAL needs to have a sessionSettingsId.');
                const sessionSettingsId = properties.sessionSettingsId;
                if (this.#stateEngine.sessionEngines[sessionSettingsId]) {
                    await this.assignSettings(viewportEngine.id, sessionSettingsId, true);
                } else {
                    // in createSession
                }
            } else if (properties.sessionSettingsMode === SESSION_SETTINGS_MODE.FIRST) {
                const firstSessionEngine = Object.values(this.#stateEngine.sessionEngines).find(sessionEngine => sessionEngine && sessionEngine.isFirstSession === true);
                if (firstSessionEngine) {
                    await this.assignSettings(viewportEngine.id, firstSessionEngine.id, true);
                } else {
                    // in createSession
                }
            }

            if (viewportEngine.sessionSettingsMode === SESSION_SETTINGS_MODE.NONE &&
                viewportEngine.visibility === VISIBILITY_MODE.SESSION) {
                viewportEngine.show = true;
            } else if (viewportEngine.visibility === VISIBILITY_MODE.INSTANT) {
                viewportEngine.show = true;
            } else if (viewportEngine.visibility === VISIBILITY_MODE.SESSION) {
                // wait for settings to load before showing the scene
                if (this.#sceneTree.root.boundingBox.isEmpty()) {
                    this.#eventEngine.addListener(EVENTTYPE.SCENE.SCENE_BOUNDING_BOX_CHANGE, (e) => {
                        const event = e as ISceneEvent;
                        if (event.viewportId === viewportEngine.id) {
                            const boundingBox = new Box(event.boundingBox!.min, event.boundingBox!.max);
                            if (boundingBox.isEmpty()) {
                                viewportEngine.show = false;
                            } else {
                                this.showAfterSettingsAssignment(viewportEngine, viewportEngineId);
                            }
                        }
                    }
                    );
                } else {
                    this.showAfterSettingsAssignment(viewportEngine, viewportEngineId);
                }
            } else if (viewportEngine.visibility === VISIBILITY_MODE.SESSIONS) {
                if (properties.visibilitySessionIds) {
                    const promises: Promise<void>[] = [];
                    // gather all session promises
                    // either they are resolved already or we wait for them to resolve
                    properties.visibilitySessionIds.forEach((sessionId) => {
                        if (this.#stateEngine.sessionEngines[sessionId] && this.#stateEngine.sessionEngines[sessionId]!.settingsRegistered.resolved === true) {
                            promises.push(Promise.resolve());
                        } else {
                            promises.push(new Promise<void>((resolve) => {
                                if (this.#stateEngine.sessionEngines[sessionId]) {
                                    // case where session has been created, but not yet initialized
                                    if (this.#stateEngine.sessionEngines[sessionId]!.settingsRegistered.resolved === false) {
                                        this.#stateEngine.sessionEngines[sessionId]!.settingsRegistered.then(() => { resolve(); });
                                    } else {
                                        resolve();
                                    }
                                } else {
                                    const sessionCreationListener = this.#eventEngine.addListener(EVENTTYPE.SESSION.SESSION_CREATED, (e) => {
                                        const event = e as ISessionEvent;
                                        if (event.sessionId === sessionId) {
                                            this.#eventEngine.removeListener(sessionCreationListener);
                                            resolve();
                                        }
                                    });
                                }
                            })
                            );
                        }
                    });

                    // wait for sessions to load before showing the scene
                    Promise.all(promises).then(() => {
                        this.showAfterSettingsAssignment(viewportEngine, viewportEngineId);
                    });
                } else {
                    viewportEngine.show = false;
                }
            }

            this.#stateEngine.viewportEngines[viewportEngineId]?.initialized.resolve(true);

            this.#logger.debug(`CreationControlCenter.createViewport: Viewport(${viewportEngineId}) created.`);

            const eventEnd: ITaskEvent = { type: TASK_TYPE.VIEWPORT_CREATION, id: eventId, progress: 1, status: 'Viewport created', data: { viewportId: viewportEngineId } };

            if (this.updateViewports) this.updateViewports(this.viewportEngines);

            this.#eventEngine.emitEvent(EVENTTYPE.VIEWPORT.VIEWPORT_CREATED, { viewportId: viewportEngineId });
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, eventEnd);
            return <RenderingEngineThreeJs>this.viewportEngines[viewportEngineId];
        } catch (e) {
            const eventCancel1: ITaskEvent = { type: TASK_TYPE.VIEWPORT_CREATION, id: eventId, progress: 0.9, status: 'Viewport created failed, closing viewport', data: { viewportId: viewportEngineId } };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_PROCESS, eventCancel1);

            try { await this.closeViewportEngine(viewportEngineId); } catch { /* empty */ }

            const eventCancel2: ITaskEvent = { type: TASK_TYPE.VIEWPORT_CREATION, id: eventId, progress: 1, status: 'Viewport created failed, exiting', data: { viewportId: viewportEngineId } };
            this.#eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, eventCancel2);

            throw e;
        }
    }

    public getViewportSettings(viewportId: string): ISettings {
        const viewportEngine = this.viewportEngines[viewportId];
        if (!viewportEngine)
            throw new ShapeDiverViewerViewportError('Viewport with id ' + viewportId + ' could not be found.');

        const settingsEngine: SettingsEngine = new SettingsEngine();
        viewportEngine.saveSettings(settingsEngine);
        return settingsEngine.settings;
    }

    private async assignSettings(viewportEngineId: string, sessionEngineId: string, updateViewports: boolean = false) {
        const viewportEngine = this.#stateEngine.viewportEngines[viewportEngineId];
        if (!viewportEngine) return;

        if (this.#stateEngine.sessionEngines[sessionEngineId] && this.#stateEngine.sessionEngines[sessionEngineId]!.initialized.resolved === true) {
            // immediate
            viewportEngine.assignSettingsEngine(this.#stateEngine.sessionEngines[sessionEngineId]!.settingsEngine);
            await viewportEngine.applySettings(undefined, undefined, updateViewports);
        } else {
            await new Promise<void>(resolve => {
                this.#stateEngine.sessionEngines[sessionEngineId]?.initialized.then(async () => {
                    if(this.#stateEngine.sessionEngines[sessionEngineId]) {
                        viewportEngine.assignSettingsEngine(this.#stateEngine.sessionEngines[sessionEngineId]!.settingsEngine);
                        await viewportEngine.applySettings(undefined, undefined, updateViewports);
                    }
                    resolve();
                });
            });
        }
    }

    private showAfterSettingsAssignment(viewportEngine: RenderingEngineThreeJs, viewportEngineId: string): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.#stateEngine.viewportEngines[viewportEngineId]?.settingsAssigned.resolved) {
                viewportEngine.show = true;
                resolve();
            } else {
                this.#stateEngine.viewportEngines[viewportEngineId]?.settingsAssigned.then(() => {
                    viewportEngine.show = true;
                    resolve();
                });
            }
        });
    }
}