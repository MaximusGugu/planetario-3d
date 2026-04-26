import * as THREE from "three"

export const createScene = ({ solarSystemGroup, jupiterOrbitPivot, jupiterGroup, ringsGroup }) => {
    const scene = new THREE.Scene()

    scene.add(solarSystemGroup)
    solarSystemGroup.add(jupiterOrbitPivot)
    jupiterOrbitPivot.add(jupiterGroup)
    jupiterGroup.add(ringsGroup)

    return scene
}

export const createRenderer = ({ container, toneMappingExposure }) => {
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
    })

    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = toneMappingExposure ?? 1.15
    renderer.outputColorSpace = THREE.SRGBColorSpace

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(container.offsetWidth, container.offsetHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.position = "absolute"
    renderer.domElement.style.inset = "0"
    renderer.domElement.style.zIndex = "1"
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"

    container.appendChild(renderer.domElement)

    return renderer
}
