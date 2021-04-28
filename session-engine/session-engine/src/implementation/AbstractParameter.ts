import { ShapeDiverResponseParameter, ShapeDiverResponseParameterGroup, ShapeDiverResponseParameterStructure } from "@shapediver/api.geometry-api-dto-v1";
import { IParameter, PARAMETERTYPE, PARAMETERVISUALIZATION } from "../interfaces/IParameter";
import { Session } from "./Session";

export abstract class AbstractParameter<T> implements IParameter<T> {
  // #region Properties (7)

  private readonly _defval: T;

  private _displayName?: string;
  private _hidden: boolean;
  private _order?: number;

  protected readonly _type: PARAMETERTYPE;
  protected readonly _visualization: PARAMETERVISUALIZATION;

  protected _value!: T;

  // #endregion Properties (7)

  // #region Constructors (1)

  constructor(
    protected readonly _mySession: Session,
    private readonly _id: string,
    private _parameterDefinition: ShapeDiverResponseParameter,
    defval: T
  ) {
    this._defval = defval;
    this._value = defval;

    this._type = <PARAMETERTYPE>this._parameterDefinition.type.toLowerCase();
    this._visualization = <PARAMETERVISUALIZATION>this._parameterDefinition.visualization;
    this._hidden = false;
  }

  // #endregion Constructors (1)

  // #region Public Accessors (14)

  /**
   * Getter defval
   * @return {T}
   */
  public get defval(): T {
    return this._defval;
  }

  /**
   * Getter displayName
   * @return {string | undefined}
   */
  public get displayName(): string | undefined {
    return this._displayName;
  }

  /**
   * Setter displayName
   * @param {string | undefined} value
   */
  public set displayName(value: string | undefined) {
    this._displayName = value;
  }

  /**
   * Getter group
   * @return {ShapeDiverResponseParameterGroup | undefined}
   */
  public get group(): ShapeDiverResponseParameterGroup | undefined {
    return this._parameterDefinition.group;
  }

  /**
   * Getter hidden
   * @return {boolean}
   */
  public get hidden(): boolean {
    return this._hidden;
  }

  /**
   * Setter hidden
   * @param {boolean} value
   */
  public set hidden(value: boolean) {
    this._hidden = value;
  }

  /**
   * Getter id
   * @return {string}
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Getter name
   * @return {string}
   */
  public get name(): string {
    return this._parameterDefinition.name;
  }

  /**
   * Getter order
   * @return {number | undefined}
   */
  public get order(): number | undefined {
    return this._order;
  }

  /**
   * Setter order
   * @param {number | undefined} value
   */
  public set order(value: number | undefined) {
    this._order = value;
  }

  /**
   * Getter structure
   * @return {ShapeDiverResponseParameterStructure | undefined}
   */
  public get structure(): ShapeDiverResponseParameterStructure | undefined {
    return this._parameterDefinition.structure;
  }

  /**
   * Getter tooltip
   * @return {string | undefined}
   */
  public get tooltip(): string | undefined {
    return this._parameterDefinition.tooltip;
  }

  /**
   * Getter value
   * @return {T}
   */
  public get value(): T {
    return this._value;
  }

  /**
   * Setter value
   * @param {T} value
   */
  public set value(value: T) {
    this._value = value;
  }

  // #endregion Public Accessors (14)

  // #region Public Abstract Accessors (2)

  /**
   * Getter type
   * @return {PARAMETERTYPE}
   */
  public abstract get type(): PARAMETERTYPE;
  /**
   * Getter visualization
   * @return {PARAMETERVISUALIZATION}
   */
  public abstract get visualization(): PARAMETERVISUALIZATION;

  // #endregion Public Abstract Accessors (2)

  // #region Public Methods (1)

  public update(value: ShapeDiverResponseParameter): void {
    this._parameterDefinition = value;
  }

  // #endregion Public Methods (1)

  // #region Public Abstract Methods (1)

  /**
   * Convert the current value to string
   * @return {string}
   */
  public abstract toString(): string;

  // #endregion Public Abstract Methods (1)
}