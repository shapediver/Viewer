import { IExport } from "./IExport";
import { IParameter } from "./IParameter";
import { TreeNode } from "@shapediver/viewer.node-tree.tree-node";
import { IOutput } from "./IOutput";

/**
 * ### The API for a single Session
 * With this API you can get the exports and parameters of this session.
 * Also you can customize the scene with the current parameters.
 */
export interface ISession {
    // #region Properties (6)

    /** Returns all exports of this session mapped by their id. */
    readonly exports: { [key: string]: IExport };
    /** Returns the modelViewUrl of the session. */
    readonly modelViewUrl: string;
    /** The scene graph node with the current session in it. */
    readonly node: TreeNode;
    /** Returns all output of this session mapped by their id. */
    readonly outputs: { [key: string]: IOutput };
    /** Returns all parameters of this session mapped by their id. */
    readonly parameters: { [key: string]: IParameter };
    /** Returns the ticket of the session. */
    readonly ticket: string;

    // #endregion Properties (6)

    // #region Public Methods (12)

    /**
     * Creates a new output with the specified id
     * @param id 
     */
    createOutput(id: string): IOutput
    /**
     * Customizes the scene with the current parameters settings.
     */
    customize(): Promise<TreeNode>;
    /**
     * Get export by id.
     * @param id 
     */
    getExportById(id: string): IExport[];
    /**
     * Get export by name (multiple could have the same).
     * @param name 
     */
    getExportByName(name: string): IExport[];
    /**
     * Get export by type (multiple could have the same).
     * @param type 
     */
    getExportByType(type: string): IExport[];
    /**
     * Get output by id.
     * @param id 
     */
    getOutputById(id: string): IOutput[];
    /**
     * Get output by name (multiple could have the same).
     * @param name 
     */
    getOutputByName(name: string): IOutput[];
    /**
     * Get parameter by id.
     * @param id 
     */
    getParameterById(id: string): IParameter[];
    /**
     * Get parameter by name (multiple could have the same).
     * @param name 
     */
    getParameterByName(name: string): IParameter[];
    /**
     * Get parameter by type (multiple could have the same).
     * @param type 
     */
    getParameterByType(type: string): IParameter[];
    /**
     * Redo a change that has been undone (if possible).
     */
    redoParameterChange(): void;
    /**
     * Undo the last parameter changes (if possible).
     */
    undoParameterChange(): void;

    // #endregion Public Methods (12)
}