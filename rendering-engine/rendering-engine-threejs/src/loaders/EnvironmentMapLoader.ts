/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-async-promise-executor */
import {
	EventEngine,
	EVENTTYPE,
	HttpClient,
	type HttpResponse,
	ShapeDiverViewerEnvironmentMapError,
	StateEngine,
	StatePromise,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import * as THREE from "three";

import {type ITaskEvent, TASK_TYPE} from "@shapediver/viewer.shared.types";
import {RenderingEngine} from "..";
import {type ILoader} from "../interfaces/ILoader";
import {assignEnvironmentMapForThreeJsData} from "../managers/sceneTree/ThreeJsDataUtils";
import {RGBELoader} from "../three/loaders/RGBELoader";

export enum ENVIRONMENT_MAP_CUBE {
	DEFAULT = "default",
	DEFAULT_BW = "default_bw",
	BLURRED_LIGHTS = "blurred_lights",
	GEORGENTOR = "georgentor",
	GEORGENTOR_BLUR = "georgentor_blur",
	GEORGENTOR_BLUE_BLUR = "georgentor_blue_blur",
	GEORGENTOR_BW_BLUR = "georgentor_bw_blur",
	LEVELSETS = "levelsets",
	LYTHWOOD_FIELD = "lythwood_field",
	MOUNTAINS = "mountains",
	OCEAN = "ocean",
	PIAZZA_SAN_MARCO = "piazza_san_marco",
	RESIDENTIAL_GARDEN = "residential_garden",
	ROOM_ABSTRACT_1 = "room_abstract_1",
	SKY = "sky",
	STORAGE_ROOM = "storage_room",
	STORM = "storm",
	SUBWAY_ENTRANCE = "subway_entrance",
	SUBWAY_ENTRANCE_BW_BLUR = "subway_entrance_bw_blur",
	WHITE = "white",
	YOKOHAMA = "yokohama",
}

export enum ENVIRONMENT_MAP {
	DEFAULT_STUDIO = "default_studio",
	FURNITURE_STUDIO = "furniture_studio",
	GEM_STUDIO = "gem_studio",
	HOSPITAL = "hospital",
	JEWELRY_STUDIO = "jewelry_studio",
	ANNIVERSARY_LOUNGE = "anniversary_lounge",
	BALLROOM = "ballroom",
	CANNON_EXTERIOR = "cannon_exterior",
	CAPE_HILL = "cape_hill",
	CHRISTMAS_PHOTO_STUDIO = "christmas_photo_studio",
	CIRCUS_MAXIMUS = "circus_maximus",
	COLORFUL_STUDIO = "colorful_studio",
	COMBINATION_ROOM = "combination_room",
	GREEN_POINT_PARK = "green_point_park",
	HILLTOP_CONSTRUCTION = "hilltop_construction",
	LARGE_CORRIDOR = "large_corridor",
	LYTHWOOD_LOUNGE = "lythwood_lounge",
	NEUTRAL = "neutral",
	OBERER_KUHBERG = "oberer_kuhberg",
	OLD_HALL = "old_hall",
	PAUL_LOBE_HAUS = "paul_lobe_haus",
	PHOTO_STUDIO = "photo_studio",
	PHOTO_STUDIO_BROADWAY_HALL = "photo_studio_broadway_hall",
	SNOWY_FIELD = "snowy_field",
	STUDIO_SMALL = "studio_small",
	SUNFLOWERS = "sunflowers",
	TABLE_MOUNTAIN = "table_mountain",
	VENICE_SUNSET = "venice_sunset",
	WIDE_STREET = "wide_street",
}

export enum ENVIRONMENT_MAP_EMPTY {
	NONE = "none",
	NULL = "null",
}

export enum ENVIRONMENT_MAP_TYPE {
	LDR = "ldr",
	HDR = "hdr",
	NONE = "none",
	NULL = "null",
}

export class EnvironmentMapLoader implements ILoader {
	// #region Properties (15)

	private readonly _environmentMapFilenames = [
		"px",
		"nx",
		"pz",
		"nz",
		"py",
		"ny",
	];
	private readonly _environmentMapHDR: string[] = [];
	private readonly _environmentMapNamesHDR = Object.values(
		ENVIRONMENT_MAP,
	).filter((value) => typeof value === "string") as string[];
	private readonly _environmentMapNamesHDRCustom = [
		"default_studio",
		"furniture_studio",
		"gem_studio",
		"hospital",
		"jewelry_studio",
	];
	private readonly _environmentMapNamesHDRKhronos = [
		"cannon_exterior",
		"colorful_studio",
		"neutral",
		"wide_street",
	];
	private readonly _environmentMapNamesJPG = [
		"default",
		"default_bw",
		"blurred_lights",
		"georgentor",
		"georgentor_blur",
		"georgentor_blue_blur",
		"georgentor_bw_blur",
		"levelsets",
		"lythwood_field",
		"mountains",
		"ocean",
		"piazza_san_marco",
		"residential_garden",
		"room_abstract_1",
		"sky",
		"storage_room",
		"storm",
		"subway_entrance",
		"subway_entrance_bw_blur",
		"white",
		"yokohama",
	];
	private readonly _environmentMaps: {
		[key: string]: {
			name: string;
			map: Promise<THREE.CubeTexture | THREE.Texture | null>;
			type: ENVIRONMENT_MAP_TYPE;
			resolved?: boolean;
		};
	} = {};
	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _httpClient: HttpClient = HttpClient.instance;
	private readonly _stateEngine: StateEngine = StateEngine.instance;
	private readonly _uuidGenerator: UuidGenerator = UuidGenerator.instance;

	private _envMap: THREE.CubeTexture | THREE.Texture | null = null;
	private _isHDRMap: boolean = false;
	private _pmremGenerator!: THREE.PMREMGenerator;
	private _textureEncoding: THREE.ColorSpace = THREE.SRGBColorSpace;
	private _type: ENVIRONMENT_MAP_TYPE = ENVIRONMENT_MAP_TYPE.NULL;

	// #endregion Properties (15)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {}

	// #endregion Constructors (1)

	// #region Public Accessors (4)

	public get environmentMap(): THREE.CubeTexture | THREE.Texture | null {
		return this._envMap;
	}

	public get isHDRMap(): boolean {
		return this._isHDRMap;
	}

	public get textureEncoding(): THREE.ColorSpace {
		return this._textureEncoding;
	}

	public set textureEncoding(value: THREE.ColorSpace) {
		this._textureEncoding = value;
		this.assignTextureEncoding();
	}

	public get type(): ENVIRONMENT_MAP_TYPE {
		return this._type;
	}

	// #endregion Public Accessors (4)

	// #region Public Methods (4)

	/**
	 * Create a JSON.stringified version of an array of urls or a single url to be saved in the environment map content.
	 *
	 * @param input
	 * @returns
	 */
	public createSaveableEnvironmentMapContent(
		input: string | string[],
	): string {
		if (Array.isArray(input)) return JSON.stringify(input);

		if (this._environmentMapNamesHDRCustom.indexOf(input) >= 0)
			return (
				"https://viewer.shapediver.com/v3/envmaps/custom/" +
				input +
				".hdr"
			);

		return input;
	}

	public getEnvironmentMapImageUrl(name: string | string[]): string {
		if (Array.isArray(name)) return "";

		if (this._environmentMapNamesHDR.indexOf(name) >= 0) {
			let url_hdr =
				"https://viewer.shapediver.com/v3/envmaps/1k/" +
				name +
				"_1k.hdr";
			if (this._environmentMapNamesHDRCustom.indexOf(name) >= 0)
				url_hdr =
					"https://viewer.shapediver.com/v3/envmaps/custom/" +
					name +
					".hdr";
			else if (this._environmentMapNamesHDRKhronos.indexOf(name) >= 0)
				url_hdr =
					"https://viewer.shapediver.com/v3/envmaps/khronos/" +
					name +
					".hdr";

			return url_hdr;
		} else if (name.startsWith("https://") || name.startsWith("http://")) {
			if (
				name.endsWith(".hdr") ||
				name.endsWith(".jpg") ||
				name.endsWith(".png")
			) {
				return name;
			}
		}
		return "";
	}

	public init(): void {
		this._environmentMaps["null"] = {
			name: "null",
			map: Promise.resolve(null),
			type: ENVIRONMENT_MAP_TYPE.NULL,
		};
		this._environmentMaps["none"] = {
			name: "none",
			map: Promise.resolve(null),
			type: ENVIRONMENT_MAP_TYPE.NONE,
		};

		this._pmremGenerator = new THREE.PMREMGenerator(
			this._renderingEngine.renderer,
		);
		this._pmremGenerator.compileEquirectangularShader();
	}

	public async load(name: string | string[]): Promise<boolean> {
		const eventId = this._uuidGenerator.create();
		try {
			const res = this.loadEnvMap(name, eventId);
			await this.assignEnvironmentMap(res.name, res.type, eventId);
		} catch (e) {
			if (e instanceof ShapeDiverViewerEnvironmentMapError) {
				throw e;
			} else {
				throw new ShapeDiverViewerEnvironmentMapError(
					"EnvironmentMapLoader.load: Was not able to load environment map.",
					name,
				);
			}
		}
		return true;
	}

	public loadEnvMap(
		name: string | string[],
		eId?: string,
	): {
		name: string;
		map: Promise<THREE.CubeTexture | THREE.Texture | null>;
		type: ENVIRONMENT_MAP_TYPE;
	} {
		const eventId = eId || this._uuidGenerator.create();
		const event: ITaskEvent = {
			type: TASK_TYPE.ENVIRONMENT_MAP_LOADING,
			id: eventId,
			data: {input: name},
			progress: 0,
			status: "Loading EnvironmentMap",
		};
		this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, event);

		if (name === "none" || name === "null")
			return this._environmentMaps[name];

		let name_internal: string, name_caching: string, url: string[];

		// check if name is a JSON.stringified version of an array of urls
		if (
			!Array.isArray(name) &&
			name.startsWith('["https') &&
			name.endsWith('"]')
		)
			try {
				name = JSON.parse(name);
			} catch (e) {
				this.notify(eventId, true);
				throw new ShapeDiverViewerEnvironmentMapError(
					"EnvironmentMapLoader.load: Was not able to load environment map.",
					name,
				);
			}

		// deal with string or array, define names for loading and caching
		if (!Array.isArray(name)) {
			name_internal = name.toLowerCase().replace(/ /g, "_");
			name_caching =
				name_internal + this._renderingEngine.environmentMapResolution;
		} else {
			if (name.length !== 6) {
				this.notify(eventId, true);
				throw new ShapeDiverViewerEnvironmentMapError(
					"EnvironmentMapLoader.load: Was not able to load environment map, exactly 6 files are needed in the array.",
					name,
				);
			}
			name_internal = JSON.stringify(name, null, 0);
			name_caching = name_internal;
		}

		// check if environment map is already cached
		for (const environmentMap in this._environmentMaps)
			if (environmentMap === name_caching)
				return this._environmentMaps[environmentMap];

		try {
			// define urls for 6 cube images ourselves
			if (!Array.isArray(name)) {
				url = [];
				let i;
				if (this._environmentMapNamesHDR.indexOf(name_internal) >= 0) {
					let url_hdr =
						"https://viewer.shapediver.com/v3/envmaps/1k/" +
						name_internal +
						"_1k.hdr";
					if (this._environmentMapNamesHDRCustom.indexOf(name) >= 0)
						url_hdr =
							"https://viewer.shapediver.com/v3/envmaps/custom/" +
							name +
							".hdr";
					else if (
						this._environmentMapNamesHDRKhronos.indexOf(
							name_internal,
						) >= 0
					)
						url_hdr =
							"https://viewer.shapediver.com/v3/envmaps/khronos/" +
							name_internal +
							".hdr";

					this._environmentMapHDR.push(url_hdr);
					return this.loadEnvironmentMap(
						name_caching,
						url_hdr,
						eventId,
					);
				} else if (
					this._environmentMapNamesJPG.indexOf(name_internal) >= 0
				) {
					// found in list of available environment maps with file type jpg
					for (i = 0; i < this._environmentMapFilenames.length; i++)
						url.push(
							"https://viewer.shapediver.com/v2/envmaps/" +
								this._renderingEngine.environmentMapResolution +
								"/" +
								name_internal +
								"/" +
								this._environmentMapFilenames[i] +
								".jpg",
						);
				} else if (
					name.startsWith("https://") ||
					name.startsWith("http://")
				) {
					if (name.endsWith(".hdr")) {
						this._environmentMapHDR.push(name);
						return this.loadEnvironmentMap(
							name_caching,
							name,
							eventId,
						);
					} else {
						if (!name.endsWith("/")) name += "/";

						for (
							i = 0;
							i < this._environmentMapFilenames.length;
							i++
						)
							url.push(
								name +
									this._environmentMapFilenames[i] +
									".jpg",
							);
					}
				} else {
					this.notify(eventId, true);
					throw new ShapeDiverViewerEnvironmentMapError(
						"EnvironmentMapLoader.load: Was not able to load environment map, format not supported.",
						name,
					);
				}
			} else {
				url = name;
			}

			return this.loadEnvironmentMap(name_caching, url, eventId);
		} catch (e) {
			this.notify(eventId, true);
			throw e;
		}
	}

	/**
	 * In case one of our new custom HDR environment maps is loaded, the content is an url to the HDR file.
	 * We extract the name of the environment map from the url and return it.
	 *
	 * @param input
	 * @returns
	 */
	public reconstructSavedEnvironmentMapContent(
		input: string | string[],
	): string | string[] {
		if (
			!Array.isArray(input) &&
			input.startsWith(
				"https://viewer.shapediver.com/v3/envmaps/custom/",
			) &&
			input.endsWith(".hdr")
		) {
			const parts = input.split("/");
			const name = parts[parts.length - 1].split(".")[0];
			if (this._environmentMapNamesHDRCustom.indexOf(name) >= 0)
				return name;
		}
		return input;
	}

	// #endregion Public Methods (4)

	// #region Private Methods (4)

	private async assignEnvironmentMap(
		name: string,
		type: ENVIRONMENT_MAP_TYPE,
		eventId: string,
	) {
		if (name in this._environmentMaps === false) return;
		this._type = type;
		const map = await this._environmentMaps[name].map;
		// set the environment map in the material loader
		this._renderingEngine.materialLoader.assignEnvironmentMap(map, type);
		// set the currently used environment map for all ThreejsData in the scene tree
		assignEnvironmentMapForThreeJsData(
			map,
			type,
			this._renderingEngine.environmentMapIntensity,
			this._renderingEngine.environmentMapRotation,
		);
		this._envMap = map;
		this.notify(eventId);
	}

	private assignTextureEncoding() {
		for (const e in this._environmentMaps) {
			if (this._environmentMaps[e]) {
				if (this._environmentMaps[e].resolved === true) {
					this._environmentMaps[e].map.then((m) => {
						if (m instanceof THREE.Texture) {
							m.dispose();
							m.colorSpace = this._textureEncoding;
							m.needsUpdate = true;
						}
					});
				}
			}
		}
	}

	private loadEnvironmentMap(
		name: string,
		url: string | string[],
		eventId: string,
	): {
		name: string;
		map: Promise<THREE.CubeTexture | THREE.Texture | null>;
		type: ENVIRONMENT_MAP_TYPE;
	} {
		this._environmentMaps[name] = {
			name,
			type: !Array.isArray(url)
				? ENVIRONMENT_MAP_TYPE.HDR
				: ENVIRONMENT_MAP_TYPE.LDR,
			map: new Promise<THREE.CubeTexture | THREE.Texture | null>(
				async (resolve, reject) => {
					try {
						if (!Array.isArray(url)) {
							const response: HttpResponse<ArrayBuffer> =
								(await this._httpClient.get(
									url,
									undefined,
									true,
								)) as HttpResponse<ArrayBuffer>;
							const arrayBufferView = new Uint8Array(
								response.data,
							);
							const blob = new Blob([arrayBufferView], {
								type: response.headers["content-type"],
							});
							const blobUrl = URL.createObjectURL(blob);
							new RGBELoader().load(
								blobUrl,
								(texture) => {
									const map =
										this._pmremGenerator.fromEquirectangular(
											texture,
										).texture;
									this._pmremGenerator.dispose();
									URL.revokeObjectURL(blobUrl);
									this._environmentMaps[name].resolved = true;
									resolve(map);
								},
								() => {},
								(error) => reject(error),
							);
						} else {
							const promises: Promise<
								HttpResponse<ArrayBuffer>
							>[] = [];
							url.forEach((u) =>
								promises.push(
									this._httpClient.get(
										u,
										undefined,
										true,
									) as Promise<HttpResponse<ArrayBuffer>>,
								),
							);
							const responses = await Promise.all(promises);

							const urls = responses.map((response) => {
								const arrayBufferView = new Uint8Array(
									response.data,
								);
								const blob = new Blob([arrayBufferView], {
									type: response.headers["content-type"],
								});
								return URL.createObjectURL(blob);
							});

							new THREE.CubeTextureLoader().load(
								urls,
								(map: THREE.CubeTexture) => {
									map.colorSpace = THREE.SRGBColorSpace;
									map.format = THREE.RGBAFormat;
									map.mapping = THREE.CubeReflectionMapping;
									urls.forEach((u) => URL.revokeObjectURL(u));
									this._environmentMaps[name].resolved = true;
									resolve(map);
								},
								() => {},
								(error) => reject(error),
							);
						}
					} catch (e) {
						this.notify(eventId, true);
						reject(e);
					}
				},
			),
		};
		return this._environmentMaps[name];
	}

	private notify(eventId: string, failed = false) {
		let event: ITaskEvent;
		if (failed) {
			event = {
				type: TASK_TYPE.ENVIRONMENT_MAP_LOADING,
				id: eventId,
				progress: 1,
				status: "Loading of EnvironmentMap failed",
			};
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_CANCEL, event);
		} else {
			event = {
				type: TASK_TYPE.ENVIRONMENT_MAP_LOADING,
				id: eventId,
				progress: 1,
				status: "Loaded EnvironmentMap",
			};
			if (this._stateEngine.viewportEngines[this._renderingEngine.id]) {
				this._stateEngine.viewportEngines[
					this._renderingEngine.id
				]!.environmentMapLoaded.resolve(true);
				this._stateEngine.viewportEngines[
					this._renderingEngine.id
				]!.environmentMapLoaded = new StatePromise();
			}
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, event);
		}
	}

	// #endregion Private Methods (4)
}
