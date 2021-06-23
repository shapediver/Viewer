export const materialDatabase: { [key: string]: any } = {
    "00": {
        "00": {
            "name": "Default material",
            "color": [211, 211, 211, 255],
            "metalness": 0,
            "roughness": 1
        },
        "properties": {
            "name": "Default materials"
        }
    },
    "01": {
        "01": {
            "name": "Default groundplane material",
            "color": [211, 211, 211, 255],
            "metalness": 0,
            "roughness": 1
        },
        "properties": {
            "name": "Groundplane materials"
        }
    },
    "02": {
        "00": {
            "name": "Default plastic material",
            "color": [211, 211, 211, 255],
            "metalness": 0,
            "roughness": 1,
            "normaltexture": "normalMap.jpg",
            "roughnesstexture": "roughnessMap.jpg"
        },
        "properties": {
            "name": "Plastic materials"
        }
    },
    "03": {
        "00": {
            "name": "Default metal material",
            "color": [205, 205, 205, 255],
            "roughness": 0.25
        },
        "01": {
            "name": "Used metal material 1",
            "color": [205, 205, 205, 255],
            "roughness": 1,
            "roughnesstexture": "roughnessMap.jpg"
        },
        "02": {
            "name": "Used metal material 2",
            "color": [205, 205, 205, 255],
            "roughness": 1,
            "roughnesstexture": "roughnessMap.jpg"
        },
        "03": {
            "name": "Used metal material 3",
            "color": [205, 205, 205, 255],
            "roughness": 1,
            "roughnesstexture": "roughnessMap.jpg"
        },
        "10": {
            "name": "Gold material",
            "color": [230, 207, 92, 255],
            "roughness": 0
        },
        "11": {
            "name": "Used gold material",
            "color": [230, 207, 92, 255],
            "roughness": 0,
            "roughnesstexture": "roughnessMap.jpg"
        },
        "21": {
            "name": "Hammered metal material",
            "color": [205, 205, 205, 255],
            "roughness": 1,
            "normaltexture": "normalMap.jpg"
        },
        "properties": {
            "name": "Metal materials",
            "metalness": 1
        }
    },
    "04": {
        "00": {
            "name": "Default glass material",
            "color": [211, 211, 211, 255],
            "metalness": 1,
            "roughness": 0,
            "transparency": 0.75
        },
        "properties": { "name": "Glass materials" }
    },
    "05": {
        "00": {
            "bitmaptexture": "map.jpg",
            "name": "Default wood material",
            "metalnesstexture": "metalnessMap.jpg",
            "normaltexture": "normalMap.jpg",
            "roughnesstexture": "roughnessMap.jpg"
        },
        "01": {
            "bitmaptexture": "map.jpg",
            "name": "Wood floor material",
            "metalnesstexture": "metalnessMap.jpg",
            "normaltexture": "normalMap.jpg",
            "roughnesstexture": "roughnessMap.jpg"
        },
        "10": {
            "bitmaptexture": "map.jpg",
            "name": "Natural oak material",
            "normaltexture": "normalMap.jpg",
            "roughnesstexture": "roughnessMap.jpg"
        },
        "11": {
            "bitmaptexture": "map.jpg",
            "name": "Premium oak material",
            "roughnesstexture": "roughnessMap.jpg"
        },
        "properties": {
            "name": "Wood materials",
            "color": [211, 211, 211, 255],
            "metalness": 0,
            "roughness": 1
        }
    },
    "06": {
        "00": {
            "bitmaptexture": "map.jpg",
            "name": "Default leather material",
            "metalnesstexture": "metalnessMap.jpg",
            "normaltexture": "normalMap.jpg",
            "roughnesstexture": "roughnessMap.jpg"
        },
        "01": {
            "bitmaptexture": "map.jpg",
            "name": "Dark brown leather material",
            "metalnesstexture": "metalnessMap.jpg",
            "normaltexture": "normalMap.jpg",
            "roughnesstexture": "roughnessMap.jpg"
        },
        "02": {
            "bitmaptexture": "map.jpg",
            "name": "Black leather material",
            "metalnesstexture": "metalnessMap.jpg",
            "normaltexture": "normalMap.jpg",
            "roughnesstexture": "roughnessMap.jpg"
        },
        "10": {
            "bitmaptexture": "map.jpg",
            "name": "Worn leather material",
            "metalnesstexture": "metalnessMap.jpg",
            "normaltexture": "normalMap.jpg",
            "roughnesstexture": "roughnessMap.jpg"
        },
        "properties": {
            "name": "Leather materials",
            "metalness": 0, "roughness": 1
        }
    },
    "07": {
        "00": {
            "bitmaptexture": "map.jpg",
            "name": "Default fabric material",
            "metalnesstexture": "metalnessMap.jpg",
            "normaltexture": "normalMap.jpg",
            "roughnesstexture": "roughnessMap.jpg"
        },
        "01": {
            "bitmaptexture": "map.jpg",
            "name": "Grey fabric material",
            "metalnesstexture": "metalnessMap.jpg",
            "normaltexture": "normalMap.jpg",
            "roughnesstexture": "roughnessMap.jpg"
        },
        "properties": {
            "name": "Fabric materials",
            "metalness": 1, "roughness": 1
        }
    }
};