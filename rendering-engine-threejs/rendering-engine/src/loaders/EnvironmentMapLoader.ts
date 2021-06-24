import * as THREE from "three";
import { RenderingEngine } from "..";
import { Logger, LOGGINGTOPIC } from "@shapediver/viewer.shared.utils";
import { EventEngine, EVENTTYPE } from "@shapediver/viewer.shared.services";
import { container } from "tsyringe";

export class EnvironmentMapLoader {
    // #region Properties (4)

    private readonly _environmentMapFilenames = ['px', 'nx', 'pz', 'nz', 'py', 'ny']
    private readonly _environmentMapNamesJPG = ['default', 'default_bw', 'blurred_lights', 'georgentor', 'georgentor_blur', 'georgentor_blue_blur', 'georgentor_bw_blur', 'levelsets', 'lythwood_field', 'mountains', 'ocean', 'piazza_san_marco', 'residential_garden', 'room_abstract_1', 'sky', 'storage_room', 'storm', 'subway_entrance', 'subway_entrance_bw_blur', 'white', 'yokohama'];
    private readonly _environmentMaps: {
        [key: string]: THREE.CubeTexture | null
    } = {};
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _eventEngine: EventEngine = <EventEngine>container.resolve(EventEngine);

    private _environmentMapName: string = 'none';

    // #endregion Properties (4)

    // #region Constructors (1)

    constructor(private readonly _renderingEngine: RenderingEngine) {
        this._environmentMaps['none'] = null;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (1)

    public get environmentMap(): THREE.CubeTexture | null {
        return this._environmentMaps[this._environmentMapName];
    }

    // #endregion Public Accessors (1)

    // #region Public Methods (1)

    public async load(name: string | string[]): Promise<boolean> {
        const name_original = name;
        if (name === 'none') {
            this.assignEnvironmentMap(name);
            this._eventEngine.emitEvent(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, { name: name_original })
            return true;
        };

        let name_internal: string, name_caching: string, url: string[];

        // check if name is a JSON.stringified version of an array of urls
        if (!Array.isArray(name) && (name.startsWith('["https') && name.endsWith('"]')))
            try { name = JSON.parse(name); } catch (e) { }

        // deal with string or array, define names for loading and caching
        if (!Array.isArray(name)) {
            name_internal = name.toLowerCase().replace(/ /g, '_');
            name_caching = name_internal + this._renderingEngine.environmentMapResolution;
        } else {
            if (name.length !== 6) {
                this._logger.error(LOGGINGTOPIC.VIEWER, new Error('EnvironmentMapLoader.load: Was not able to load environment map, exactly 6 files are needed in the array.'))
                this._eventEngine.emitEvent(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, {})
                return false;
            }
            name_internal = JSON.stringify(name, null, 0);
            name_caching = name_internal;
        }

        // check if environment map is already cached
        for (let environmentMap in this._environmentMaps)
            if (environmentMap === name_caching) {
                this.assignEnvironmentMap(environmentMap);
                this._eventEngine.emitEvent(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, { name: name_original })
                return true;
            }

        // define urls for 6 cube images ourselves
        if (!Array.isArray(name)) {
            url = [];
            let i;
            if (this._environmentMapNamesJPG.indexOf(name_internal) >= 0) {
                // found in list of available environment maps with file type jpg
                for (i = 0; i < this._environmentMapFilenames.length; i++)
                    url.push('https://viewer.shapediver.com/v2/envmaps/' + this._renderingEngine.environmentMapResolution + '/' + name_internal + '/' + this._environmentMapFilenames[i] + '.jpg');
            }
            else if (name.startsWith('https://') || name.startsWith('http://')) {
                if (!name.endsWith('/'))
                    name += '/';
                for (i = 0; i < this._environmentMapFilenames.length; i++)
                    url.push(name + this._environmentMapFilenames[i] + '.jpg');
            }
            else {
                this._logger.error(LOGGINGTOPIC.VIEWER, new Error('EnvironmentMapLoader.load: Was not able to load environment map, format not supported.'))
                this._eventEngine.emitEvent(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, {})
                return false;
            }
        } else {
            url = name;
        }

        try {
            await this.loadEnvironmentMap(name_caching, url);
            this._eventEngine.emitEvent(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, { name: name_original })
            return Promise.resolve(true);
        }
        catch (error) {
            this._logger.error(LOGGINGTOPIC.VIEWER, new Error('EnvironmentMapLoader.load: Was not able to load environment map.'))
            this._eventEngine.emitEvent(EVENTTYPE.ENVIRONMENTMAP.ENVIRONMENTMAP_LOADED, {})
            return Promise.resolve(false);
        }
    }

    // #endregion Public Methods (1)

    // #region Private Methods (2)

    private assignEnvironmentMap(name: string) {
        if(name in this._environmentMaps === false) return;
        this._environmentMapName = name;
        this._renderingEngine.materialLoader.assignEnvironmentMap(this._environmentMaps[name]);
    }

    private async loadEnvironmentMap(name: string, url: string[]) {
        return new Promise<void>((resolve, reject) => {
            new THREE.CubeTextureLoader().load(url,
                (map: THREE.CubeTexture) => {
                    map.format = THREE.RGBFormat;
                    map.mapping = THREE.CubeReflectionMapping;
                    map.generateMipmaps = false;
                    map.minFilter = THREE.LinearFilter;
                    map.magFilter = THREE.LinearFilter;
                    this._environmentMaps[name] = map;
                    this.assignEnvironmentMap(name);
                    resolve();
                },
                () => {},
                (error) =>  reject(error));
        })
    }

    // #endregion Private Methods (2)
}