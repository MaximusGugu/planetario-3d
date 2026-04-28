import * as THREE from "three"
import {
    Lensflare,
    LensflareElement,
} from "three/examples/jsm/objects/Lensflare.js"

export const createSunLighting = ({
    scene,
    solarSystemGroup,
    sunMesh,
    loadTexture,
    config,
}) => {
    const flareTexture0 = config.sunFlareTexture
        ? loadTexture(config.sunFlareTexture)
        : loadTexture(
            "https://threejs.org/examples/textures/lensflare/lensflare0.png"
        )

    const flareTexture3 = loadTexture(
        "https://threejs.org/examples/textures/lensflare/lensflare3.png"
    )

    flareTexture0.colorSpace = THREE.SRGBColorSpace
    flareTexture3.colorSpace = THREE.SRGBColorSpace

    const sunFlareLight = new THREE.PointLight(
        0xffffff,
        config.sunFlareIntensity ?? 0.8,
        0,
        0
    )
    sunFlareLight.position.copy(sunMesh.position)
    sunFlareLight.renderOrder = 1000

    const lensflare = new Lensflare()
    const flareBrightness = config.sunFlareBrightness ?? 0.6
    lensflare.material = lensflare.material || {}
    lensflare.material.depthWrite = false
    lensflare.material.transparent = true
    lensflare.material.toneMapped = false

    lensflare.addElement(
        new LensflareElement(
            flareTexture0,
            config.sunFlareMainSize ?? 220,
            0,
            new THREE.Color(0xffcc88).multiplyScalar(flareBrightness)
        )
    )

    lensflare.addElement(
        new LensflareElement(
            flareTexture3,
            config.sunFlareGhost1Size ?? 48,
            0.3,
            new THREE.Color(0xffaa66)
        )
    )
    lensflare.addElement(
        new LensflareElement(
            flareTexture3,
            config.sunFlareGhost2Size ?? 70,
            0.5,
            new THREE.Color(0xff8844)
        )
    )
    lensflare.addElement(
        new LensflareElement(
            flareTexture3,
            config.sunFlareGhost3Size ?? 100,
            0.75,
            new THREE.Color(0xff6666)
        )
    )
    lensflare.addElement(
        new LensflareElement(
            flareTexture3,
            config.sunFlareGhost4Size ?? 52,
            1,
            new THREE.Color(0xff99aa)
        )
    )
    lensflare.addElement(
        new LensflareElement(
            flareTexture3,
            config.sunFlareGhost4Size ?? 42,
            1.3,
            new THREE.Color(0xffccdd)
        )
    )

    sunFlareLight.add(lensflare)

    solarSystemGroup.add(sunFlareLight)

    const sunFlareSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: flareTexture0,
            color: new THREE.Color(1, 1, 1),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            toneMapped: false,
        })
    )
    sunFlareSprite.scale.setScalar(config.sunFlareSpriteSize ?? 12)
    sunFlareSprite.renderOrder = 1001
    sunFlareSprite.frustumCulled = false
    sunMesh.add(sunFlareSprite)

    const FOCUSED_LAYER = 3

    const sunLight = new THREE.PointLight(
        0xffffff,
        config.sunIntensity ?? 14,
        0
    )
    sunLight.decay = 0
    sunLight.position.set(0, 0, 0)
    solarSystemGroup.add(sunLight)

    const directionalLight = new THREE.DirectionalLight(
        0xffffff,
        config.sunIntensity ?? 8
    )
    directionalLight.position.set(0, 0, 0)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 200
    directionalLight.shadow.camera.left = -20
    directionalLight.shadow.camera.right = 20
    directionalLight.shadow.camera.top = 20
    directionalLight.shadow.camera.bottom = -20
    scene.add(directionalLight)

    const focusedSunLight = new THREE.PointLight(
        0xffffff,
        config.sunIntensity ?? 14,
        0
    )
    focusedSunLight.decay = 0
    focusedSunLight.position.set(0, 0, 0)
    focusedSunLight.layers.set(FOCUSED_LAYER)
    solarSystemGroup.add(focusedSunLight)

    const focusedDirectionalLight = new THREE.DirectionalLight(
        0xffffff,
        config.sunIntensity ?? 8
    )
    focusedDirectionalLight.position.set(0, 0, 0)
    focusedDirectionalLight.castShadow = true
    focusedDirectionalLight.shadow.mapSize.width = 2048
    focusedDirectionalLight.shadow.mapSize.height = 2048
    focusedDirectionalLight.shadow.camera.near = 0.1
    focusedDirectionalLight.shadow.camera.far = 200
    focusedDirectionalLight.shadow.camera.left = -20
    focusedDirectionalLight.shadow.camera.right = 20
    focusedDirectionalLight.shadow.camera.top = 20
    focusedDirectionalLight.shadow.camera.bottom = -20
    focusedDirectionalLight.layers.set(FOCUSED_LAYER)
    scene.add(focusedDirectionalLight)

    const focusLight = new THREE.DirectionalLight(
        0xffffff,
        config.focusLightIntensity ?? 1.6
    )
    focusLight.castShadow = true
    focusLight.shadow.mapSize.width = 2048
    focusLight.shadow.mapSize.height = 2048
    focusLight.shadow.camera.near = 0.1
    focusLight.shadow.camera.far = 200
    focusLight.shadow.camera.left = -20
    focusLight.shadow.camera.right = 20
    focusLight.shadow.camera.top = 20
    focusLight.shadow.camera.bottom = -20
    focusLight.layers.set(FOCUSED_LAYER)
    scene.add(focusLight)

    const asteroidSunLight = new THREE.DirectionalLight(
        0xffffff,
        0
    )
    asteroidSunLight.layers.set(1)
    asteroidSunLight.layers.disable(0)
    asteroidSunLight.layers.disable(2)
    asteroidSunLight.castShadow = false
    scene.add(asteroidSunLight)

    const ambient = new THREE.AmbientLight(
        0xffffff,
        config.ambientIntensity ?? 0
    )
    ambient.layers.enable(2)
    ambient.layers.enable(FOCUSED_LAYER)
    scene.add(ambient)

    return {
        sunLight,
        directionalLight,
        focusedSunLight,
        focusedDirectionalLight,
        focusLight,
        asteroidSunLight,
        ambient,
        sunFlareLight,
        sunFlareSprite,
    }
}
