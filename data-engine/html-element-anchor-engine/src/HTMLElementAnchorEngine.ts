import { container, singleton } from 'tsyringe'
import { HTMLElementAnchorData } from '@shapediver/viewer.shared.types'
import { TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Logger, LOGGINGTOPIC, Converter, ShapeDiverViewerDataProcessingError, InputValidator } from '@shapediver/viewer.shared.services'
import { vec3, vec4 } from 'gl-matrix'
import { Box } from '@shapediver/viewer.shared.math'
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2'

interface Tag2D {
    // #region Properties (4)

    color: any,
    location: { X: number, Y: number, Z: number }

    text: string,
    version: string,

    // #endregion Properties (4)
}

interface AnchorDataImage {
    // #region Properties (6)

    alt: string,
    height: number | string,
    hidden?: boolean,
    position?: {
        horizontal?: string,
        vertical?: string
    }

    src: string,
    width: number | string,

    // #endregion Properties (6)
}

interface AnchorDataText {
    // #region Properties (5)

    color?: any,
    hidden?: boolean,
    position?: {
        horizontal?: string,
        vertical?: string
    },
    text: string,
    textAlign?: string

    // #endregion Properties (5)
}

interface Anchor {
    // #region Properties (7)

    data?: AnchorDataImage | AnchorDataText,
    format?: 'text' | 'image',
    hideable?: boolean,
    intersectionTarget?: { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } } | string | string[]
    location: { x: number, y: number, z: number },
    version: string,
    viewports?: [],

    // #endregion Properties (7)
}

@singleton()
export class HTMLElementAnchorEngine {
    // #region Properties (2)

    private readonly _converter: Converter = <Converter>container.resolve(Converter);
    private readonly _inputValidator: InputValidator = <InputValidator>container.resolve(InputValidator);
    private readonly _logger: Logger = <Logger>container.resolve(Logger);

    // #endregion Properties (2)

    // #region Public Methods (1)

    /**
     * Load the material content into a scene graph node.
     * 
     * @param content the material content
     * @returns the scene graph node 
     */
    public async loadContent(content: ShapeDiverResponseOutputContent, loadImage: (img: string) => Promise<Blob>): Promise<TreeNode> {
        try {
            const data = content.data;
            const node = new TreeNode('htmlElementAnchors');
            if (content.format === 'tag2d') {
                data.forEach((element: Tag2D) => {
                    // we need a location and a text, otherwise this doesn't make sense
                    if (!element.location || !element.text) {
                        this._logger.warn(LOGGINGTOPIC.DATAPROCESSING, 'HTMLElementAnchorEngine.load: One of the specified Tag2D elements did not have all necessary properties.');
                        return;
                    }
                    const cleanedText = this._inputValidator.sanitize(element.text);
                    node.data.push(new HTMLElementAnchorData(this._converter.toVec3(element.location), { color: this._converter.toColor(element.color, '#000000'), text: cleanedText }, 'text'));
                });
            } else if (content.format === 'anchor') {
                data.forEach((element: Anchor) => {
                    if (!element.location || !element.data) {
                        this._logger.warn(LOGGINGTOPIC.DATAPROCESSING, 'HTMLElementAnchorEngine.load: One of the specified Anchor elements did not have all necessary properties.');
                        return;
                    }

                    let position
                    if (element.data.position)
                        position = {
                            vertical: element.data.position.vertical,
                            horizontal: element.data.position.horizontal
                        }

                    let intersectionTarget;
                    if (element.intersectionTarget) {
                        if (typeof element.intersectionTarget === 'string' || Array.isArray(element.intersectionTarget)) {
                            intersectionTarget = element.intersectionTarget;
                        } else if (element.intersectionTarget.min && element.intersectionTarget.max) {
                            intersectionTarget = new Box(this._converter.toVec3(element.intersectionTarget.min), this._converter.toVec3(element.intersectionTarget.max))
                        }
                    }

                    if (!element.format || (element.format === 'text')) {
                        if (!(<AnchorDataText>element.data).text) {
                            this._logger.warn(LOGGINGTOPIC.DATAPROCESSING, 'HTMLElementAnchorEngine.load: The text property for an Anchor element is missing.');
                            return;
                        }
                        const textData = <AnchorDataText>element.data;
                        const cleanedText = this._inputValidator.sanitize(textData.text);

                        node.data.push(new HTMLElementAnchorData(
                            this._converter.toVec3(element.location),
                            {
                                color: this._converter.toColor(textData.color, '#000000'),
                                text: cleanedText,
                                hidden: textData.hidden,
                                textAlign: textData.textAlign,
                                position
                            },
                            'text',
                            element.hideable,
                            element.viewports,
                            intersectionTarget
                        ));

                    } else if (element.format === 'image') {
                        if (!(<AnchorDataImage>element.data).src || !(<AnchorDataImage>element.data).width || !(<AnchorDataImage>element.data).height || !(<AnchorDataImage>element.data).alt) {
                            this._logger.warn(LOGGINGTOPIC.DATAPROCESSING, 'HTMLElementAnchorEngine.load: One of the specified Anchor elements did not have all necessary properties.');
                            return;
                        }
                        const imageData = <AnchorDataImage>element.data;
                        node.data.push(new HTMLElementAnchorData(
                            this._converter.toVec3(element.location),
                            {
                                alt: imageData.alt,
                                height: typeof imageData.height === 'string' ? +imageData.height : imageData.height,
                                width: typeof imageData.width === 'string' ? +imageData.width : imageData.width,
                                src: imageData.src,
                                hidden: imageData.hidden,
                                position
                            },
                            'image',
                            element.hideable,
                            element.viewports,
                            intersectionTarget
                        ));
                    }
                    this._logger.warn(LOGGINGTOPIC.DATAPROCESSING, `HTMLElementAnchorEngine.load: The Anchor does not have a recognized format: ${element.format}`);
                });
            }
            return node;
        } catch (e) {
            const error = new ShapeDiverViewerDataProcessingError('HTMLElementAnchorEngine.load: Loading of anchors failed.');
            throw this._logger.handleError(LOGGINGTOPIC.DATAPROCESSING, `HTMLElementAnchorEngine.load`, error);
        }
    }

    // #endregion Public Methods (1)
}