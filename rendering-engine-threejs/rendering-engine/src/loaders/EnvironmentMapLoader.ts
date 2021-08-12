import * as THREE from 'three'
import { Logger, LOGGINGTOPIC, SDError } from '@shapediver/viewer.shared.utils'
import { EventEngine, EVENTTYPE } from '@shapediver/viewer.shared.services'
import { container } from 'tsyringe'

import { RenderingEngine } from '..'
import { RGBELoader } from '../three/loaders/RGBELoader'
import { ILoader } from '../interfaces/ILoader'

export enum ENVIRONMENTMAP_CUBE {
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

export enum ENVIRONMENTMAP {
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
    WIDE_STREET = 'wide_street',
}

export class EnvironmentMapLoader implements ILoader {
    // #region Properties (8)

    private readonly _oldSettings = {
        physicallyCorrectLights: false, // should be set to true (out old default was false, but this should definitely change) (old default: false)
        envMapIntensity: 1, // change the intensity of the environment Map (old default: 1)
        envMapIntensityGroundPlane: 1, // change the intensity of the environment Map for the groundPlane (old default: 1)
        groundPlaneColor: '#D3D3D3', // change the color of the ground plane (old default: '#D3D3D3')
        toneMapping: 0, // Use a different tone mapping (0: none, 1: linear, 2: reinhard, 3: cineon, 4: ACESFilmic) (old default: 0)
        toneMappingExposure: 1, // change the exposure of the tone mapping (old default: 1)
        textureEncoding: 3000, // change the encoding of the textures in the scene (3000: linear, 3001: sRGB) (old default: 3000)
        outputEncoding: 3000, // change the encoding of the textures in the scene (3000: linear, 3001: sRGB) (old default: 3000)
    }

    private readonly _newSettings = {
        physicallyCorrectLights: true, // should be set to true (out old default was false, but this should definitely change) (old default: false)
        envMapIntensity: 1, // change the intensity of the environment Map (old default: 1)
        envMapIntensityGroundPlane: 0.5, // change the intensity of the environment Map for the groundPlane (old default: 1)
        groundPlaneColor: '#D3D3D3', // change the color of the ground plane (old default: '#D3D3D3')
        toneMapping: 0, // Use a different tone mapping (0: none, 1: linear, 2: reinhard, 3: cineon, 4: ACESFilmic) (old default: 0)
        toneMappingExposure: 1, // change the exposure of the tone mapping (old default: 1)
        textureEncoding: 3001, // change the encoding of the textures in the scene (3000: linear, 3001: sRGB) (old default: 3000)
        outputEncoding: 3001, // change the encoding of the textures in the scene (3000: linear, 3001: sRGB) (old default: 3000)
    }


    private readonly _environmentMapFilenames = ['px', 'nx', 'pz', 'nz', 'py', 'ny']    
    private readonly _environmentMapHDR: string[] = [];
    private readonly _environmentMapNamesHDR = Object.values(ENVIRONMENTMAP).filter(value => typeof value === 'string') as string[]
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
                    await this.loadEnvironmentMap(url_hdr, []);
                    return Promise.resolve(true);
                } else if (this._environmentMapNamesJPG.indexOf(name_internal) >= 0) {
                    // found in list of available environment maps with file type jpg
                    for (i = 0; i < this._environmentMapFilenames.length; i++)
                        url.push('https://viewer.shapediver.com/v2/envmaps/' + this._renderingEngine.environmentMapResolution + '/' + name_internal + '/' + this._environmentMapFilenames[i] + '.jpg');
                } else if (name.startsWith('https://') || name.startsWith('http://')) {
                    if (name.endsWith('.hdr')) {
                        this._environmentMapHDR.push(name)
                        await this.loadEnvironmentMap(name, []);
                        return Promise.resolve(true);
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
        if(this._environmentMapHDR.includes(name)) {
            this._renderingEngine.renderingSettings = this._newSettings;
        } else {
            this._renderingEngine.renderingSettings = this._oldSettings;
        }

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