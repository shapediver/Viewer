import * as THREE from 'three'
import { Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.utils'
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { RenderingEngine } from '..'
import { RGBELoader } from '../three/loaders/RGBELoader'
import { RenderingManager } from '../managers/RenderingManager'
import { ILoader } from '../interfaces/ILoader'

export enum ENVIRONMENTMAP {
    ANNIVERSARY_LOUNGE = 'anniversary_lounge', 
    BALLROOM = 'ballroom', 
    CHRISTMAS_PHOTO_STUDIO = 'christmas_photo_studio', 
    COMBINATION_ROOM = 'combination_room', 
    LARGE_CORRIDOR = 'large_corridor', 
    LYTHWOOD_LOUNGE = 'lythwood_lounge', 
    OLD_HALL = 'old_hall', 
    PAUL_LOBE_HAUS = 'paul_lobe_haus', 
    PHOTO_STUDIO = 'photo_studio', 
    PHOTO_STUDIO_BROADWAY_HALL = 'photo_studio_broadway_hall', 
    STUDIO_SMALL = 'studio_small'
}

export class EnvironmentMapLoader implements ILoader {
    // #region Properties (8)

    private readonly _environmentMapFilenames = ['px', 'nx', 'pz', 'nz', 'py', 'ny']    
    private readonly _environmentMapNamesHDR = ['anniversary_lounge', 'ballroom', 'cape_hill', 'christmas_photo_studio', 'circus_maximus', 'combination_room', 'green_point_park', 'hilltop_construction', 'large_corridor', 'lythwood_lounge', 'oberer_kuhberg', 'old_hall', 'paul_lobe_haus', 'photo_studio', 'photo_studio_broadway_hall', 'snowy_field', 'studio_small', 'sunflowers', 'table_mountain'];
    private readonly _environmentMapNamesHDRKhronos = ['cannon_exterior', 'colorful_studio', 'neutral', 'wide_street'];
    private readonly _environmentMapNamesJPG = ['default', 'default_bw', 'blurred_lights', 'georgentor', 'georgentor_blur', 'georgentor_blue_blur', 'georgentor_bw_blur', 'levelsets', 'lythwood_field', 'mountains', 'ocean', 'piazza_san_marco', 'residential_garden', 'room_abstract_1', 'sky', 'storage_room', 'storm', 'subway_entrance', 'subway_entrance_bw_blur', 'white', 'yokohama'];
    private readonly _environmentMaps: {
        [key: string]: THREE.CubeTexture | THREE.Texture | null
    } = {};
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private _pmremGenerator!: THREE.PMREMGenerator;

    private _environmentMapName: string = 'none';
    private _environmentMapNameInternal: string = 'none';

    // #endregion Properties (8)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {}

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get environmentMap(): THREE.CubeTexture | THREE.Texture | null {
        return this._environmentMaps[this._environmentMapName];
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (2)

    public init(): void {
        this._environmentMaps['none'] = null;
            
        this._pmremGenerator = new THREE.PMREMGenerator(this._renderingEngine.renderer);
        this._pmremGenerator.compileEquirectangularShader();
    }

    public async load(name: string | string[]): Promise<boolean> {
        const name_original = name;
        if (name === 'none') {
            this._environmentMapNameInternal = name;
            this.assignEnvironmentMap(name);
            return true;
        };

        let name_internal: string, name_caching: string, url: string[];

        // check if name is a JSON.stringified version of an array of urls
        if (!Array.isArray(name) && (name.startsWith('["https') && name.endsWith('"]')))
            try { name = JSON.parse(name); } catch (e) {
                this._logger.error(LOGGINGTOPIC.VIEWER, new SDError('EnvironmentMapLoader.load: Was not able to load environment map.'))
            }

        // deal with string or array, define names for loading and caching
        if (!Array.isArray(name)) {
            name_internal = name.toLowerCase().replace(/ /g, '_');
            name_caching = name_internal + this._renderingEngine.environmentMapResolution;
        } else {
            if (name.length !== 6) {
                this._logger.error(LOGGINGTOPIC.VIEWER, new SDError('EnvironmentMapLoader.load: Was not able to load environment map, exactly 6 files are needed in the array.'))
                this._eventEngine.emitEvent(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, { viewerId: this._renderingEngine.id,  environmentMapId: this._environmentMapNameInternal })
                return false;
            }
            name_internal = JSON.stringify(name, null, 0);
            name_caching = name_internal;
        }
        this._environmentMapNameInternal = name_internal;

        // check if environment map is already cached
        for (let environmentMap in this._environmentMaps)
            if (environmentMap === name_caching) {
                this.assignEnvironmentMap(environmentMap);
                return true;
            }

        // define urls for 6 cube images ourselves
        if (!Array.isArray(name)) {
            url = [];
            let i;
            if(this._environmentMapNamesHDR.indexOf(name_internal) >= 0) {
                await this.loadEnvironmentMap('https://viewer.shapediver.com/v3/envmaps/1k/' + name_internal + '_1k.hdr', []);
            } else if(this._environmentMapNamesHDRKhronos.indexOf(name_internal) >= 0) {
                await this.loadEnvironmentMap('https://viewer.shapediver.com/v3/envmaps/khronos/' + name_internal + '.hdr', []);
            } else if (this._environmentMapNamesJPG.indexOf(name_internal) >= 0) {
                // found in list of available environment maps with file type jpg
                for (i = 0; i < this._environmentMapFilenames.length; i++)
                    url.push('https://viewer.shapediver.com/v2/envmaps/' + this._renderingEngine.environmentMapResolution + '/' + name_internal + '/' + this._environmentMapFilenames[i] + '.jpg');
            } else if (name.startsWith('https://') || name.startsWith('http://')) {
                if (name.endsWith('.hdr')) {
                    await this.loadEnvironmentMap(name, []);
                } else {
                    if (!name.endsWith('/'))
                    name += '/';

                    for (i = 0; i < this._environmentMapFilenames.length; i++)
                        url.push(name + this._environmentMapFilenames[i] + '.jpg');
                }
            }
            else {
                this._logger.error(LOGGINGTOPIC.VIEWER, new SDError('EnvironmentMapLoader.load: Was not able to load environment map, format not supported.'))
                this._eventEngine.emitEvent(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, { viewerId: this._renderingEngine.id,  environmentMapId: this._environmentMapNameInternal })
                return false;
            }
        } else {
            url = name;
        }

        try {
            await this.loadEnvironmentMap(name_caching, url);
            return Promise.resolve(true);
        }
        catch (error) {
            this._logger.error(LOGGINGTOPIC.VIEWER, new SDError('EnvironmentMapLoader.load: Was not able to load environment map.'))
            this._eventEngine.emitEvent(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, { viewerId: this._renderingEngine.id,  environmentMapId: this._environmentMapNameInternal })
            return Promise.resolve(false);
        }
    }

    // #endregion Public Methods (2)

    // #region Private Methods (2)

    private assignEnvironmentMap(name: string) {
        if(name in this._environmentMaps === false) return;
        this._environmentMapName = name;
        this._renderingEngine.materialLoader.assignEnvironmentMap(this._environmentMaps[name]);
        this._eventEngine.emitEvent(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, { viewerId: this._renderingEngine.id,  environmentMapId: this._environmentMapNameInternal })
    }

    private async loadEnvironmentMap(name: string, url: string[]) {
        return new Promise<void>((resolve, reject) => {
            if(name.endsWith('.hdr')) {
                new RGBELoader().setDataType(THREE.UnsignedByteType).load(name, (texture) => {
                    const map = this._pmremGenerator.fromEquirectangular(texture).texture;
                    this._pmremGenerator.dispose();
                    this._environmentMaps[name] = map;
                    this.assignEnvironmentMap(name);
                    resolve();
                },
                () => {},
                (error) =>  reject(error));
            } else {
                new THREE.CubeTextureLoader().load(url,
                    (map: THREE.CubeTexture) => {
                        map.format = THREE.RGBFormat;
                        map.mapping = THREE.CubeReflectionMapping;
                        this._environmentMaps[name] = map;
                        this.assignEnvironmentMap(name);
                        resolve();
                    },
                    () => {},
                    (error) =>  reject(error));
            }
        })
    }

    // #endregion Private Methods (2)
}