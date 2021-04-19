import { container, singleton } from "tsyringe"
import { HTMLElementAnchorData, ISessionOutputContent } from "@shapediver/viewer.shared.types";
import { TreeNode } from "@shapediver/viewer.shared.node-tree";
import { Logger } from "@shapediver/viewer.shared.monitoring";
import { Converter } from "../../../shared/services/node_modules/@shapediver/viewer.shared.utils/dist";
import { vec3, vec4 } from "gl-matrix";
import { Box } from "@shapediver/viewer.shared.math";


interface Tag2D {
    version: string,
    color: any,
    text: string,
    location: { X: number, Y: number, Z: number }
}

interface AnchorDataImage {
    src: string,
    height: number | string,
    width: number | string,
    alt: string,
    hidden?: boolean,
    position?: {
        horizontal?: string,
        vertical?: string
    }
}

interface AnchorDataText {
    color?: any,
    text: string,
    hidden?: boolean,
    position?: {
        horizontal?: string,
        vertical?: string
    },
    textAlign?: string
}

interface Anchor {
    version: string,
    location: { x: number, y: number, z: number },
    data?: AnchorDataImage | AnchorDataText,
    viewports?: [],
    format?: 'text' | 'image',
    hideable?: boolean,
    intersectionTarget?: { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } } | string | string[]
}

@singleton()
export class HTMLElementAnchorEngine {
    private readonly _logger: Logger = <Logger>container.resolve(Logger);
    private readonly _converter: Converter = <Converter>container.resolve(Converter);

    /**
     * Load the material content into a scene graph node.
     * 
     * @param content the material content
     * @returns the scene graph node 
     */
    public async loadContent(content: ISessionOutputContent): Promise<TreeNode> {
        try {


            const data = content.data;
            const node = new TreeNode('htmlElementAnchors');
            if (content.format === 'tag2d') {
                data.forEach((element: Tag2D) => {
                    // we need a location and a text, otherwise this doesn't make sense
                    if (!element.location || !element.text) {
                        this._logger.warn('One of the specified Tag2D elements did not have all necessary properties.');
                        return;
                    }
                    node.data.push(new HTMLElementAnchorData(this._converter.toVec3(element.location), { color: this._converter.toColor(element.color, vec3.fromValues(0, 0, 0)), text: element.text }, 'text'));
                });
            } else if (content.format === 'anchor') {
                data.forEach((element: Anchor) => {
                    if (!element.location || !element.data) {
                        this._logger.warn('One of the specified Anchor elements did not have all necessary properties.');
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
                            this._logger.warn('The text property for an Anchor element is missing.');
                            return;
                        }
                        const textData = <AnchorDataText>element.data;
                        node.data.push(new HTMLElementAnchorData(
                            this._converter.toVec3(element.location),
                            {
                                color: this._converter.toColor(textData.color, vec3.fromValues(0, 0, 0)),
                                text: textData.text,
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
                            this._logger.warn('One of the specified Anchor elements did not have all necessary properties.');
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
                    this._logger.warn(`The Anchor does not have a recognized format: ${element.format}`);
                });
            }
            return node;
        } catch (e) {
            this._logger.error('Loading of anchors failed.', e);
            return new TreeNode();
        }
    }
}