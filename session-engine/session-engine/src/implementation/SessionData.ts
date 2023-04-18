import { ShapeDiverResponseDto } from '@shapediver/sdk.geometry-api-sdk-v2';
import { AbstractTreeNodeData, ITreeNodeData } from '@shapediver/viewer.shared.node-tree'
import { ISessionData } from '../interfaces/ISessionData';

export class SessionData extends AbstractTreeNodeData implements ISessionData {
    // #region Properties (1)

    #responseDto: ShapeDiverResponseDto;

    // #endregion Properties (1)

    // #region Constructors (1)

    constructor( 
        responseDto: ShapeDiverResponseDto,
        id?: string,
        version?: string
    ) {
        super(id, version);
        this.#responseDto = responseDto;
    }

    // #endregion Constructors (1)

    // #region Public Accessors (2)

    public get responseDto(): ShapeDiverResponseDto {
		return this.#responseDto;
	}

    public set responseDto(value: ShapeDiverResponseDto) {
		this.#responseDto = value;
	}

    // #endregion Public Accessors (2)

    // #region Public Methods (1)

    public clone(): ISessionData {
        return new SessionData(this.responseDto, this.id, this.version);
    }

    // #endregion Public Methods (1)
}
