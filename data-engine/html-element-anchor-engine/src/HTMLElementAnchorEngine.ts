import { container, singleton } from 'tsyringe'
import { HTMLElementAnchorData, HTMLElementAnchorTextData, HTMLElementAnchorImageData, IAnchorDataText, IAnchorDataImage } from '@shapediver/viewer.shared.types'
import { ITreeNode, TreeNode } from '@shapediver/viewer.shared.node-tree'
import { Logger, LOGGING_TOPIC, Converter, ShapeDiverViewerDataProcessingError, InputValidator } from '@shapediver/viewer.shared.services'
import { vec3, vec4 } from 'gl-matrix'
import { Box } from '@shapediver/viewer.shared.math'
import { ShapeDiverResponseOutputContent } from '@shapediver/sdk.geometry-api-sdk-v2'
import { IAnchor, ITag2D } from '@shapediver/viewer.data-engine.shared-types'

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
    public async loadContent(content: ShapeDiverResponseOutputContent): Promise<ITreeNode> {
        try {
            const node = new TreeNode('htmlElementAnchors');
            if (content.format === 'tag2d') {
                const data: ITag2D[] = content.data;
                data.forEach((element: ITag2D) => {
                    // we need a location and a text, otherwise this doesn't make sense
                    if (!element.location || !element.text) {
                        this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'HTMLElementAnchorEngine.load: One of the specified Tag2D elements did not have all necessary properties.');
                        return;
                    }
                    const cleanedText = this._inputValidator.sanitize(element.text);
                    node.data.push(new HTMLElementAnchorTextData({
                        location: this._converter.toVec3(element.location),
                        data: { color: this._converter.toColor(element.color, '#000000'), text: cleanedText }
                    }))
                });
            } else if (content.format === 'anchor') {
                const data: IAnchor[] = content.data;
                data.forEach((element: IAnchor) => {
                    if (!element.location || !element.data) {
                        this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'HTMLElementAnchorEngine.load: One of the specified Anchor elements did not have all necessary properties.');
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
                        if (!(<IAnchorDataText>element.data).text) {
                            this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'HTMLElementAnchorEngine.load: The text property for an Anchor element is missing.');
                            return;
                        }
                        const textData = <IAnchorDataText>element.data;
                        const cleanedText = this._inputValidator.sanitize(textData.text);

                        node.data.push(new HTMLElementAnchorTextData({
                            location: this._converter.toVec3(element.location),
                            data: {
                                color: this._converter.toColor(textData.color, '#000000'),
                                text: cleanedText,
                                hidden: textData.hidden,
                                textAlign: textData.textAlign,
                                position
                            },
                            hideable: element.hideable,
                            viewports: element.viewports,
                            intersectionTarget
                        }));

                    } else if (element.format === 'image') {
                        if (!(<IAnchorDataImage>element.data).src || !(<IAnchorDataImage>element.data).width || !(<IAnchorDataImage>element.data).height || !(<IAnchorDataImage>element.data).alt) {
                            this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, 'HTMLElementAnchorEngine.load: One of the specified Anchor elements did not have all necessary properties.');
                            return;
                        }
                        const imageData = <IAnchorDataImage>element.data;
                        node.data.push(new HTMLElementAnchorImageData({
                            location: this._converter.toVec3(element.location),
                            data: {
                                alt: imageData.alt,
                                height: typeof imageData.height === 'string' ? +imageData.height : imageData.height,
                                width: typeof imageData.width === 'string' ? +imageData.width : imageData.width,
                                src: imageData.src,
                                hidden: imageData.hidden,
                                position
                            },
                            hideable: element.hideable,
                            viewports: element.viewports,
                            intersectionTarget
                        }));
                    }
                    this._logger.warn(LOGGING_TOPIC.DATA_PROCESSING, `HTMLElementAnchorEngine.load: The Anchor does not have a recognized format: ${element.format}`);
                });
            }
            return node;
        } catch (e) {
            const error = new ShapeDiverViewerDataProcessingError('HTMLElementAnchorEngine.load: Loading of anchors failed.');
            throw this._logger.handleError(LOGGING_TOPIC.DATA_PROCESSING, `HTMLElementAnchorEngine.load`, error);
        }
    }

    // #endregion Public Methods (1)
}