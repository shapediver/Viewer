import * as THREE from 'three'
import { Logger, LOGGING_TOPIC, EventEngine, EVENTTYPE, StateEngine, StatePromise, ShapeDiverViewerEnvironmentMapError, HttpClient, HttpResponse, Converter, UuidGenerator } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { RenderingEngine } from '..'
import { RGBELoader } from '../three/loaders/RGBELoader';
import { ILoader } from '../interfaces/ILoader'
import { ITaskEvent, TASK_TYPE } from '@shapediver/viewer.shared.types'

export enum ENVIRONMENT_MAP_CUBE {
    DEFAULT = 'default', 
    DEFAULT_BW = 'default_bw', 
    BLURRED_LIGHTS = 'blurred_lights', 
    GEORGENTOR = 'georgentor', 
    GEORGENTOR_BLUR = 'georgentor_blur', 
    GEORGENTOR_BLUE_BLUR = 'georgentor_blue_blur', 
    GEORGENTOR_BW_BLUR = 'georgentor_bw_blur', 
    LEVELSETS = 'levelsets', 
    LYTHWOOD_FIELD = 'lythwood_field', 
    MOUNTAINS = 'mountains', 
    OCEAN = 'ocean', 
    PIAZZA_SAN_MARCO = 'piazza_san_marco', 
    RESIDENTIAL_GARDEN = 'residential_garden', 
    ROOM_ABSTRACT_1 = 'room_abstract_1', 
    SKY = 'sky', 
    STORAGE_ROOM = 'storage_room', 
    STORM = 'storm', 
    SUBWAY_ENTRANCE = 'subway_entrance', 
    SUBWAY_ENTRANCE_BW_BLUR = 'subway_entrance_bw_blur', 
    WHITE = 'white', 
    YOKOHAMA = 'yokohama',
}

export enum ENVIRONMENT_MAP {
    ANNIVERSARY_LOUNGE = 'anniversary_lounge', 
    BALLROOM = 'ballroom', 
    CANNON_EXTERIOR = 'cannon_exterior', 
    CAPE_HILL = 'cape_hill', 
    CHRISTMAS_PHOTO_STUDIO = 'christmas_photo_studio', 
    CIRCUS_MAXIMUS = 'circus_maximus', 
    COLORFUL_STUDIO = 'colorful_studio', 
    COMBINATION_ROOM = 'combination_room', 
    GREEN_POINT_PARK = 'green_point_park', 
    HILLTOP_CONSTRUCTION = 'hilltop_construction', 
    LARGE_CORRIDOR = 'large_corridor', 
    LYTHWOOD_LOUNGE = 'lythwood_lounge', 
    NEUTRAL = 'neutral', 
    OBERER_KUHBERG = 'oberer_kuhberg', 
    OLD_HALL = 'old_hall', 
    PAUL_LOBE_HAUS = 'paul_lobe_haus', 
    PHOTO_STUDIO = 'photo_studio', 
    PHOTO_STUDIO_BROADWAY_HALL = 'photo_studio_broadway_hall', 
    SNOWY_FIELD = 'snowy_field', 
    STUDIO_SMALL = 'studio_small',
    SUNFLOWERS = 'sunflowers',
    TABLE_MOUNTAIN = 'table_mountain',
    VENICE_SUNSET = 'venice_sunset',
    WIDE_STREET = 'wide_street',
}

export enum ENVIRONMENT_MAP_TYPE {
    LDR = 'ldr',
    HDR = 'hdr',
    NONE = 'none'
}

export class EnvironmentMapLoader implements ILoader {
    // #region Properties (8)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _environmentMapFilenames = ['px', 'nx', 'pz', 'nz', 'py', 'ny']    
    private readonly _environmentMapHDR: string[] = [];
    private readonly _environmentMapNamesHDR = Object.values(ENVIRONMENT_MAP).filter(value => typeof value === 'string') as string[]
    private readonly _environmentMapNamesHDRKhronos = ['cannon_exterior', 'colorful_studio', 'neutral', 'wide_street'];
    private readonly _environmentMapNamesJPG = ['default', 'default_bw', 'blurred_lights', 'georgentor', 'georgentor_blur', 'georgentor_blue_blur', 'georgentor_bw_blur', 'levelsets', 'lythwood_field', 'mountains', 'ocean', 'piazza_san_marco', 'residential_garden', 'room_abstract_1', 'sky', 'storage_room', 'storm', 'subway_entrance', 'subway_entrance_bw_blur', 'white', 'yokohama'];
    private readonly _environmentMaps: {
        [key: string]: THREE.CubeTexture | THREE.Texture | null
    } = {};
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _stateEngine: StateEngine = <StateEngine>container.resolve(StateEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _httpClient: HttpClient = <HttpClient>container.resolve(HttpClient);
    private readonly _uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
    private _pmremGenerator!: THREE.PMREMGenerator;

    private _environmentMapName: string = 'none';
    private _environmentMapNameInternal: string = 'none';
    private _isHDRMap: boolean = false;
    private _textureEncoding: THREE.TextureEncoding = THREE.sRGBEncoding;
    private _type: ENVIRONMENT_MAP_TYPE = ENVIRONMENT_MAP_TYPE.NONE;

    // #endregion Properties (8)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {}

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get environmentMap(): THREE.CubeTexture | THREE.Texture | null {
        return this._environmentMaps[this._environmentMapName];
    }

    public get isHDRMap(): boolean {
        return this._isHDRMap;
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (2)

    public init(): void {
        this._environmentMaps['none'] = null;
            
        this._pmremGenerator = new THREE.PMREMGenerator(this._renderingEngine.renderer);
        this._pmremGenerator.compileEquirectangularShader();
    }

    private notify(eventId: string, failed = false) {

        let event: ITaskEvent;
        if(failed) {
            event = { type: TASK_TYPE.ENVIRONMENT_MAP_LOADING, id: eventId, progress: 1, status: `Loading of EnvironmentMap failed` };
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, event);
        } else {
            event = { type: TASK_TYPE.ENVIRONMENT_MAP_LOADING, id: eventId, progress: 1, status: `Loaded EnvironmentMap` };
            this._stateEngine.renderingEngines[this._renderingEngine.id].environmentMapLoaded.resolve(true);
            this._stateEngine.renderingEngines[this._renderingEngine.id].environmentMapLoaded = new StatePromise();
            this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, event);
        }
    }

    public async loadEnvMap(name: string | string[], eId?: string): Promise<{
        name: string,
        map: THREE.CubeTexture | THREE.Texture | null,
        type: ENVIRONMENT_MAP_TYPE
    }> {
        const eventId = eId || this._uuidGenerator.create();
        const event: ITaskEvent = { type: TASK_TYPE.ENVIRONMENT_MAP_LOADING, id: eventId, data: { input: name }, progress: 0, status: `Loading EnvironmentMap` };
        this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, event);
        
        const name_original = name;
        if (name === 'none') {
            this._environmentMapNameInternal = name;
            return {
                name: name,
                map: this._environmentMaps[name],
                type: ENVIRONMENT_MAP_TYPE.NONE
            };
        };

        let name_internal: string, name_caching: string, url: string[];

        // check if name is a JSON.stringified version of an array of urls
        if (!Array.isArray(name) && (name.startsWith('["https') && name.endsWith('"]')))
            try { name = JSON.parse(name); } catch (e) {
                this.notify(eventId, true);
                const error = new ShapeDiverViewerEnvironmentMapError('EnvironmentMapLoader.load: Was not able to load environment map.', name);
                throw this._logger.handleError(LOGGING_TOPIC.VIEWPORT, `EnvironmentMapLoader.load`, error);
            }

        // deal with string or array, define names for loading and caching
        if (!Array.isArray(name)) {
            name_internal = name.toLowerCase().replace(/ /g, '_');
            name_caching = name_internal + this._renderingEngine.environmentMapResolution;
        } else {
            if (name.length !== 6) {
                this.notify(eventId, true);
                const error = new ShapeDiverViewerEnvironmentMapError('EnvironmentMapLoader.load: Was not able to load environment map, exactly 6 files are needed in the array.', name);
                throw this._logger.handleError(LOGGING_TOPIC.VIEWPORT, `EnvironmentMapLoader.load`, error);
            }
            name_internal = JSON.stringify(name, null, 0);
            name_caching = name_internal;
        }
        this._environmentMapNameInternal = name_internal;

        // check if environment map is already cached
        for (let environmentMap in this._environmentMaps)
            if (environmentMap === name_caching) {
                return {
                    name: environmentMap,
                    map: this._environmentMaps[environmentMap],
                    type: this._environmentMaps[environmentMap] instanceof THREE.CubeTexture ? ENVIRONMENT_MAP_TYPE.LDR : ENVIRONMENT_MAP_TYPE.HDR
                };
            }

        try {
            // define urls for 6 cube images ourselves
            if (!Array.isArray(name)) {
                url = [];
                let i;
                if(this._environmentMapNamesHDR.indexOf(name_internal) >= 0) {
                    let url_hdr = 'https://viewer.shapediver.com/v3/envmaps/1k/' + name_internal + '_1k.hdr';
                    if(this._environmentMapNamesHDRKhronos.indexOf(name_internal) >= 0)
                        url_hdr = 'https://viewer.shapediver.com/v3/envmaps/khronos/' + name_internal + '.hdr';

                    this._environmentMapHDR.push(url_hdr)
                    await this.loadEnvironmentMap(url_hdr, [], eventId);
                    return {
                        name: url_hdr,
                        map: this._environmentMaps[url_hdr],
                        type: this._environmentMaps[url_hdr] instanceof THREE.CubeTexture ? ENVIRONMENT_MAP_TYPE.LDR : ENVIRONMENT_MAP_TYPE.HDR
                    };
                } else if (this._environmentMapNamesJPG.indexOf(name_internal) >= 0) {
                    // found in list of available environment maps with file type jpg
                    for (i = 0; i < this._environmentMapFilenames.length; i++)
                        url.push('https://viewer.shapediver.com/v2/envmaps/' + this._renderingEngine.environmentMapResolution + '/' + name_internal + '/' + this._environmentMapFilenames[i] + '.jpg');
                } else if (name.startsWith('https://') || name.startsWith('http://')) {
                    if (name.endsWith('.hdr')) {
                        this._environmentMapHDR.push(name)
                        await this.loadEnvironmentMap(name, [], eventId);
                        return {
                            name: name,
                            map: this._environmentMaps[name],
                            type: this._environmentMaps[name] instanceof THREE.CubeTexture ? ENVIRONMENT_MAP_TYPE.LDR : ENVIRONMENT_MAP_TYPE.HDR
                        };
                    } else {
                        if (!name.endsWith('/'))
                        name += '/';

                        for (i = 0; i < this._environmentMapFilenames.length; i++)
                            url.push(name + this._environmentMapFilenames[i] + '.jpg');
                    }
                }
                else {
                    this.notify(eventId, true);
                    const error = new ShapeDiverViewerEnvironmentMapError('EnvironmentMapLoader.load: Was not able to load environment map, format not supported.', name);
                    throw this._logger.handleError(LOGGING_TOPIC.VIEWPORT, `EnvironmentMapLoader.load`, error);
                }
            } else {
                url = name;
            }

            await this.loadEnvironmentMap(name_caching, url, eventId);
            return {
                name: name_caching,
                map: this._environmentMaps[name_caching],
                type: this._environmentMaps[name_caching] instanceof THREE.CubeTexture ? ENVIRONMENT_MAP_TYPE.LDR : ENVIRONMENT_MAP_TYPE.HDR
            };
        }
        catch (e) {
            this.notify(eventId, true);
            throw this._logger.handleError(LOGGING_TOPIC.VIEWPORT, `EnvironmentMapLoader.load`, e);
        }
    }

    public async load(name: string | string[]): Promise<boolean> {
        const eventId = this._uuidGenerator.create();
        const res = await this.loadEnvMap(name, eventId);
        this.assignEnvironmentMap(res.name, res.type, eventId);
        return Promise.resolve(true);
    }

    public getEnvironmentMapImageUrl(name: string | string[]): string {
        if(Array.isArray(name)) return '';
        
        if(this._environmentMapNamesHDR.indexOf(name) >= 0) {
            let url_hdr = 'https://viewer.shapediver.com/v3/envmaps/1k/' + name + '_1k.hdr';
            if(this._environmentMapNamesHDRKhronos.indexOf(name) >= 0)
                url_hdr = 'https://viewer.shapediver.com/v3/envmaps/khronos/' + name + '.hdr';

            return url_hdr;
        }else if (name.startsWith('https://') || name.startsWith('http://')) {
            if (name.endsWith('.hdr') || name.endsWith('.jpg') || name.endsWith('.png')) {
                return name;
            }
        }
        return '';
    }

    // #endregion Public Methods (2)

    // #region Private Methods (2)

    private assignEnvironmentMap(name: string, type: ENVIRONMENT_MAP_TYPE, eventId: string) {
        if(name in this._environmentMaps === false) return;
        this._type = type;
        this._environmentMapName = name;
        this._renderingEngine.materialLoader.assignEnvironmentMap(this._environmentMaps[name], type);
        this.notify(eventId);
    }

    private assignTextureEncoding() {
        for(let e in this._environmentMaps) {
            if(this._environmentMaps[e] && !this._environmentMapHDR.includes(e)) {
                this._environmentMaps[e]?.dispose();
                this._environmentMaps[e]!.encoding = this._textureEncoding;
                this._environmentMaps[e]!.needsUpdate = true;
            }
        }
    }

    private async loadEnvironmentMap(name: string, url: string[], eventId: string) {
        return new Promise<void>(async (resolve, reject) => {
            if(name.endsWith('.hdr')) {
                const response: HttpResponse<ArrayBuffer> = await this._httpClient.loadTexture(name);
                const arrayBufferView = new Uint8Array( response.data );
                const blob = new Blob([ arrayBufferView ], { type: response.headers['content-type'] } );
                new RGBELoader().load(URL.createObjectURL(blob), (texture) => {
                    const map = this._pmremGenerator.fromEquirectangular(texture).texture;
                    this._pmremGenerator.dispose();
                    this._environmentMaps[name] = map;
                    resolve();
                },
                () => {},
                (error) =>  reject(error));
            } else {
                const promises: Promise<HttpResponse<ArrayBuffer>>[] = [];
                url.forEach(u => promises.push(this._httpClient.loadTexture(u)));
                const responses = await Promise.all(promises);

                const urls = responses.map(response => {
                    const arrayBufferView = new Uint8Array( response.data );
                    const blob = new Blob([ arrayBufferView ], { type: response.headers['content-type'] } );
                    return URL.createObjectURL(blob);
                });
                
                new THREE.CubeTextureLoader().load(urls,
                    (map: THREE.CubeTexture) => {
                        map.encoding = THREE.sRGBEncoding;
                        map.format = THREE.RGBAFormat;
                        map.mapping = THREE.CubeReflectionMapping;
                        this._environmentMaps[name] = map;
                        resolve();
                    },
                    () => {},
                    (error) =>  reject(error));
            }
        })
    }

    public get textureEncoding(): THREE.TextureEncoding {
        return this._textureEncoding;
    }
    
    public set textureEncoding(value: THREE.TextureEncoding) {
        this._textureEncoding = value;
        this.assignTextureEncoding();
    }

    // #endregion Private Methods (2)
}