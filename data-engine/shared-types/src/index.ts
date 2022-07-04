import { TAG3D_JUSTIFICATION, ITag3D, ITag2D, IAnchor } from './anchor/interfaces'
import {
  ACCESSORCOMPONENTSIZE as ACCESSORCOMPONENTSIZE_V1,
  ACCESSORCOMPONENTTYPE as ACCESSORCOMPONENTTYPE_V1,
  ACCESSORTYPE as ACCESSORTYPE_V1,
  IGLTF_v1,
  IGLTF_v1_Accessor,
  IGLTF_v1_Animation,
  IGLTF_v1_Asset,
  IGLTF_v1_Buffer,
  IGLTF_v1_BufferView,
  IGLTF_v1_Camera,
  IGLTF_v1_Image,
  IGLTF_v1_Material,
  IGLTF_v1_Mesh,
  IGLTF_v1_Node,
  IGLTF_v1_Program,
  IGLTF_v1_Sampler,
  IGLTF_v1_Scene,
  IGLTF_v1_Shader,
  IGLTF_v1_Skin,
  IGLTF_v1_Technique,
  IGLTF_v1_Texture,
} from './gltfv1/IGLTF_v1'
import { ISDGTF_v1 } from './gltfv1/ISDGTF_v1'
import {
  ACCESSORCOMPONENTSIZE as ACCESSORCOMPONENTSIZE_V2,
  ACCESSORCOMPONENTTYPE as ACCESSORCOMPONENTTYPE_V2,
  ACCESSORTYPE as ACCESSORTYPE_V2,
  IGLTF_v2,
  IGLTF_v2_Accessor,
  IGLTF_v2_Animation,
  IGLTF_v2_Asset,
  IGLTF_v2_Buffer,
  IGLTF_v2_BufferView,
  IGLTF_v2_Camera,
  IGLTF_v2_Image,
  IGLTF_v2_Material,
  IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness,
  IGLTF_v2_Mesh,
  IGLTF_v2_Node,
  IGLTF_v2_Primitive,
  IGLTF_v2_Sampler,
  IGLTF_v2_Scene,
  IGLTF_v2_Skin,
  IGLTF_v2_Texture,
  ISHAPEDIVER_materials_preset,
} from './gltfv2/IGLTF_v2'
import { ITexture, IPresetMaterialDefinition, IMaterialContentData, IMaterialContentDataV1, IMaterialContentDataV2, IMaterialContentDataV3 } from './material/interfaces'
import { ISDTF, ISDTF_Accessor, ISDTF_Attribute, ISDTF_BufferView, ISDTF_Buffer, ISDTF_Chunk, ISDTF_Item, ISDTF_Node, ISDTF_TypeHint } from './sdtf/ISDTF'

export {
    IGLTF_v1, ISDGTF_v1, ACCESSORCOMPONENTTYPE_V1, ACCESSORCOMPONENTSIZE_V1, ACCESSORTYPE_V1, IGLTF_v1_Accessor, IGLTF_v1_Animation, IGLTF_v1_Asset, IGLTF_v1_Buffer, IGLTF_v1_BufferView, IGLTF_v1_Camera, IGLTF_v1_Image, IGLTF_v1_Material, IGLTF_v1_Mesh, IGLTF_v1_Node, IGLTF_v1_Program, IGLTF_v1_Sampler, IGLTF_v1_Scene, IGLTF_v1_Shader, IGLTF_v1_Skin, IGLTF_v1_Technique, IGLTF_v1_Texture
}

export {
    IGLTF_v2, ACCESSORCOMPONENTTYPE_V2, ACCESSORCOMPONENTSIZE_V2, ACCESSORTYPE_V2, IGLTF_v2_Accessor, IGLTF_v2_Animation, IGLTF_v2_Asset, IGLTF_v2_Buffer, IGLTF_v2_BufferView, IGLTF_v2_Camera, IGLTF_v2_Image, IGLTF_v2_Material, ISHAPEDIVER_materials_preset, IGLTF_v2_Material_KHR_materials_pbrSpecularGlossiness, IGLTF_v2_Primitive, IGLTF_v2_Mesh, IGLTF_v2_Node, IGLTF_v2_Sampler, IGLTF_v2_Scene, IGLTF_v2_Skin, IGLTF_v2_Texture 
}


export {
  ISDTF, ISDTF_Accessor, ISDTF_Attribute, ISDTF_BufferView, ISDTF_Buffer, ISDTF_Chunk, ISDTF_Item, ISDTF_Node, ISDTF_TypeHint
}

export {
  ITexture, IPresetMaterialDefinition, IMaterialContentData, IMaterialContentDataV1, IMaterialContentDataV2, IMaterialContentDataV3
}

export {
  TAG3D_JUSTIFICATION, ITag3D, ITag2D, IAnchor
}