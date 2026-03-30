import {ResOutputContent} from "@shapediver/sdk.geometry-api-sdk-v2";
import {MaterialEngine} from "@shapediver/viewer.data-engine.material-engine";
import {
	GeometryData,
	ITreeNode,
	TreeNode,
} from "@shapediver/viewer.shared.node-tree";
import {
	Converter,
	HttpClient,
	Logger,
} from "@shapediver/viewer.shared.services";
import {
	IMaterialAbstractData,
	IMaterialGemDataPropertiesDefinition,
	IMaterialStandardDataPropertiesDefinition,
} from "@shapediver/viewer.shared.types";

export class MaterialDatabaseEngine {
	private readonly _converter: Converter = Converter.instance;
	private readonly _httpClient: HttpClient = HttpClient.instance;
	private readonly _logger: Logger = Logger.instance;
	private readonly _materialDatabase: {
		[key: string]: {
			definition:
				| IMaterialStandardDataPropertiesDefinition
				| IMaterialGemDataPropertiesDefinition;
			material?: IMaterialAbstractData;
		};
	} = {};
	private readonly _materialEngine: MaterialEngine = MaterialEngine.instance;

	private static _instance: MaterialDatabaseEngine;

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	/**
	 * Assigns materials from the material database to the geometry data in the given node.
	 *
	 * @param node the scene graph node
	 */
	public async assignMaterialFromDatabase(node: ITreeNode): Promise<void> {
		if (Object.keys(this._materialDatabase).length === 0) return;

		// gather the materials that still need to be created
		// and the corresponding geometry data to assign the created material to
		const materialsToCreate: {[key: string]: GeometryData[]} = {};
		let updateNode = false;
		node.traverse((n) => {
			// check if the name of the material is corresponding to a material in the material database output
			for (let i = 0; i < n.data.length; i++) {
				const data = n.data[i];
				if (data instanceof GeometryData) {
					const name = data.material?.name;
					if (name) {
						// if the material is not found directly, try with original node name as prefix
						// this is can be used for instances
						const materialName = this._materialDatabase[name]
							? name
							: `${node.originalName}_${name}`;

						if (this._materialDatabase[materialName]) {
							if (
								!this._materialDatabase[materialName].material
							) {
								if (!materialsToCreate[materialName])
									materialsToCreate[materialName] = [];
								materialsToCreate[materialName].push(data);
							} else if (
								data.material !==
								this._materialDatabase[materialName].material
							) {
								data.material =
									this._materialDatabase[materialName]
										.material || null;
								// trigger an update of the geometry and the node
								data.updateVersion();
								updateNode = true;
							}
						}
					}
				}
			}
		});

		if (updateNode) node.updateVersion();

		// create the materials that are missing
		const materialNames = Object.keys(materialsToCreate);
		if (materialNames.length === 0) return;

		const promises = [];
		for (const materialName of materialNames) {
			promises.push(
				this._materialEngine.createMaterialDataFromDefinition(
					this._materialDatabase[materialName].definition,
				),
			);
		}

		// create the materials
		const materials = await Promise.all(promises);

		updateNode = false;

		// assign the created materials to the corresponding geometry data
		for (let i = 0; i < materialNames.length; i++) {
			const material = materials[i];
			material.name = materialNames[i];
			this._materialDatabase[material.name].material = material;
			const geometryData = materialsToCreate[material.name];
			for (const data of geometryData) {
				data.material = material;
				data.updateVersion();
				updateNode = true;
			}
		}

		if (updateNode) node.updateVersion();
	}

	/**
	 * Load the material database from the given output content.
	 *
	 * @param content the output content
	 * @returns a scene graph node placeholder for the material database
	 */
	public async loadContent(content: ResOutputContent): Promise<ITreeNode> {
		const materialDatabaseData = content.data as {
			[key: string]:
				| IMaterialStandardDataPropertiesDefinition
				| IMaterialGemDataPropertiesDefinition;
		};
		const materialDatabase = new TreeNode("materialDatabase");
		if (!materialDatabaseData) return materialDatabase;

		for (const key in materialDatabaseData) {
			if (this._materialDatabase[key]) {
				if (
					JSON.stringify(this._materialDatabase[key].definition) !==
					JSON.stringify(materialDatabaseData[key])
				) {
					this._materialDatabase[key] = {
						definition: materialDatabaseData[key],
					};
				}
			} else {
				this._materialDatabase[key] = {
					definition: materialDatabaseData[key],
				};
			}
		}

		return materialDatabase;
	}
}
