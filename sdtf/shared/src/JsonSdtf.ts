import { JsonAccessor } from './implementation/json/JsonAccessor'
import { JsonAttribute } from './implementation/json/JsonAttribute'
import { JsonBuffer } from './implementation/json/JsonBuffer'
import { JsonBufferView } from './implementation/json/JsonBufferView'
import { JsonChunk } from './implementation/json/JsonChunk'
import { JsonItem } from './implementation/json/JsonItem'
import { JsonNode } from './implementation/json/JsonNode'
import { JsonTypeHint } from './implementation/json/JsonTypeHint'

/**
 * Representation of the content in a Json form.
 * These interfaces are only here to help with TS typings.
 */
export interface JsonSdtf {
  // #region Properties (9)

  accessors: JsonAccessor[];
  attributes: JsonAttribute[];
  bufferViews: JsonBufferView[];
  buffers: JsonBuffer[];
  chunks: JsonChunk[];
  items: JsonItem[];
  nodes: JsonNode[];
  typeHints: JsonTypeHint[];
  version: number;

  // #endregion Properties (9)
}