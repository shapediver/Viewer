import { ISDObject } from "@shapediver/viewer.shared.types";

export abstract class AbstractObjectHelper<T extends ISDObject> {
    // #region Public Abstract Methods (6)

    /**
     * Add an object to a parent object.
     * 
     * @param obj the to-be child
     * @param parent the parent
     */
    public abstract add(obj: T, parent: T): void;
    /**
     * Add a data item to an object.
     * 
     * @param data the data item
     * @param obj the object
     */
    public abstract addData(data: any, obj: T): void;
    /**
     * Add an object to the scene.
     * 
     * @param obj the object
     */
    public abstract addToScene(obj: T): void;
    /**
     * Create an object with the specified arguments.
     * 
     * @param args the arguments for object creation
     * @returns the newly created object
     */
    public abstract create(...args: any[]): T;
    /**
     * Get the children of this object.
     * 
     * @param obj the parent object
     * @returns the children of this object in an array
     */
    public abstract getChildren(obj: T): T[];
    /**
     * Remove this object from the parent.
     * 
     * @param obj the object to remove
     * @param parent the parent
     */
    public abstract remove(obj: T, parent: T): void;

    // #endregion Public Abstract Methods (6)
}
