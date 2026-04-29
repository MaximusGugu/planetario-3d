import * as THREE from "three"
import {
    Lensflare,
    LensflareElement,
} from "three/examples/jsm/objects/Lensflare.js"

const createCanvasTexture = ({ size = 256, draw }) => {
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext("2d")
    draw(ctx, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    return texture
}

const createRadialFlareTexture = () =>
    createCanvasTexture({
        size: 512,
        draw: (ctx, size) => {
            const center = size / 2
            const gradient = ctx.createRadialGradient(
                center,
                center,
                0,
                center,
                center,
                center
            )
            gradient.addColorStop(0, "rgba(255,255,255,1)")
            gradient.addColorStop(0.08, "rgba(255,235,180,0.98)")
            gradient.addColorStop(0.2, "rgba(255,150,48,0.55)")
            gradient.addColorStop(0.48, "rgba(255,86,22,0.17)")
            gradient.addColorStop(1, "rgba(255,86,22,0)")

            ctx.clearRect(0, 0, size, size)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, size, size)
        },
    })

const createGhostTexture = () =>
    createCanvasTexture({
        size: 256,
        draw: (ctx, size) => {
            const center = size / 2
            const gradient = ctx.createRadialGradient(
                center,
                center,
                0,
                center,
                center,
                center
            )
            gradient.addColorStop(0, "rgba(255,240,190,0.8)")
            gradient.addColorStop(0.28, "rgba(255,150,58,0.28)")
            gradient.addColorStop(0.72, "rgba(255,86,24,0.08)")
            gradient.addColorStop(1, "rgba(255,86,24,0)")

            ctx.clearRect(0, 0, size, size)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, size, size)
        },
    })

const createStreakTexture = () =>
    createCanvasTexture({
        size: 512,
        draw: (ctx, size) => {
            const center = size / 2
            const horizontal = ctx.createLinearGradient(0, center, size, center)
            horizontal.addColorStop(0, "rgba(255,130,42,0)")
            horizontal.addColorStop(0.35, "rgba(255,130,42,0.18)")
            horizontal.addColorStop(0.5, "rgba(255,246,220,0.8)")
            horizontal.addColorStop(0.65, "rgba(255,130,42,0.18)")
            horizontal.addColorStop(1, "rgba(255,130,42,0)")

            const vertical = ctx.createLinearGradient(center, 0, center, size)
            vertical.addColorStop(0, "rgba(255,190,90,0)")
            vertical.addColorStop(0.48, "rgba(255,220,150,0.18)")
            vertical.addColorStop(0.5, "rgba(255,255,255,0.55)")
            vertical.addColorStop(0.52, "rgba(255,220,150,0.18)")
            vertical.addColorStop(1, "rgba(255,190,90,0)")

            ctx.clearRect(0, 0, size, size)
            ctx.globalCompositeOperation = "lighter"
            ctx.fillStyle = horizontal
            ctx.fillRect(0, center - size * 0.055, size, size * 0.11)
            ctx.fillStyle = vertical
            ctx.fillRect(center - size * 0.02, 0, size * 0.04, size)
        },
    })

const configureLensflare = (lensflare) => {
    lensflare.material = lensflare.material || {}
    lensflare.material.depthWrite = false
    lensflare.material.transparent = true
    lensflare.material.toneMapped = false
}

const createSunLensflare = ({
    radialTexture,
    ghostTexture,
    streakTexture,
    mainSize,
    streakSize,
    brightness,
    ghostScale = 1,
}) => {
    const lensflare = new Lensflare()
    configureLensflare(lensflare)
    const elements = []

    const addElement = (texture, size, distance, color) => {
        const element = new LensflareElement(texture, size, distance, color)
        lensflare.addElement(element)
        elements.push({
            element,
            baseColor: color.clone(),
        })
    }

    addElement(
        radialTexture,
        mainSize,
        0,
        new THREE.Color(0xffcc88).multiplyScalar(brightness)
    )
    addElement(
        streakTexture,
        streakSize,
        0,
        new THREE.Color(0xffa15a).multiplyScalar(brightness)
    )
    addElement(
        ghostTexture,
        42 * ghostScale,
        0.28,
        new THREE.Color(0xffaa66)
    )
    addElement(
        ghostTexture,
        60 * ghostScale,
        0.52,
        new THREE.Color(0xff8844)
    )
    addElement(
        ghostTexture,
        88 * ghostScale,
        0.82,
        new THREE.Color(0xff6640)
    )
    addElement(
        ghostTexture,
        38 * ghostScale,
        1.18,
        new THREE.Color(0xffccaa)
    )

    lensflare.userData.setBlend = (blend) => {
        elements.forEach(({ element, baseColor }) => {
            element.color.copy(baseColor).multiplyScalar(blend)
        })
    }
    lensflare.userData.setBlend(1)

    return lensflare
}

export const createSunLighting = ({
    scene,
    solarSystemGroup,
    sunMesh,
    config,
}) => {
    const radialTexture = createRadialFlareTexture()
    const ghostTexture = createGhostTexture()
    const streakTexture = createStreakTexture()
    const flareBrightness = config.sunFlareBrightness ?? 0.75

    const sunFlareLight = new THREE.PointLight(
        0xffffff,
        config.sunNormalFlareIntensity ?? 0.35,
        0,
        0
    )
    sunFlareLight.position.copy(sunMesh.position)
    sunFlareLight.renderOrder = 1000
    const normalLensflare = createSunLensflare({
        radialTexture,
        ghostTexture,
        streakTexture,
        mainSize: config.sunFlareMainSize ?? 260,
        streakSize: config.sunFlareStreakSize ?? 360,
        brightness: flareBrightness * 0.6,
        ghostScale: 0.8,
    })
    sunFlareLight.userData.lensflare = normalLensflare
    sunFlareLight.add(normalLensflare)
    solarSystemGroup.add(sunFlareLight)

    const sunEclipseFlareLight = new THREE.PointLight(
        0xffcc88,
        config.sunEclipseFlareIntensity ?? 1.8,
        0,
        0
    )
    sunEclipseFlareLight.position.copy(sunMesh.position)
    sunEclipseFlareLight.renderOrder = 1002
    const eclipseLensflare = createSunLensflare({
        radialTexture,
        ghostTexture,
        streakTexture,
        mainSize: config.sunEclipseFlareMainSize ?? 420,
        streakSize: config.sunEclipseFlareStreakSize ?? 520,
        brightness: flareBrightness * 1.25,
        ghostScale: 1.15,
    })
    sunEclipseFlareLight.userData.lensflare = eclipseLensflare
    sunEclipseFlareLight.add(eclipseLensflare)
    solarSystemGroup.add(sunEclipseFlareLight)

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
        sunEclipseFlareLight,
    }
}
