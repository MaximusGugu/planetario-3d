import React, { useEffect, useRef, useState } from "react"
import * as THREE from "https://esm.sh/three@0.160.0"
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js"
import { EffectComposer } from "https://esm.sh/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "https://esm.sh/three@0.160.0/examples/jsm/postprocessing/RenderPass.js"
import { ShaderPass } from "https://esm.sh/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js"
import { UnrealBloomPass } from "https://esm.sh/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "https://esm.sh/three@0.160.0/examples/jsm/postprocessing/OutputPass.js"
import {
    Lensflare,
    LensflareElement,
} from "https://esm.sh/three@0.160.0/examples/jsm/objects/Lensflare"

const GrainShader = {
    uniforms: {
        tDiffuse: { value: null },
        amount: { value: 0.015 },
        time: { value: 0.0 },
        brightnessProtect: { value: 0.75 },
    },
    vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "vUv = uv;",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}",
    ].join("\n"),
    fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "uniform float amount;",
        "uniform float time;",
        "uniform float brightnessProtect;",
        "varying vec2 vUv;",

        "float random(vec2 p) {",
        "return fract(sin(dot(p + time, vec2(12.9898, 78.233))) * 43758.5453);",
        "}",

        "void main() {",
        "vec4 color = texture2D(tDiffuse, vUv);",

        "float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));",

        // protege áreas brilhantes como o Sol / Bloom
        "float protect = 1.0 - smoothstep(brightnessProtect, 1.0, luminance);",

        // ruído mais visível no escuro, quase zero no brilho
        "float noise = (random(vUv) - 0.5) * amount * protect;",

        // ruído multiplicativo, não estoura branco/preto
        "color.rgb += color.rgb * noise;",

        "gl_FragColor = color;",
        "}",
    ].join("\n"),
}

const BASE_MOONS = ["Jupiter", "Callisto", "Europa", "Ganymede", "IO", "Moon"]

const PLANET_NAV = [
    "Mercury",
    "Venus",
    "Earth",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
]

const REAL_SCALE_RATIO = {
    Sun: 109,

    Mercury: 0.38,
    Venus: 0.95,
    Earth: 1,
    Moon: 0.27,
    Mars: 0.53,
    Jupiter: 11.2,
    Saturn: 9.45,
    Uranus: 4,
    Neptune: 3.88,

    IO: 0.286,
    Europa: 0.245,
    Ganymede: 0.413,
    Callisto: 0.378,
}

const REAL_SCALE_VISUAL_RATIO = {
    Sun: 28,

    Mercury: 0.38,
    Venus: 0.95,
    Earth: 1,
    Moon: 0.27,
    Mars: 0.53,
    Jupiter: 11.2,
    Saturn: 9.45,
    Uranus: 4,
    Neptune: 3.88,
}

const SCENE_PRESETS = {}

const getSceneConfig = (props, sceneId) => {
    const customScene = props.scenes?.find((scene) => scene.id === sceneId)

    if (customScene) {
        return {
            name: customScene.label || customScene.id,
            camera: {
                position: [
                    customScene.camX ?? 0,
                    customScene.camY ?? 0.6,
                    customScene.camZ ?? 28,
                ],
                target: [
                    customScene.targetX ?? 1.5,
                    customScene.targetY ?? 0,
                    customScene.targetZ ?? 0,
                ],
                distance: customScene.camZ ?? 28,
            },
            objects: customScene.objects || [],
        }
    }

    return null
}

const DEFAULT_SYSTEM = {
    Jupiter: { radius: 1, position: [0, 0, 0], color: 0xd68b4a },
    Europa: {
        radius: 0.02,
        position: [1.5266029, -0.21509023, -1.41535184],
        color: 0xd8d2bd,
    },
    Ganymede: {
        radius: 0.02,
        position: [3.46876701, -0.03102102, 1.47353192],
        color: 0x8f7d68,
    },
    IO: {
        radius: 0.02,
        position: [0.78437079, -0.03102102, 1.74507503],
        color: 0xe0b46a,
    },
    Callisto: {
        radius: 0.02,
        position: [-3.08223687, -0.03102102, -1.09343633],
        color: 0x6f6258,
    },
}
const SCENE_BUNDLES = {
    Earth: ["Earth", "Earth_Clouds", "Moon"],
    Jupiter: ["Jupiter", "Callisto", "Europa", "Ganymede", "IO"],
    Saturn: ["Saturn"],
    Uranus: ["Uranus"],
    Neptune: ["Neptune"],
    Sun: ["Sun"],
    Mercury: ["Mercury"],
    Venus: ["Venus"],
    Mars: ["Mars"],
    Moon: ["Moon"],
}

export default function SolarSystemRenderer(props) {
    const containerRef = useRef(null)
    const rendererRef = useRef(null)
    const controlsRef = useRef(null)
    const sceneRef = useRef(null)
    const cameraRef = useRef(null)
    const composerRef = useRef(null)

    const inactivityTimerRef = useRef(null)
    const isUserActiveRef = useRef(true)

    const sceneOverrideRef = useRef({})
    const sceneUnitsRef = useRef({})
    const sceneUnitSavedStateRef = useRef({})
    const moonsRef = useRef({})
    const pivotsRef = useRef({})
    const planetPivotsRef = useRef({})
    const navigationTargetsRef = useRef({})
    const solarSystemGroup = useRef(new THREE.Group())
    const jupiterOrbitPivot = useRef(new THREE.Group())
    const jupiterGroup = useRef(new THREE.Group())
    const ringsGroup = useRef(new THREE.Group())
    const saturnRingsGroup = useRef(new THREE.Group())
    const uranusRingsGroup = useRef(new THREE.Group())
    const neptuneRingsGroup = useRef(new THREE.Group())
    const sunPosLerp = useRef(new THREE.Vector3())

    const [labels, setLabels] = useState([])
    const [focusedMoon, setFocusedMoon] = useState(null)
    const focusedMoonRef = useRef(null)
    const [isInsideJupiter, setIsInsideJupiter] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [autoHideUI, setAutoHideUI] = useState(false)

    const [cleanNavigationMode, setCleanNavigationMode] = useState(false)
    const [freeFlightMode, setFreeFlightMode] = useState(false)
    const [menuHoverZone, setMenuHoverZone] = useState(false)
    const ignoreMenuHoverRef = useRef(false)
    const hideMenuUntilMouseLeavesRef = useRef(false)
    const [menuForceHidden, setMenuForceHidden] = useState(false)
    const menuRevealUnlockAtRef = useRef(0)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const [activeScene, setActiveScene] = useState(null)
    const [simMenuOpen, setSimMenuOpen] = useState(false)
    const activeSceneRef = useRef(null)
    const sceneStartTimeRef = useRef(0)
    const originalScalesRef = useRef({})

    const sceneSavedStateRef = useRef({})

    const [isLoadingAssets, setIsLoadingAssets] = useState(true)
    const [loadingProgress, setLoadingProgress] = useState(0)

    const [cfg, setCfg] = useState({
        sunIntensity: props.sunIntensity,
        bloomStrength: props.bloomStrength ?? 0.55,
        bloomRadius: props.bloomRadius ?? 0.65,
        bloomThreshold: props.bloomThreshold ?? 0.05,
        ambientIntensity: props.ambientIntensity,
        orbitSpeed: props.orbitSpeed,
        rotateSpeed: props.rotateSpeed,
        autoRotate: props.autoRotate,
        showText: props.showText,
        hideUI: false,
    })

    const cfgRef = useRef(cfg)
    const selectedMoonRef = useRef(null)
    const isInsideRef = useRef(false)
    const freeNavigationRef = useRef(false)
    const hasUserInteractedRef = useRef(false)
    const savedFocusRef = useRef(null)
    const savedDistanceRef = useRef(null)

    const currentViewRef = useRef({ mode: "focus", target: "Jupiter" })
    const viewHistoryRef = useRef([])
    const suppressHistoryRef = useRef(false)

    const pushCurrentViewToHistory = () => {
        if (suppressHistoryRef.current) return
        viewHistoryRef.current.push({ ...currentViewRef.current })
    }

    const targetDistance = useRef(props.maxZoom || 10)
    const currentDistance = useRef(props.maxZoom || 10)
    const cameraTarget = useRef(
        new THREE.Vector3(
            props.targetStartX ?? props.jupiterOrbitDist ?? 45,
            props.targetStartY ?? 0,
            props.targetStartZ ?? 0
        )
    )

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [mouseScreenPos, setMouseScreenPos] = useState({ x: -9999, y: -9999 })
    const [hoveredObjectName, setHoveredObjectName] = useState(null)
    const raycasterRef = useRef(new THREE.Raycaster())
    const mouseNdcRef = useRef(new THREE.Vector2())
    const propsRef = useRef(props)

    const registerSceneUnit = ({
        name,
        type = "object",
        root,
        body,
        focusTarget,
        orbitPivot = null,
        parent = null,
        children = [],
        hideWithScene = true,
    }) => {
        if (!name || !root) return

        sceneUnitsRef.current[name] = {
            name,
            type,
            root,
            body: body || root,
            focusTarget: focusTarget || body || root,
            orbitPivot,
            parent,
            children,
            hideWithScene,
        }
    }

    const getSceneUnit = (name) => {
        return sceneUnitsRef.current[name] || null
    }

    const getSceneUnitTarget = (name) => {
        const unit = getSceneUnit(name)
        return unit?.focusTarget || moonsRef.current[name] || null
    }

    const saveSceneUnitState = () => {
        sceneUnitSavedStateRef.current = {}

        Object.entries(sceneUnitsRef.current).forEach(([name, unit]) => {
            const root = unit.root
            if (!root) return

            sceneUnitSavedStateRef.current[name] = {
                position: root.position.clone(),
                rotation: root.rotation.clone(),
                scale: root.scale.clone(),
                visible: root.visible,
            }
        })
    }

    const restoreSceneUnitVisibility = () => {
        Object.values(sceneUnitsRef.current).forEach((unit) => {
            if (unit?.root) unit.root.visible = true
            if (unit?.body) unit.body.visible = true
        })
    }

    useEffect(() => {
        propsRef.current = props
    }, [props])

    useEffect(() => {
        cfgRef.current = cfg
    }, [cfg])

    useEffect(() => {
        focusedMoonRef.current = focusedMoon
    }, [focusedMoon])

    const getActiveOverlay = () => {
        if (!focusedMoon) return null

        if (BASE_MOONS.includes(focusedMoon)) {
            return props[`overlay${focusedMoon}`]
        }

        if (focusedMoon === "Moon") {
            return props.overlayMoon || null
        }

        if (props[`overlay${focusedMoon}`]) {
            return props[`overlay${focusedMoon}`]
        }

        const marker = props.customMarkers?.find((m) => m.name === focusedMoon)
        if (marker?.overlaySlot && marker.overlaySlot !== "none") {
            return props[`hudSlot${marker.overlaySlot}`]
        }

        return null
    }

    const ActiveOverlay = getActiveOverlay()
    const InteriorOverlay = isInsideJupiter
        ? props.overlayInteriorJupiter
        : null

    const toggleHideUI = () => {
        const next = !cleanNavigationMode

        setCleanNavigationMode(next)
        setFreeFlightMode(false)

        freeNavigationRef.current = false

        if (next) {
            ignoreMenuHoverRef.current = true
            hideMenuUntilMouseLeavesRef.current = true
            menuRevealUnlockAtRef.current = Date.now() + 700

            setMenuForceHidden(true)
            setFocusedMoon(null)
            focusedMoonRef.current = null
            setShowSettings(false)
            setMenuHoverZone(false)
            setAutoHideUI(true)
        } else {
            ignoreMenuHoverRef.current = false
            hideMenuUntilMouseLeavesRef.current = false
            menuRevealUnlockAtRef.current = 0

            setMenuForceHidden(false)
            setMenuHoverZone(false)
            setAutoHideUI(false)
        }

        setCfg((prev) => ({
            ...prev,
            hideUI: next,
        }))
    }

    const clearView = () => {
        setFocusedMoon(null)
        focusedMoonRef.current = null
        setIsInsideJupiter(false)
        isInsideRef.current = false
    }

    const startScene = (sceneName) => {
        const scenePreset = getSceneConfig(propsRef.current, sceneName)
        if (!scenePreset) return

        pushCurrentViewToHistory()

        saveSceneUnitState()

        activeSceneRef.current = sceneName
        sceneStartTimeRef.current = performance.now()

        selectedMoonRef.current = null
        focusedMoonRef.current = null

        setActiveScene(sceneName)
        setFocusedMoon(null)
        setShowSettings(false)

        freeNavigationRef.current = false
        setFreeFlightMode(false)

        currentViewRef.current = {
            mode: "scene",
            target: sceneName,
        }

        if (scenePreset.camera) {
            targetDistance.current = scenePreset.camera.distance
            currentDistance.current = scenePreset.camera.distance

            cameraTarget.current.set(
                scenePreset.camera.target[0],
                scenePreset.camera.target[1],
                scenePreset.camera.target[2]
            )
        }
    }

    const stopScene = () => {
        activeSceneRef.current = null
        setActiveScene(null)
        sceneOverrideRef.current = {}

        restoreSceneUnitVisibility()
    }
    /*
    const toggleRealScale = () => {
        if (activeScene === "realScaleLine") {
            stopScene()
        } else {
            startScene("realScaleLine")
        }
    }
*/
    const handleRealScaleClick = () => {
        startScene("realScaleLine")
        setSimMenuOpen(false)
    }

    const releaseToSpace = () => {
        if (freeFlightMode) {
            returnToClosestTarget()
            setFreeFlightMode(false)
            freeNavigationRef.current = false
            return
        }

        pushCurrentViewToHistory()

        hasUserInteractedRef.current = true
        freeNavigationRef.current = true
        selectedMoonRef.current = null
        focusedMoonRef.current = null
        savedFocusRef.current = null
        savedDistanceRef.current = null
        currentViewRef.current = { mode: "free", target: null }

        setCleanNavigationMode(false)
        setFreeFlightMode(true)
        setFocusedMoon(null)
        setIsInsideJupiter(false)
        isInsideRef.current = false
        setShowSettings(false)

        setCfg((prev) => ({ ...prev, hideUI: true }))
    }

    const restoreView = (view) => {
        suppressHistoryRef.current = true

        if (view.mode === "free") {
            freeNavigationRef.current = true
            selectedMoonRef.current = null
            focusedMoonRef.current = null
            currentViewRef.current = { mode: "free", target: null }

            setFocusedMoon(null)
            setIsInsideJupiter(false)
            isInsideRef.current = false
            setCfg((prev) => ({ ...prev, hideUI: true }))
        }

        if (view.mode === "scene" && view.target) {
            startScene(view.target)
        }

        if (view.mode === "focus" && view.target) {
            freeNavigationRef.current = false
            selectedMoonRef.current = view.target
            focusedMoonRef.current = view.target
            currentViewRef.current = { mode: "focus", target: view.target }

            const custom = props.customMarkers?.find(
                (m) => m.name === view.target
            )
            const planet = planetPivotsRef.current[view.target]

            targetDistance.current =
                view.target === "Jupiter"
                    ? (propsRef.current.focusDistPlanet ?? 6)
                    : custom
                      ? (custom.zoomDist ?? 2)
                      : planet?.type === "planet"
                        ? (propsRef.current.focusDistPlanet ?? 6)
                        : planet?.type === "moon"
                          ? (propsRef.current.focusDistMoon ?? 1.5)
                          : (propsRef.current.focusDistMoon ?? 1.5)

            setFocusedMoon(view.target)
            setIsInsideJupiter(false)
            isInsideRef.current = false
            setCfg((prev) => ({ ...prev, hideUI: false }))
        }

        setTimeout(() => {
            suppressHistoryRef.current = false
        }, 0)
    }

    const goBackView = () => {
        const previous = viewHistoryRef.current.pop()

        if (!previous) {
            clearView()
            return
        }

        restoreView(previous)
    }

    const getClosestTargetName = () => {
        const cam = cameraRef.current
        if (!cam) return "Jupiter"

        let closestName = "Jupiter"
        let closestDist = Infinity

        Object.entries(moonsRef.current).forEach(([name, obj]) => {
            if (!obj) return

            const pos = new THREE.Vector3()
            obj.getWorldPosition(pos)

            const dist = cam.position.distanceTo(pos)

            if (dist < closestDist) {
                closestDist = dist
                closestName = name
            }
        })

        return closestName
    }

    const returnToClosestTarget = () => {
        const closestName = getClosestTargetName()

        freeNavigationRef.current = false
        selectedMoonRef.current = closestName
        focusedMoonRef.current = null

        setFocusedMoon(null)
        setIsInsideJupiter(false)
        isInsideRef.current = false

        const custom = props.customMarkers?.find((m) => m.name === closestName)
        const planet = planetPivotsRef.current[closestName]

        targetDistance.current =
            closestName === "Jupiter"
                ? (propsRef.current.focusDistPlanet ?? 6)
                : custom
                  ? (custom.zoomDist ?? 2)
                  : planet?.type === "planet"
                    ? (propsRef.current.focusDistPlanet ?? 6)
                    : (propsRef.current.focusDistMoon ?? 1.5)

        setCfg((prev) => ({ ...prev, hideUI: false }))
    }

    useEffect(() => {
        if (!containerRef.current) return
        if (
            containerRef.current.offsetWidth === 0 ||
            containerRef.current.offsetHeight === 0
        )
            return

        if (rendererRef.current) {
            const oldCanvas = rendererRef.current.domElement
            rendererRef.current.dispose()
            rendererRef.current.forceContextLoss?.()
            if (oldCanvas && oldCanvas.parentNode === containerRef.current) {
                containerRef.current.removeChild(oldCanvas)
            }
            rendererRef.current = null

            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current)
            }
        }

        moonsRef.current = {}
        pivotsRef.current = {}
        planetPivotsRef.current = {}
        sceneUnitsRef.current = {}
        sceneUnitSavedStateRef.current = {}

        navigationTargetsRef.current = {}

        solarSystemGroup.current.clear()
        jupiterOrbitPivot.current.clear()
        jupiterGroup.current.clear()
        ringsGroup.current.clear()
        saturnRingsGroup.current.clear()
        uranusRingsGroup.current.clear()
        neptuneRingsGroup.current.clear()

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        })

        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = props.toneMappingExposure ?? 1.15
        renderer.outputColorSpace = THREE.SRGBColorSpace

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.setSize(
            containerRef.current.offsetWidth,
            containerRef.current.offsetHeight
        )
        renderer.setClearColor(0x000000, 0)
        renderer.domElement.style.position = "absolute"
        renderer.domElement.style.inset = "0"
        renderer.domElement.style.zIndex = "1"
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"

        containerRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const scene = new THREE.Scene()
        sceneRef.current = scene

        scene.add(solarSystemGroup.current)
        solarSystemGroup.current.add(jupiterOrbitPivot.current)
        jupiterOrbitPivot.current.add(jupiterGroup.current)
        jupiterGroup.current.add(ringsGroup.current)

        const camera = new THREE.PerspectiveCamera(
            45,
            containerRef.current.offsetWidth /
                containerRef.current.offsetHeight,
            0.01,
            5000
        )

        camera.position.set(
            props.camStartX ?? props.jupiterOrbitDist ?? 45,
            props.camStartY ?? 5,
            props.camStartZ ?? 18
        )

        cameraRef.current = camera

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.enableZoom = true
        controls.enablePan = true
        controls.panSpeed = 0.35
        controls.rotateSpeed = 0.7
        controls.minDistance = props.minZoom || 0.05
        controls.maxDistance = props.maxZoomLimit || 1000
        controls.target.set(
            props.targetStartX ?? props.jupiterOrbitDist ?? 45,
            props.targetStartY ?? 0,
            props.targetStartZ ?? 0
        )
        controlsRef.current = controls

        cameraTarget.current.set(
            props.targetStartX ?? props.jupiterOrbitDist ?? 45,
            props.targetStartY ?? 0,
            props.targetStartZ ?? 0
        )

        setIsLoadingAssets(true)
        setLoadingProgress(0)

        const loadingManager = new THREE.LoadingManager()

        loadingManager.onProgress = (url, loaded, total) => {
            setLoadingProgress(
                total > 0 ? Math.round((loaded / total) * 100) : 0
            )
        }

        loadingManager.onLoad = () => {
            setLoadingProgress(100)
            setTimeout(() => {
                setIsLoadingAssets(false)
            }, 300)
        }

        loadingManager.onError = (url) => {
            console.warn("Erro ao carregar textura:", url)
        }

        const textureLoader = new THREE.TextureLoader(loadingManager)

        const loadTexture = (url) => {
            if (!url) return null

            const texture = textureLoader.load(
                url,
                (loadedTexture) => {
                    loadedTexture.colorSpace = THREE.SRGBColorSpace
                    loadedTexture.anisotropy =
                        renderer.capabilities.getMaxAnisotropy()
                    loadedTexture.needsUpdate = true
                },
                undefined,
                (err) => {
                    console.warn("Falha ao carregar textura:", url, err)
                }
            )

            texture.colorSpace = THREE.SRGBColorSpace
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy()

            return texture
        }

        const makeSphere = ({
            name,
            textureUrl,
            radius,
            position,
            color,
            segments = 64,
            emissive = 0x000000,
            basic = false,
        }) => {
            const geometry = new THREE.SphereGeometry(
                radius,
                segments,
                segments
            )

            const texture = loadTexture(textureUrl)

            const material = basic
                ? new THREE.MeshBasicMaterial({
                      map: texture || null,
                      color: texture
                          ? new THREE.Color(
                                props.sunColorR ?? 1.2,
                                props.sunColorG ?? 1.1,
                                props.sunColorB ?? 0.9
                            )
                          : color,
                      toneMapped: false,
                  })
                : new THREE.MeshStandardMaterial({
                      map: texture || null,
                      color: texture ? 0xffffff : color,
                      roughness: 0.85,
                      metalness: 0,
                      emissive,
                      side: THREE.FrontSide,
                  })

            const mesh = new THREE.Mesh(geometry, material)
            mesh.name = name
            mesh.userData.baseRadius = radius
            mesh.position.set(position[0], position[1], position[2])

            return mesh
        }

        const makeRingPlane = ({
            name,
            textureUrl,
            width,
            height,
            rotX,
            rotY,
            rotZ,
            scale,
            opacity,
            alphaTest,
        }) => {
            const texture = loadTexture(textureUrl)

            const material = new THREE.ShaderMaterial({
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                uniforms: {
                    map: { value: texture },
                    opacity: { value: opacity ?? 0.6 },
                    alphaTestValue: { value: alphaTest ?? 0.03 },
                    lightBoost: {
                        value:
                            name === "Saturn Rings"
                                ? (props.saturnRingLightBoost ?? 0.5)
                                : name === "Uranus Rings"
                                  ? (props.uranusRingLightBoost ?? 0.35)
                                  : name === "Neptune Rings"
                                    ? (props.neptuneRingLightBoost ?? 0.3)
                                    : (props.ringLightBoost ?? 0.4),
                    },
                    shadowStrength: {
                        value:
                            name === "Saturn Rings"
                                ? (props.saturnRingShadowStrength ?? 0.75)
                                : name === "Uranus Rings"
                                  ? (props.uranusRingShadowStrength ?? 0.65)
                                  : name === "Neptune Rings"
                                    ? (props.neptuneRingShadowStrength ?? 0.65)
                                    : (props.ringShadowStrength ?? 0.6),
                    },
                    shadowWidth: {
                        value:
                            name === "Saturn Rings"
                                ? (props.saturnRingShadowWidth ?? 0.18)
                                : name === "Uranus Rings"
                                  ? (props.uranusRingShadowWidth ?? 0.16)
                                  : name === "Neptune Rings"
                                    ? (props.neptuneRingShadowWidth ?? 0.16)
                                    : (props.ringShadowWidth ?? 0.18),
                    },
                    sunDir: { value: new THREE.Vector2(1, 0) },
                },
                vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
                fragmentShader: `
            uniform sampler2D map;
            uniform float opacity;
            uniform float alphaTestValue;
            uniform float lightBoost;
            uniform float shadowStrength;
            uniform float shadowWidth;
            uniform vec2 sunDir;

            varying vec2 vUv;

            void main() {
                vec4 tex = texture2D(map, vUv);

                float alpha = tex.a * opacity;
                if (alpha < alphaTestValue) discard;

                vec2 center = vec2(0.5, 0.5);
                vec2 p = vUv - center;
                vec2 dir = normalize(sunDir);

                float towardSun = dot(normalize(p), dir);
                float lit = smoothstep(-0.2, 1.0, towardSun);

                float behindPlanet = 1.0 - smoothstep(-0.15, 0.0, dot(p, dir));
                float sideDistance = abs(dot(p, vec2(-dir.y, dir.x)));
                float shadowBand = 1.0 - smoothstep(shadowWidth, shadowWidth + 0.08, sideDistance);
                float shadow = behindPlanet * shadowBand * shadowStrength;

                vec3 color = tex.rgb;
                color *= 0.08 + lit * lightBoost;
                color *= 1.0 - shadow;

                gl_FragColor = vec4(color, alpha);
            }
        `,
            })

            const ring = new THREE.Mesh(
                new THREE.PlaneGeometry(width, height, 1, 1),
                material
            )

            ring.name = name
            ring.rotation.set(
                THREE.MathUtils.degToRad(rotX || 0),
                THREE.MathUtils.degToRad(rotY || 0),
                THREE.MathUtils.degToRad(rotZ || 0)
            )
            ring.scale.setScalar(scale || 1)

            return ring
        }

        const sunMesh = makeSphere({
            name: "Sun",
            textureUrl: props.sunTexture,
            radius: props.sunSize || 3,
            position: [0, 0, 0],
            color: 0xffaa33,
            segments: 96,
            basic: true,
        })

        solarSystemGroup.current.add(sunMesh)
        moonsRef.current["Sun"] = sunMesh

        registerSceneUnit({
            name: "Sun",
            type: "star",
            root: sunMesh,
            body: sunMesh,
            focusTarget: sunMesh,
            children: [],
        })

        const makeGlowTexture = () => {
            const size = 512
            const canvas = document.createElement("canvas")
            canvas.width = size
            canvas.height = size

            const ctx = canvas.getContext("2d")
            const gradient = ctx.createRadialGradient(
                size / 2,
                size / 2,
                0,
                size / 2,
                size / 2,
                size / 2
            )

            gradient.addColorStop(0.0, "rgba(255,255,255,1)")
            gradient.addColorStop(0.15, "rgba(255,230,120,0.9)")
            gradient.addColorStop(0.35, "rgba(255,150,40,0.45)")
            gradient.addColorStop(0.7, "rgba(255,100,20,0.12)")
            gradient.addColorStop(1.0, "rgba(255,100,20,0)")

            ctx.clearRect(0, 0, size, size)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, size, size)

            const texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace
            texture.needsUpdate = true
            return texture
        }

        const sunGlow = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: props.sunGlowTexture
                    ? loadTexture(props.sunGlowTexture)
                    : makeGlowTexture(),
                color: 0xffffff,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                opacity: props.sunGlowOpacity ?? 0.18,
            })
        )

        sunGlow.material.toneMapped = false
        sunGlow.name = "Sun Glow"
        sunGlow.scale.setScalar(
            (props.sunSize || 3) * (props.sunGlowScale ?? 5)
        )
        sunMesh.add(sunGlow)

        const flareTexture0 = props.sunFlareTexture
            ? loadTexture(props.sunFlareTexture)
            : textureLoader.load(
                  "https://threejs.org/examples/textures/lensflare/lensflare0.png"
              )

        const flareTexture3 = textureLoader.load(
            "https://threejs.org/examples/textures/lensflare/lensflare3.png"
        )

        flareTexture0.colorSpace = THREE.SRGBColorSpace
        flareTexture3.colorSpace = THREE.SRGBColorSpace

        flareTexture0.encoding = THREE.LinearEncoding
        flareTexture3.encoding = THREE.LinearEncoding

        const sunFlareLight = new THREE.PointLight(0xffffff, 0.35, 0, 0)
        sunFlareLight.position.copy(sunMesh.position)

        const lensflare = new Lensflare()

        const flareBrightness = props.sunFlareBrightness ?? 0.4

        lensflare.addElement(
            new LensflareElement(
                flareTexture0,
                props.sunFlareMainSize ?? 220,
                0,
                new THREE.Color(0xff6600).multiplyScalar(flareBrightness)
            )
        )

        lensflare.addElement(
            new LensflareElement(
                flareTexture3,
                props.sunFlareGhost1Size ?? 25,
                0.45
            )
        )

        lensflare.addElement(
            new LensflareElement(
                flareTexture3,
                props.sunFlareGhost2Size ?? 35,
                0.65
            )
        )

        lensflare.addElement(
            new LensflareElement(
                flareTexture3,
                props.sunFlareGhost3Size ?? 55,
                0.85
            )
        )

        lensflare.addElement(
            new LensflareElement(
                flareTexture3,
                props.sunFlareGhost4Size ?? 30,
                1
            )
        )

        sunFlareLight.add(lensflare)

        lensflare.material = lensflare.material || {}

        solarSystemGroup.current.add(sunFlareLight)

        const sunLight = new THREE.PointLight(
            0xffffff,
            props.sunIntensity ?? 14,
            0
        )
        sunLight.decay = 0
        sunLight.position.set(0, 0, 0)
        solarSystemGroup.current.add(sunLight)

        const directionalLight = new THREE.DirectionalLight(
            0xffffff,
            props.sunIntensity ?? 8
        )

        directionalLight.position.set(0, 0, 0) // vem do sol
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

        const ambient = new THREE.AmbientLight(
            0xffffff,
            props.ambientIntensity ?? 0
        )
        scene.add(ambient)

        sunPosLerp.current.set(props.sunX ?? -10, 0, props.sunZ ?? 5)

        const planets = [
            {
                name: "Mercury",
                displayname: "Mercúrio",
                texture: props.mercuryTexture,
                dist: props.mercuryDist ?? 12,
                size: props.mercurySize ?? 0.18,
                speed: props.mercurySpeed ?? 1.6,
                tiltX: props.mercuryTiltX ?? 0,
                tiltZ: props.mercuryTiltZ ?? 7,
                startAngle: props.mercuryStartAngle ?? 15,
                color: 0x9b8b7a,
            },
            {
                name: "Venus",
                displayname: "Vênus",
                texture: props.venusTexture,
                dist: props.venusDist ?? 18,
                size: props.venusSize ?? 0.34,
                speed: props.venusSpeed ?? 1.2,
                tiltX: props.venusTiltX ?? 0,
                tiltZ: props.venusTiltZ ?? 3,
                startAngle: props.venusStartAngle ?? 75,
                color: 0xd8b26a,
            },
            {
                name: "Earth",
                displayname: "Terra",
                texture: props.earthTexture,
                dist: props.earthDist ?? 24,
                size: props.earthSize ?? 0.36,
                speed: props.earthSpeed ?? 1,
                tiltX: props.earthTiltX ?? 0,
                tiltZ: props.earthTiltZ ?? 0,
                startAngle: props.earthStartAngle ?? 150,
                color: 0x4f8bd8,
            },
            {
                name: "Mars",
                displayname: "Marte",
                texture: props.marsTexture,
                dist: props.marsDist ?? 31,
                size: props.marsSize ?? 0.28,
                speed: props.marsSpeed ?? 0.8,
                tiltX: props.marsTiltX ?? 0,
                tiltZ: props.marsTiltZ ?? 1.8,
                startAngle: props.marsStartAngle ?? 220,
                color: 0xb65a3a,
            },
            {
                name: "Saturn",
                displayname: "Saturno",
                texture: props.saturnTexture,
                dist: props.saturnDist ?? 62,
                size: props.saturnSize ?? 0.9,
                speed: props.saturnSpeed ?? 0.3,
                tiltX: props.saturnTiltX ?? 0,
                tiltZ: props.saturnTiltZ ?? 2.5,
                startAngle: props.saturnStartAngle ?? 300,
                color: 0xc9ad7a,
            },
            {
                name: "Uranus",
                displayname: "Urano",
                texture: props.uranusTexture,
                dist: props.uranusDist ?? 78,
                size: props.uranusSize ?? 0.65,
                speed: props.uranusSpeed ?? 0.2,
                tiltX: props.uranusTiltX ?? 0,
                tiltZ: props.uranusTiltZ ?? 0.8,
                startAngle: props.uranusStartAngle ?? 35,
                color: 0x80c7d8,
            },
            {
                name: "Neptune",
                displayname: "Netuno",
                texture: props.neptuneTexture,
                dist: props.neptuneDist ?? 95,
                size: props.neptuneSize ?? 0.65,
                speed: props.neptuneSpeed ?? 0.15,
                tiltX: props.neptuneTiltX ?? 0,
                tiltZ: props.neptuneTiltZ ?? 1.8,
                startAngle: props.neptuneStartAngle ?? 115,
                color: 0x385bd8,
            },
        ]

        planets.forEach((planet) => {
            const pivot = new THREE.Group()
            pivot.name = `${planet.name}_Orbit`
            pivot.rotation.x = THREE.MathUtils.degToRad(planet.tiltX || 0)
            pivot.rotation.z = THREE.MathUtils.degToRad(planet.tiltZ || 0)
            pivot.rotation.y = THREE.MathUtils.degToRad(planet.startAngle || 0)

            solarSystemGroup.current.add(pivot)

            const mesh = makeSphere({
                name: planet.name,
                textureUrl: planet.texture,
                radius: planet.size,
                position: [planet.dist, 0, 0],
                color: planet.color,
                segments: 48,
            })

            mesh.castShadow = true

            pivot.add(mesh)

            // 🌥️ NUVENS DA TERRA
            if (planet.name === "Earth") {
                const cloudMesh = makeSphere({
                    name: "Earth Clouds",
                    textureUrl: props.earthCloudsTexture,
                    radius: planet.size * 1.01,
                    position: [planet.dist, 0, 0],
                    color: 0xffffff,
                    segments: 48,
                })

                cloudMesh.material.transparent = true
                cloudMesh.material.opacity = props.earthCloudsOpacity ?? 0.5
                cloudMesh.material.depthWrite = false

                pivot.add(cloudMesh)

                moonsRef.current["Earth_Clouds"] = cloudMesh
                cloudMesh.userData.sceneParent = "Earth"
            }

            if (planet.name === "Earth") {
                const moonPivot = new THREE.Group()

                // coloca o pivô da Lua exatamente na posição da Terra
                moonPivot.position.set(planet.dist, 0, 0)

                pivot.add(moonPivot)

                const earthMoon = makeSphere({
                    name: "Moon",
                    textureUrl: props.earthMoonTexture,
                    radius: props.earthMoonSize ?? 0.2,
                    position: [props.earthMoonDist ?? 0.8, 0, 0],
                    color: 0xaaaaaa,
                    segments: 48,
                })

                earthMoon.castShadow = true
                earthMoon.receiveShadow = true

                moonPivot.add(earthMoon)

                moonsRef.current["Moon"] = earthMoon

                pivotsRef.current["Moon"] = {
                    pivot: moonPivot,
                    mesh: earthMoon,
                    speed: props.earthMoonSpeed ?? 1,
                }

                planetPivotsRef.current["Moon"] = {
                    pivot: moonPivot,
                    mesh: earthMoon,
                    speed: props.earthMoonSpeed ?? 1,
                    type: "moon",
                }
                registerSceneUnit({
                    name: "Moon",
                    type: "moon",
                    root: moonPivot,
                    body: earthMoon,
                    focusTarget: earthMoon,
                    orbitPivot: moonPivot,
                    parent: "Earth",
                    children: [],
                })
                const earthUnit = getSceneUnit("Earth")
                if (earthUnit) {
                    earthUnit.children = [
                        ...new Set([
                            ...earthUnit.children,
                            "Earth_Clouds",
                            "Moon",
                        ]),
                    ]
                }
            }

            if (planet.name === "Saturn") {
                saturnRingsGroup.current = makeRingPlane({
                    name: "Saturn Rings",
                    textureUrl: props.saturnRingTexture,
                    width: props.saturnRingWidth ?? 3.2,
                    height: props.saturnRingHeight ?? 3.2,
                    rotX: props.saturnRingRotX ?? 90,
                    rotY: props.saturnRingRotY ?? 0,
                    rotZ: props.saturnRingRotZ ?? 0,
                    scale: props.saturnRingScale ?? 1,
                    opacity: props.saturnRingOpacity ?? 0.55,
                    alphaTest: props.saturnRingAlphaTest ?? 0.05,
                })
                mesh.add(saturnRingsGroup.current)
            }

            if (planet.name === "Uranus") {
                uranusRingsGroup.current = makeRingPlane({
                    name: "Uranus Rings",
                    textureUrl: props.uranusRingTexture,
                    width: props.uranusRingWidth ?? 2.5,
                    height: props.uranusRingHeight ?? 2.5,
                    rotX: props.uranusRingRotX ?? 90,
                    rotY: props.uranusRingRotY ?? 0,
                    rotZ: props.uranusRingRotZ ?? 0,
                    scale: props.uranusRingScale ?? 1,
                    opacity: props.uranusRingOpacity ?? 0.35,
                    alphaTest: props.uranusRingAlphaTest ?? 0.05,
                })
                mesh.add(uranusRingsGroup.current)
            }

            if (planet.name === "Neptune") {
                neptuneRingsGroup.current = makeRingPlane({
                    name: "Neptune Rings",
                    textureUrl: props.neptuneRingTexture,
                    width: props.neptuneRingWidth ?? 2.4,
                    height: props.neptuneRingHeight ?? 2.4,
                    rotX: props.neptuneRingRotX ?? 90,
                    rotY: props.neptuneRingRotY ?? 0,
                    rotZ: props.neptuneRingRotZ ?? 0,
                    scale: props.neptuneRingScale ?? 1,
                    opacity: props.neptuneRingOpacity ?? 0.3,
                    alphaTest: props.neptuneRingAlphaTest ?? 0.05,
                })
                mesh.add(neptuneRingsGroup.current)
            }

            moonsRef.current[planet.name] = mesh
            planetPivotsRef.current[planet.name] = {
                pivot,
                mesh,
                speed: planet.speed,
                type: "planet",
            }
            registerSceneUnit({
                name: planet.name,
                type: "planet",
                root: pivot,
                body: mesh,
                focusTarget: mesh,
                orbitPivot: pivot,
                parent: "Sun",
                children: [],
            })
        })

        const jupiterOrbitDist = props.jupiterOrbitDist ?? 45
        const jupiterOrbitTiltX = props.jupiterOrbitTiltX ?? 0
        const jupiterOrbitTiltZ = props.jupiterOrbitTiltZ ?? 1.3
        const jupiterStartAngle = props.jupiterStartAngle ?? 0

        jupiterOrbitPivot.current.name = "Jupiter_Orbit"
        jupiterOrbitPivot.current.rotation.x =
            THREE.MathUtils.degToRad(jupiterOrbitTiltX)
        jupiterOrbitPivot.current.rotation.z =
            THREE.MathUtils.degToRad(jupiterOrbitTiltZ)
        jupiterOrbitPivot.current.rotation.y =
            THREE.MathUtils.degToRad(jupiterStartAngle)

        jupiterGroup.current.position.set(jupiterOrbitDist, 0, 0)

        const jupiterRadius =
            props.jupiterRadius ?? DEFAULT_SYSTEM.Jupiter.radius

        const jupiter = makeSphere({
            name: "Jupiter",
            textureUrl: props.jupiterTexture,
            radius: jupiterRadius,
            position: DEFAULT_SYSTEM.Jupiter.position,
            color: DEFAULT_SYSTEM.Jupiter.color,
            segments: props.jupiterSegments || 96,
        })

        jupiter.receiveShadow = true

        jupiterGroup.current.add(jupiter)
        moonsRef.current["Jupiter"] = jupiter
        planetPivotsRef.current["Jupiter"] = {
            pivot: jupiterOrbitPivot.current,
            mesh: jupiter,
            speed: props.jupiterOrbitSpeed ?? 0.45,
            type: "planet",
        }

        registerSceneUnit({
            name: "Jupiter",
            type: "planet",
            root: jupiterOrbitPivot.current,
            body: jupiter,
            focusTarget: jupiter,
            orbitPivot: jupiterOrbitPivot.current,
            parent: "Sun",
            children: [],
        })

        if (!freeNavigationRef.current && !selectedMoonRef.current) {
            selectedMoonRef.current = "Jupiter"
            focusedMoonRef.current = null
            currentViewRef.current = { mode: "locked", target: "Jupiter" }

            targetDistance.current = props.focusDistPlanet ?? 6
            currentDistance.current = props.focusDistPlanet ?? 6

            setFocusedMoon(null)
        }

        if (props.jupiterInteriorTexture) {
            const interiorTexture = loadTexture(props.jupiterInteriorTexture)

            const interiorMaterial = new THREE.MeshBasicMaterial({
                map: interiorTexture || null,
                color: interiorTexture ? 0xffffff : 0x111111,
                side: THREE.BackSide,
                transparent: false,
                depthWrite: true,
            })

            const interiorSphere = new THREE.Mesh(
                new THREE.SphereGeometry(
                    jupiterRadius * 0.985,
                    props.jupiterSegments || 96,
                    props.jupiterSegments || 96
                ),
                interiorMaterial
            )

            interiorSphere.name = "Jupiter Interior"
            jupiterGroup.current.add(interiorSphere)
        }

        const jupiterRing = makeRingPlane({
            name: "Jupiter Rings",
            textureUrl: props.ringTexture,
            width: props.ringWidth ?? 4.5,
            height: props.ringHeight ?? 4.5,
            rotX: props.ringsRotX ?? 90,
            rotY: props.ringsRotY ?? 0,
            rotZ: props.ringsRotZ ?? 0,
            scale: props.ringsScale ?? 1,
            opacity: props.ringOpacity ?? 0.75,
            alphaTest: props.ringAlphaTest ?? 0.02,
        })

        ringsGroup.current.add(jupiterRing)

        const moonsData = [
            {
                name: "Callisto",
                displayname: "Calisto",
                textureUrl: props.callistoTexture,
                radius: props.callistoRadius ?? DEFAULT_SYSTEM.Callisto.radius,
                position: [
                    props.callistoX ?? DEFAULT_SYSTEM.Callisto.position[0],
                    props.callistoY ?? DEFAULT_SYSTEM.Callisto.position[1],
                    props.callistoZ ?? DEFAULT_SYSTEM.Callisto.position[2],
                ],
                color: DEFAULT_SYSTEM.Callisto.color,
            },
            {
                name: "Europa",
                displayname: "Europa",
                textureUrl: props.europaTexture,
                radius: props.europaRadius ?? DEFAULT_SYSTEM.Europa.radius,
                position: [
                    props.europaX ?? DEFAULT_SYSTEM.Europa.position[0],
                    props.europaY ?? DEFAULT_SYSTEM.Europa.position[1],
                    props.europaZ ?? DEFAULT_SYSTEM.Europa.position[2],
                ],
                color: DEFAULT_SYSTEM.Europa.color,
            },
            {
                name: "Ganymede",
                displayname: "Ganimedes",
                textureUrl: props.ganymedeTexture,
                radius: props.ganymedeRadius ?? DEFAULT_SYSTEM.Ganymede.radius,
                position: [
                    props.ganymedeX ?? DEFAULT_SYSTEM.Ganymede.position[0],
                    props.ganymedeY ?? DEFAULT_SYSTEM.Ganymede.position[1],
                    props.ganymedeZ ?? DEFAULT_SYSTEM.Ganymede.position[2],
                ],
                color: DEFAULT_SYSTEM.Ganymede.color,
            },
            {
                name: "IO",
                textureUrl: props.ioTexture,
                radius: props.ioRadius ?? DEFAULT_SYSTEM.IO.radius,
                position: [
                    props.ioX ?? DEFAULT_SYSTEM.IO.position[0],
                    props.ioY ?? DEFAULT_SYSTEM.IO.position[1],
                    props.ioZ ?? DEFAULT_SYSTEM.IO.position[2],
                ],
                color: DEFAULT_SYSTEM.IO.color,
            },
        ]

        moonsData.forEach((moon, index) => {
            const pivot = new THREE.Group()
            jupiterGroup.current.add(pivot)

            const mesh = makeSphere({
                name: moon.name,
                textureUrl: moon.textureUrl,
                radius: moon.radius,
                position: moon.position,
                color: moon.color,
                segments: props.moonSegments || 48,
            })

            mesh.castShadow = true
            mesh.receiveShadow = true

            pivot.add(mesh)

            moonsRef.current[moon.name] = mesh
            pivotsRef.current[moon.name] = {
                pivot,
                mesh,
                speed: 1 - index * 0.1,
            }
            planetPivotsRef.current[moon.name] = {
                pivot,
                mesh,
                speed: 1 - index * 0.1,
                type: "moon",
            }
            registerSceneUnit({
                name: moon.name,
                type: "moon",
                root: pivot,
                body: mesh,
                focusTarget: mesh,
                orbitPivot: pivot,
                parent: "Jupiter",
                children: [],
            })

            const jupiterUnit = getSceneUnit("Jupiter")
            if (jupiterUnit) {
                jupiterUnit.children = [
                    ...new Set([...jupiterUnit.children, moon.name]),
                ]
            }
        })

        props.customMarkers?.forEach((marker) => {
            if (!marker.name) return

            const markerAnchor = new THREE.Group()
            markerAnchor.name = marker.name
            markerAnchor.position.set(
                marker.x || 0,
                marker.y || 0,
                marker.z || 0
            )

            jupiterGroup.current.add(markerAnchor)
            moonsRef.current[marker.name] = markerAnchor
            registerSceneUnit({
                name: marker.name,
                type: "marker",
                root: markerAnchor,
                body: markerAnchor,
                focusTarget: markerAnchor,
                parent: "Jupiter",
                children: [],
            })

            const jupiterUnit = getSceneUnit("Jupiter")
            if (jupiterUnit) {
                jupiterUnit.children = [
                    ...new Set([...jupiterUnit.children, marker.name]),
                ]
            }
        })

        const asteroidGeo = new THREE.IcosahedronGeometry(0.05, 0)
        const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x888888 })
        const asteroidCount = props.asteroidCount ?? 600
        const instanced = new THREE.InstancedMesh(
            asteroidGeo,
            asteroidMat,
            asteroidCount
        )

        const dummy = new THREE.Object3D()

        for (let i = 0; i < asteroidCount; i++) {
            const angle = Math.random() * Math.PI * 2
            const radius =
                (props.asteroidBeltInner ?? 140) +
                Math.random() *
                    ((props.asteroidBeltOuter ?? 160) -
                        (props.asteroidBeltInner ?? 140))

            dummy.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * (props.asteroidBeltThickness ?? 0.5),
                Math.sin(angle) * radius
            )

            dummy.rotation.set(Math.random(), Math.random(), Math.random())
            dummy.scale.setScalar(Math.random() * 0.5 + 0.5)
            dummy.updateMatrix()
            instanced.setMatrixAt(i, dummy.matrix)
        }

        solarSystemGroup.current.add(instanced)

        const composer = new EffectComposer(renderer)

        const renderPass = new RenderPass(scene, camera)
        composer.addPass(renderPass)

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(
                containerRef.current.offsetWidth,
                containerRef.current.offsetHeight
            ),
            props.bloomStrength ?? 0.55,
            props.bloomRadius ?? 0.65,
            props.bloomThreshold ?? 0.05
        )

        composer.addPass(bloomPass)

        const grainPass = new ShaderPass(GrainShader)
        composer.addPass(grainPass)

        const outputPass = new OutputPass()
        composer.addPass(outputPass)

        composerRef.current = composer

        const handleMouseMove = (event) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return

            // movimento normal
            setMousePos({
                x: (event.clientX / window.innerWidth - 0.5) * 2,
                y: (event.clientY / window.innerHeight - 0.5) * 2,
            })

            setMouseScreenPos({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            })

            mouseNdcRef.current.set(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            )

            // 👇 NOVO: reset de inatividade
            isUserActiveRef.current = true

            setAutoHideUI(false)

            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current)
            }

            inactivityTimerRef.current = setTimeout(() => {
                isUserActiveRef.current = false

                setAutoHideUI(true)
            }, 3000) // 3s
        }

        window.addEventListener("mousemove", handleMouseMove)

        const handleWheel = (event) => {
            hasUserInteractedRef.current = true

            const p = propsRef.current

            targetDistance.current = Math.max(
                p.minZoom ?? 0.05,
                Math.min(
                    p.maxZoomLimit ?? 1000,
                    targetDistance.current + event.deltaY * 0.005
                )
            )
        }

        containerRef.current.addEventListener("wheel", handleWheel, {
            passive: true,
        })

        let requestID = 0

        const animate = (time) => {
            const p = propsRef.current
            const c = cfgRef.current
            const ctrl = controlsRef.current
            const cam = cameraRef.current
            const activeSceneName = activeSceneRef.current
            const activeSceneConfig = activeSceneName
                ? getSceneConfig(p, activeSceneName)
                : null
            const isRealScaleScene = activeSceneName === "realScaleLine"
            sunFlareLight.visible = !isRealScaleScene
            sunGlow.visible = !isRealScaleScene
            ringsGroup.current.rotation.x = THREE.MathUtils.degToRad(
                p.ringsRotX || 0
            )
            ringsGroup.current.rotation.y = THREE.MathUtils.degToRad(
                p.ringsRotY || 0
            )
            ringsGroup.current.rotation.z = THREE.MathUtils.degToRad(
                p.ringsRotZ || 0
            )
            ringsGroup.current.scale.setScalar(p.ringsScale || 1)

            sunFlareLight.position.copy(
                sunMesh.getWorldPosition(new THREE.Vector3())
            )

            const updateRingLight = (ringMesh) => {
                if (!ringMesh?.material?.uniforms?.sunDir) return

                const sunWorld = new THREE.Vector3()
                sunMesh.getWorldPosition(sunWorld)

                const ringWorld = new THREE.Vector3()
                ringMesh.getWorldPosition(ringWorld)

                const localSun = ringMesh.worldToLocal(sunWorld.clone())
                const localCenter = ringMesh.worldToLocal(ringWorld.clone())

                const dir = new THREE.Vector2(
                    localSun.x - localCenter.x,
                    localSun.y - localCenter.y
                )

                if (dir.lengthSq() > 0.0001) {
                    dir.normalize()
                    ringMesh.material.uniforms.sunDir.value.copy(dir)
                }
            }

            updateRingLight(ringsGroup.current.children[0])
            updateRingLight(saturnRingsGroup.current)
            updateRingLight(uranusRingsGroup.current)
            updateRingLight(neptuneRingsGroup.current)

            if (ctrl && cam && containerRef.current) {
                raycasterRef.current.setFromCamera(mouseNdcRef.current, cam)

                const hoverCandidates = Object.entries(moonsRef.current)
                    .map(([name, obj]) => ({ name, obj }))
                    .filter(({ obj }) => obj)

                const intersects = raycasterRef.current.intersectObjects(
                    hoverCandidates.map((item) => item.obj),
                    true
                )

                let hoveredName = null

                if (intersects.length > 0) {
                    const hit = intersects[0].object

                    const found = hoverCandidates.find(({ obj }) => {
                        let current = hit

                        while (current) {
                            if (current === obj) return true
                            current = current.parent
                        }

                        return false
                    })

                    if (found) hoveredName = found.name
                }

                setHoveredObjectName(hoveredName)
                const rect = containerRef.current.getBoundingClientRect()

                const expectedWidth = Math.floor(
                    rect.width * renderer.getPixelRatio()
                )
                const expectedHeight = Math.floor(
                    rect.height * renderer.getPixelRatio()
                )

                if (
                    renderer.domElement.width !== expectedWidth ||
                    renderer.domElement.height !== expectedHeight
                ) {
                    renderer.setSize(rect.width, rect.height)
                    composer.setSize(rect.width, rect.height)
                    bloomPass.setSize(rect.width, rect.height)
                    cam.aspect = rect.width / rect.height
                    cam.updateProjectionMatrix()
                }

                currentDistance.current +=
                    (targetDistance.current - currentDistance.current) *
                    (p.zoomSmoothness ?? 0.05)

                ctrl.minDistance = p.minZoom || 0.05
                ctrl.maxDistance = p.maxZoomLimit || 1000

                if (
                    activeSceneName === "realScaleLine" &&
                    activeSceneConfig?.camera &&
                    !selectedMoonRef.current
                ) {
                    const sceneCamPos = new THREE.Vector3(
                        activeSceneConfig.camera.position[0],
                        activeSceneConfig.camera.position[1],
                        activeSceneConfig.camera.position[2]
                    )

                    const sceneTarget = new THREE.Vector3(
                        activeSceneConfig.camera.target[0],
                        activeSceneConfig.camera.target[1],
                        activeSceneConfig.camera.target[2]
                    )

                    cam.position.lerp(sceneCamPos, 0.04)
                    cameraTarget.current.lerp(sceneTarget, 0.04)
                    ctrl.target.lerp(sceneTarget, 0.04)
                    ctrl.update()
                } else if (freeNavigationRef.current) {
                    ctrl.enableZoom = true
                    ctrl.enablePan = true
                    ctrl.enableRotate = true
                    ctrl.update()
                } else {
                    const moonName = selectedMoonRef.current
                    const targetSunPos = new THREE.Vector3()

                    if (moonName && moonsRef.current[moonName]) {
                        const worldPos = new THREE.Vector3()
                        moonsRef.current[moonName].getWorldPosition(worldPos)

                        cameraTarget.current.copy(worldPos)

                        const direction = new THREE.Vector3()
                            .subVectors(cam.position, ctrl.target)
                            .normalize()

                        if (!Number.isFinite(direction.x)) {
                            direction.set(0, 0, 1)
                        }

                        const desiredCamPos = new THREE.Vector3()
                            .copy(worldPos)
                            .add(
                                direction.multiplyScalar(
                                    currentDistance.current
                                )
                            )

                        cam.position.lerp(desiredCamPos, p.travelSpeed ?? 0.08)
                        targetSunPos
                            .copy(cam.position)
                            .normalize()
                            .multiplyScalar(20)
                            .add(worldPos)
                    } else {
                        cameraTarget.current.set(
                            p.targetStartX ?? p.jupiterOrbitDist ?? 45,
                            p.targetStartY ?? 0,
                            p.targetStartZ ?? 0
                        )

                        targetSunPos.set(p.sunX ?? -10, 0, p.sunZ ?? 5)
                    }

                    const isInside =
                        selectedMoonRef.current === "Jupiter" &&
                        currentDistance.current < (p.interiorThreshold ?? 3.5)

                    if (isInside !== isInsideRef.current) {
                        isInsideRef.current = isInside
                        setIsInsideJupiter(isInside)
                    }

                    sunPosLerp.current.lerp(targetSunPos, 0.05)
                    directionalLight.position.copy(sunPosLerp.current)
                    directionalLight.target.position.copy(cameraTarget.current)
                    scene.add(directionalLight.target)

                    ctrl.target.lerp(
                        cameraTarget.current,
                        p.travelSpeed ?? 0.08
                    )
                    ctrl.update()
                }

                const planetNames = Object.keys(planetPivotsRef.current)
                const allNav = [
                    ...BASE_MOONS,
                    "Sun",
                    ...planetNames.filter((name) => !BASE_MOONS.includes(name)),
                    ...(p.customMarkers?.map((m) => m.name) || []),
                ]

                const newLabels = []

                allNav.forEach((name) => {
                    const obj = moonsRef.current[name]
                    if (!obj) return

                    const pos = new THREE.Vector3()
                    obj.getWorldPosition(pos)
                    pos.project(cam)

                    const offX = p[`offX_${name}`] || 0
                    const offY = p[`offY_${name}`] || 0

                    newLabels.push({
                        name,
                        x: (pos.x * 0.5 + 0.5) * rect.width + offX,
                        y: (-pos.y * 0.5 + 0.5) * rect.height + offY,
                        visible:
                            pos.z < 1 &&
                            pos.x > -1.5 &&
                            pos.x < 1.5 &&
                            pos.y > -1.5 &&
                            pos.y < 1.5,
                    })
                })

                setLabels(newLabels)
            }

            if (c.autoRotate) {
                Object.entries(planetPivotsRef.current).forEach(
                    ([name, item]) => {
                        if (item.type !== "planet") return

                        const selected = selectedMoonRef.current

                        const selectedIsJupiterMoon = [
                            "Callisto",
                            "Europa",
                            "Ganymede",
                            "IO",
                        ].includes(selected)
                        const selectedIsEarthMoon = selected === "Moon"

                        if (
                            name === selected ||
                            (name === "Jupiter" && selectedIsJupiterMoon) ||
                            (name === "Earth" && selectedIsEarthMoon)
                        ) {
                            return
                        }

                        item.pivot.rotation.y +=
                            (c.orbitSpeed ?? 0.3) * 0.002 * (item.speed ?? 1)
                    }
                )

                const focusedJupiterChild = [
                    "Callisto",
                    "Europa",
                    "Ganymede",
                    "IO",
                ].includes(selectedMoonRef.current)

                if (!focusedJupiterChild) {
                    jupiterGroup.current.rotation.y +=
                        (c.rotateSpeed ?? 0.5) * 0.005
                }

                Object.values(pivotsRef.current).forEach((moon) => {
                    const isEarthMoon = moon.mesh.name === "Moon"

                    if (isEarthMoon) {
                        if (selectedMoonRef.current !== "Moon") {
                            moon.pivot.rotation.y += 0.01 * (moon.speed ?? 1)
                        }

                        const earth = moonsRef.current["Earth"]

                        if (earth) {
                            const earthWorld = new THREE.Vector3()
                            const moonWorld = new THREE.Vector3()

                            earth.getWorldPosition(earthWorld)
                            moon.mesh.getWorldPosition(moonWorld)

                            const directionToEarth = earthWorld
                                .clone()
                                .sub(moonWorld)
                                .normalize()

                            const targetQuat = new THREE.Quaternion()
                            targetQuat.setFromUnitVectors(
                                new THREE.Vector3(0, 0, 1),
                                directionToEarth
                            )

                            moon.mesh.quaternion.copy(targetQuat)
                        }

                        return
                    }

                    const isFocused = selectedMoonRef.current === moon.mesh.name

                    if (!isFocused) {
                        moon.pivot.rotation.y +=
                            (c.orbitSpeed ?? 0.3) * 0.005 * (moon.speed ?? 1)
                    }

                    moon.mesh.rotation.y += (c.rotateSpeed ?? 0.5) * 0.01
                })

                sunMesh.rotation.y += 0.002
                const clouds = moonsRef.current["Earth_Clouds"]
                if (clouds) {
                    clouds.rotation.y += 0.0008
                }
            }

            sceneOverrideRef.current = {}

            const activeSceneUnits = new Set()

            if (activeSceneConfig?.objects?.length) {
                activeSceneConfig.objects
                    .filter((item) => item.enabled && item.objectName)
                    .forEach((item) => {
                        const unit = getSceneUnit(item.objectName)
                        if (!unit?.root) return

                        activeSceneUnits.add(item.objectName)

                        const targetWorld = new THREE.Vector3(
                            item.x ?? 0,
                            item.y ?? 0,
                            item.z ?? 0
                        )

                        sceneOverrideRef.current[item.objectName] = {
                            position: targetWorld,
                            scale: item.scale ?? 1,
                        }
                    })
            }

            const isCustomSceneActive = !!activeSceneConfig?.objects?.length

            Object.entries(sceneUnitsRef.current).forEach(([name, unit]) => {
                if (!unit?.root) return

                const shouldShow =
                    !isCustomSceneActive ||
                    activeSceneUnits.has(name) ||
                    (unit.parent && activeSceneUnits.has(unit.parent))

                unit.root.visible = shouldShow
            })

            Object.entries(sceneUnitsRef.current).forEach(([name, unit]) => {
                const root = unit.root
                if (!root) return

                if (!originalScalesRef.current[name]) {
                    originalScalesRef.current[name] = root.scale.clone()
                }

                const override = sceneOverrideRef.current[name]

                if (!override) {
                    const saved = sceneUnitSavedStateRef.current[name]

                    if (saved) {
                        root.position.lerp(saved.position, 0.04)
                        root.scale.lerp(saved.scale, 0.04)
                    } else {
                        root.scale.lerp(originalScalesRef.current[name], 0.04)
                    }

                    return
                }

                const parent = root.parent

                const localTarget = parent
                    ? parent.worldToLocal(override.position.clone())
                    : override.position.clone()

                root.position.lerp(localTarget, 0.04)

                const targetScale = originalScalesRef.current[name]
                    .clone()
                    .multiplyScalar(override.scale ?? 1)

                root.scale.lerp(targetScale, 0.04)
            })

            const sceneSunMultiplier = isRealScaleScene ? 0.04 : 1
            const sceneBloomMultiplier = isRealScaleScene ? 0.04 : 1

            sunLight.intensity = (c.sunIntensity ?? 8) * sceneSunMultiplier
            directionalLight.intensity = 0
            ambient.intensity = c.ambientIntensity ?? 0.1
            bloomPass.strength =
                (c.bloomStrength ?? p.bloomStrength ?? 0.55) *
                sceneBloomMultiplier
            bloomPass.radius = c.bloomRadius ?? p.bloomRadius ?? 0.65
            bloomPass.threshold = c.bloomThreshold ?? p.bloomThreshold ?? 0.05

            grainPass.uniforms["amount"].value = p.grainAmount ?? 0.012
            grainPass.uniforms["brightnessProtect"].value =
                p.grainBrightnessProtect ?? 0.65
            grainPass.uniforms["time"].value = time * 0.001

            composer.render()
            requestID = requestAnimationFrame(animate)
        }

        requestID = requestAnimationFrame(animate)

        return () => {
            cancelAnimationFrame(requestID)

            window.removeEventListener("mousemove", handleMouseMove)

            if (containerRef.current) {
                containerRef.current.removeEventListener("wheel", handleWheel)
            }

            if (controlsRef.current) {
                controlsRef.current.dispose()
                controlsRef.current = null
            }

            if (composerRef.current) {
                composerRef.current.dispose?.()
                composerRef.current = null
            }

            if (rendererRef.current) {
                const canvas = rendererRef.current.domElement
                rendererRef.current.dispose()
                rendererRef.current.forceContextLoss?.()

                if (canvas && canvas.parentNode === containerRef.current) {
                    containerRef.current.removeChild(canvas)
                }

                rendererRef.current = null
            }
        }
    }, [
        props.sunTexture,
        props.jupiterTexture,
        props.jupiterInteriorTexture,
        props.ioTexture,
        props.europaTexture,
        props.callistoTexture,
        props.ganymedeTexture,
        props.ringTexture,
        props.saturnRingTexture,
        props.uranusRingTexture,
        props.neptuneRingTexture,
        props.mercuryTexture,
        props.venusTexture,
        props.earthTexture,
        props.marsTexture,
        props.saturnTexture,
        props.uranusTexture,
        props.neptuneTexture,
        props.jupiterRadius,
        props.jupiterOrbitDist,
        props.jupiterOrbitTiltX,
        props.jupiterOrbitTiltZ,
        props.jupiterStartAngle,
        props.jupiterOrbitSpeed,
        props.ioRadius,
        props.europaRadius,
        props.callistoRadius,
        props.ganymedeRadius,
        props.ioX,
        props.ioY,
        props.ioZ,
        props.europaX,
        props.europaY,
        props.europaZ,
        props.callistoX,
        props.callistoY,
        props.callistoZ,
        props.ganymedeX,
        props.ganymedeY,
        props.ganymedeZ,
        props.ringWidth,
        props.ringHeight,
        props.ringsRotX,
        props.ringsRotY,
        props.ringsRotZ,
        props.ringsScale,
        props.ringOpacity,
        props.ringAlphaTest,
        props.saturnRingWidth,
        props.saturnRingHeight,
        props.saturnRingRotX,
        props.saturnRingRotY,
        props.saturnRingRotZ,
        props.saturnRingScale,
        props.saturnRingOpacity,
        props.saturnRingAlphaTest,
        props.uranusRingWidth,
        props.uranusRingHeight,
        props.uranusRingRotX,
        props.uranusRingRotY,
        props.uranusRingRotZ,
        props.uranusRingScale,
        props.uranusRingOpacity,
        props.uranusRingAlphaTest,
        props.neptuneRingWidth,
        props.neptuneRingHeight,
        props.neptuneRingRotX,
        props.neptuneRingRotY,
        props.neptuneRingRotZ,
        props.neptuneRingScale,
        props.neptuneRingOpacity,
        props.neptuneRingAlphaTest,
        props.sunSize,
        props.mercuryDist,
        props.venusDist,
        props.earthDist,
        props.marsDist,
        props.saturnDist,
        props.uranusDist,
        props.neptuneDist,
        props.mercurySize,
        props.venusSize,
        props.earthSize,
        props.marsSize,
        props.saturnSize,
        props.uranusSize,
        props.neptuneSize,
        props.asteroidCount,
        props.asteroidBeltInner,
        props.asteroidBeltOuter,
        props.asteroidBeltThickness,
    ])

    const focusOn = (name) => {
        pushCurrentViewToHistory()

        hasUserInteractedRef.current = true
        freeNavigationRef.current = false
        setFreeFlightMode(false)
        selectedMoonRef.current = name
        focusedMoonRef.current = name

        currentViewRef.current = { mode: "focus", target: name }

        const custom = props.customMarkers?.find((m) => m.name === name)
        const planet = planetPivotsRef.current[name]

        targetDistance.current =
            name === "Jupiter"
                ? (propsRef.current.focusDistPlanet ?? 6)
                : custom
                  ? (custom.zoomDist ?? 2)
                  : planet?.type === "planet"
                    ? (propsRef.current.focusDistPlanet ?? 6)
                    : planet?.type === "moon"
                      ? (propsRef.current.focusDistMoon ?? 1.5)
                      : (propsRef.current.focusDistMoon ?? 1.5)

        setFocusedMoon(name)
        if (cleanNavigationMode) {
            setFocusedMoon(null)
            focusedMoonRef.current = null
            setCfg((prev) => ({ ...prev, hideUI: true }))
        } else {
            setCfg((prev) => ({ ...prev, hideUI: false }))
        }
    }

    const navigate = (dir) => {
        const current =
            focusedMoon && PLANET_NAV.includes(focusedMoon)
                ? focusedMoon
                : selectedMoonRef.current &&
                    PLANET_NAV.includes(selectedMoonRef.current)
                  ? selectedMoonRef.current
                  : "Jupiter"

        const idx = PLANET_NAV.indexOf(current)
        let next = idx + dir

        if (next < 0) next = PLANET_NAV.length - 1
        if (next >= PLANET_NAV.length) next = 0

        focusOn(PLANET_NAV[next])
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement
                .requestFullscreen()
                .then(() => {
                    setIsFullscreen(true)
                })
                .catch(() => {})
        } else {
            document
                .exitFullscreen()
                .then(() => {
                    setIsFullscreen(false)
                })
                .catch(() => {})
        }
    }

    const getDisplayName = (name) => {
        const names = {
            Sun: "Sol",

            Mercury: "Mercúrio",
            Venus: "Vênus",
            Earth: "Terra",
            Moon: "Lua",
            Mars: "Marte",
            Jupiter: "Júpiter",
            Saturn: "Saturno",
            Uranus: "Urano",
            Neptune: "Netuno",

            Callisto: "Calisto",
            Europa: "Europa",
            Ganymede: "Ganimedes",
            IO: "Io",
        }

        return props[`customName_${name}`] || names[name] || name
    }

    const isLabelHovered = (label) => {
        const dx = label.x - mouseScreenPos.x
        const dy = label.y - mouseScreenPos.y
        return Math.sqrt(dx * dx + dy * dy) < 38
    }

    const isJupiterChildTarget = (name) => {
        return (
            ["Callisto", "Europa", "Ganymede", "IO"].includes(name) ||
            props.customMarkers?.some((m) => m.name === name)
        )
    }

    const isJupiterContext = () => {
        return selectedMoonRef.current === "Jupiter"
    }

    const activeButtonStyle = {
        opacity: 1,
        scale: 1.08,
        background: "rgba(255,255,255,0.15)",
        boxShadow: "0 0 20px rgba(255,255,255,0.2)",
    }

    return (
        <div
            ref={containerRef}
            style={containerMainStyle}
            onPointerDown={() => {
                if (
                    (cleanNavigationMode || freeFlightMode) &&
                    hoveredObjectName
                ) {
                    focusOn(hoveredObjectName)

                    if (cleanNavigationMode) {
                        setCfg((prev) => ({ ...prev, hideUI: true }))
                    }

                    if (freeFlightMode) {
                        setCfg((prev) => ({ ...prev, hideUI: false }))
                    }
                }
            }}
        >
            {isLoadingAssets && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 99999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        background: "rgba(0,0,0,0.92)",
                        color: "white",
                        fontFamily: "Inter, sans-serif",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                    }}
                >
                    <div
                        style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}
                    >
                        Viajando 0,000086348 ano-luz
                    </div>

                    <div
                        style={{
                            width: 180,
                            height: 2,
                            background: "rgba(255,255,255,0.15)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: `${loadingProgress}%`,
                                height: "100%",
                                background: "white",
                                transition: "width 0.25s ease",
                            }}
                        />
                    </div>

                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 10 }}>
                        {loadingProgress}%
                    </div>
                </div>
            )}
            {labels.map((label) => {
                const hovered =
                    isLabelHovered(label) || hoveredObjectName === label.name
                const isFocusedTarget =
                    focusedMoon && label.name === selectedMoonRef.current

                const isJupiterChild = isJupiterChildTarget(label.name)
                const isEarthChild = label.name === "Moon"

                const shouldShow =
                    label.visible &&
                    !isInsideJupiter &&
                    !isFocusedTarget &&
                    (!isJupiterChild || isJupiterContext()) &&
                    (!isEarthChild || selectedMoonRef.current === "Earth") &&
                    !cleanNavigationMode &&
                    (!cfg.hideUI || freeFlightMode) &&
                    !autoHideUI

                return (
                    <div
                        key={label.displayName || label.name}
                        style={{
                            ...labelStyle,
                            left: label.x,
                            top: label.y,
                            opacity: shouldShow ? 1 : 0,
                            pointerEvents: shouldShow ? "auto" : "none",
                            zIndex: 8000,
                        }}
                        onPointerDown={(event) => {
                            event.stopPropagation()
                            focusOn(label.name)
                        }}
                    >
                        {props.showPulse && (
                            <div
                                className="dot-ping"
                                style={{
                                    width: props.dotSize,
                                    height: props.dotSize,
                                    background: props.dotColor,
                                }}
                            />
                        )}

                        <div
                            style={{
                                ...dotStyle,
                                width: props.dotSize,
                                height: props.dotSize,
                                background: props.dotColor,
                                boxShadow: `0 0 ${props.dotGlow}px ${props.dotColor}`,
                            }}
                        />

                        {cfg.showText && (
                            <span
                                style={{
                                    ...textStyle,
                                    fontFamily: props.labelFontFamily,
                                    fontSize: props.labelFontSize,
                                    color: props.labelFontColor,
                                    letterSpacing: props.labelLetterSpacing,
                                    textTransform: props.labelUppercase
                                        ? "uppercase"
                                        : "none",
                                }}
                            >
                                {getDisplayName(label.name)}
                            </span>
                        )}
                    </div>
                )
            })}
            {cleanNavigationMode && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        bottom: 0,
                        width: 520,
                        height: 140,
                        zIndex: 7998,
                        pointerEvents: "auto",
                    }}
                    onPointerEnter={() => {
                        if (Date.now() < menuRevealUnlockAtRef.current) return

                        setMenuForceHidden(false)
                        setMenuHoverZone(true)
                        hideMenuUntilMouseLeavesRef.current = false
                        ignoreMenuHoverRef.current = false
                    }}
                    onPointerMove={() => {
                        if (Date.now() < menuRevealUnlockAtRef.current) return

                        setMenuForceHidden(false)
                        setMenuHoverZone(true)
                        hideMenuUntilMouseLeavesRef.current = false
                        ignoreMenuHoverRef.current = false
                    }}
                    onPointerLeave={() => {
                        setMenuHoverZone(false)
                    }}
                />
            )}
            <div
                style={{
                    ...bottomHUDBarStyle,
                    opacity: menuForceHidden
                        ? 0
                        : cleanNavigationMode && !menuHoverZone
                          ? 0
                          : autoHideUI && !menuHoverZone
                            ? 0
                            : 1,
                    pointerEvents: menuForceHidden
                        ? "none"
                        : cleanNavigationMode && !menuHoverZone
                          ? "none"
                          : autoHideUI && !menuHoverZone
                            ? "none"
                            : "auto",
                }}
                onPointerEnter={() => {
                    if (Date.now() < menuRevealUnlockAtRef.current) return
                    if (menuForceHidden) return

                    setMenuHoverZone(true)
                }}
                onPointerLeave={() => {
                    hideMenuUntilMouseLeavesRef.current = false
                    ignoreMenuHoverRef.current = false
                    setMenuHoverZone(false)
                }}
                onPointerDown={(event) => event.stopPropagation()}
            >
                <div className="ui-icon-button" onClick={() => navigate(-1)}>
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </div>

                <div
                    className="ui-icon-button"
                    style={cleanNavigationMode ? activeButtonStyle : undefined}
                    onClick={toggleHideUI}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle
                            cx="12"
                            cy="12"
                            r="3"
                            fill={cfg.hideUI ? "transparent" : "currentColor"}
                        />
                    </svg>
                </div>

                <div
                    className="ui-icon-button"
                    style={{ opacity: 1 }}
                    onClick={goBackView}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M9 14l-4 -4l4 -4" />
                        <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
                    </svg>
                </div>

                <div
                    className="ui-icon-button"
                    style={{
                        ...(freeFlightMode ? activeButtonStyle : {}),
                        opacity: activeScene
                            ? 0.35
                            : freeFlightMode
                              ? 1
                              : undefined,
                        pointerEvents: activeScene ? "none" : "auto",
                    }}
                    onClick={() => {
                        if (activeScene) return
                        releaseToSpace()
                    }}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M21.874 3.486l-4.174 7.514h3.3c.846 0 1.293 .973 .791 1.612l-.074 .085l-6.9 7.095a7.5 7.5 0 1 1 -10.21 -10.974l7.746 -6.58c.722 -.614 1.814 .028 1.628 .958l-.577 2.879l7.11 -3.95c.88 -.488 1.849 .481 1.36 1.36m-12.374 7.515a3.5 3.5 0 0 0 -3.495 3.308l-.005 .192a3.5 3.5 0 1 0 3.5 -3.5" />
                    </svg>
                </div>

                <div className="ui-icon-button" onClick={toggleFullscreen}>
                    {isFullscreen ? (
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M9 3v6H3" />
                            <path d="M15 3v6h6" />
                            <path d="M9 21v-6H3" />
                            <path d="M15 21v-6h6" />
                        </svg>
                    ) : (
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M3 9V3h6" />
                            <path d="M21 9V3h-6" />
                            <path d="M3 15v6h6" />
                            <path d="M21 15v6h-6" />
                        </svg>
                    )}
                </div>

                <div
                    className="ui-icon-button"
                    onClick={() => setShowSettings(!showSettings)}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </div>

                <div style={{ position: "relative" }}>
                    <div
                        className="ui-icon-button"
                        onClick={() => {
                            if (activeScene) {
                                stopScene()
                                setSimMenuOpen(false)
                            } else {
                                if (props.scenes?.length) {
                                    setSimMenuOpen((prev) => !prev)
                                }
                            }
                        }}
                        style={activeScene ? activeButtonStyle : undefined}
                    >
                        <span style={{ fontSize: 11, fontWeight: 700 }}>
                            SIM
                        </span>
                    </div>

                    {simMenuOpen && !activeScene && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: 58,
                                left: "50%",
                                transform: "translateX(-50%)",
                                minWidth: 130,
                                padding: 8,
                                borderRadius: 14,
                                background: "rgba(20,20,20,0.9)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                                backdropFilter: "blur(12px)",
                                zIndex: 9000,
                            }}
                            onPointerDown={(event) => event.stopPropagation()}
                        >
                            <button
                                onClick={handleRealScaleClick}
                                style={{
                                    width: "100%",
                                    padding: "9px 10px",
                                    border: "none",
                                    borderRadius: 10,
                                    background: "rgba(255,255,255,0.1)",
                                    color: "white",
                                    fontSize: 11,
                                    fontWeight: 800,
                                    letterSpacing: "0.08em",
                                    cursor: "pointer",
                                }}
                            >
                                {(props.scenes || []).map((sceneItem) => (
                                    <button
                                        key={sceneItem.id}
                                        onClick={() => {
                                            startScene(sceneItem.id)
                                            setSimMenuOpen(false)
                                        }}
                                        style={{
                                            width: "100%",
                                            padding: "9px 10px",
                                            border: "none",
                                            borderRadius: 10,
                                            background: "rgba(255,255,255,0.1)",
                                            color: "white",
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: "0.08em",
                                            cursor: "pointer",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {sceneItem.label || sceneItem.id}
                                    </button>
                                ))}
                            </button>
                        </div>
                    )}
                </div>

                <div className="ui-icon-button" onClick={() => navigate(1)}>
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    >
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            </div>

            {showSettings && (
                <div
                    style={settingsPanelStyle}
                    onPointerDown={(event) => event.stopPropagation()}
                >
                    <ConfigSlider
                        label="Sun"
                        val={cfg.sunIntensity}
                        min={0}
                        max={20}
                        onChange={(value) =>
                            setCfg({ ...cfg, sunIntensity: value })
                        }
                    />
                    <ConfigSlider
                        label="Bloom Strength"
                        val={cfg.bloomStrength}
                        min={0}
                        max={3}
                        step={0.05}
                        onChange={(value) =>
                            setCfg({ ...cfg, bloomStrength: value })
                        }
                    />

                    <ConfigSlider
                        label="Bloom Radius"
                        val={cfg.bloomRadius}
                        min={0}
                        max={2}
                        step={0.05}
                        onChange={(value) =>
                            setCfg({ ...cfg, bloomRadius: value })
                        }
                    />

                    <ConfigSlider
                        label="Bloom Threshold"
                        val={cfg.bloomThreshold}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(value) =>
                            setCfg({ ...cfg, bloomThreshold: value })
                        }
                    />
                    <ConfigSlider
                        label="Bloom"
                        val={cfg.bloomRadius}
                        min={0}
                        max={1.48}
                        onChange={(value) =>
                            setCfg({ ...cfg, bloomRadius: value })
                        }
                    />
                    <ConfigSlider
                        label="Shadows"
                        val={cfg.ambientIntensity}
                        min={0}
                        max={1}
                        onChange={(value) =>
                            setCfg({ ...cfg, ambientIntensity: value })
                        }
                    />
                    <ConfigSlider
                        label="Orbit"
                        val={cfg.orbitSpeed}
                        min={0}
                        max={2}
                        onChange={(value) =>
                            setCfg({ ...cfg, orbitSpeed: value })
                        }
                    />
                    <ConfigSlider
                        label="Rotate"
                        val={cfg.rotateSpeed}
                        min={0}
                        max={2}
                        onChange={(value) =>
                            setCfg({ ...cfg, rotateSpeed: value })
                        }
                    />
                    <button
                        style={btnSmallStyle}
                        onClick={() =>
                            setCfg({ ...cfg, autoRotate: !cfg.autoRotate })
                        }
                    >
                        {cfg.autoRotate ? "STOP" : "START"}
                    </button>
                </div>
            )}

            {!cfg.hideUI &&
                !autoHideUI &&
                (ActiveOverlay || InteriorOverlay) && (
                    <div
                        style={{
                            ...overlayWrapperStyle,
                            zIndex: 5000,
                            transform: `translate(${mousePos.x * props.hudIntensity}px, ${mousePos.y * props.hudIntensity}px)`,
                        }}
                    >
                        <div
                            onPointerDown={(event) => event.stopPropagation()}
                            style={overlayContentStyle}
                        >
                            {InteriorOverlay ? InteriorOverlay : ActiveOverlay}
                        </div>
                    </div>
                )}

            <style>{`
            @keyframes dotPulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(3.5); opacity: 0; } }
            .dot-ping { position: absolute; border-radius: 50%; animation: dotPulse 2s infinite; }
            * { -webkit-user-select: none; user-select: none; }
            .ui-icon-button {
                display: flex; align-items: center; justify-content: center;
                background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                color: white; opacity: 0.4; cursor: pointer; border-radius: 50%;
                width: 44px; height: 44px; transition: all 0.3s ease; backdrop-filter: blur(10px);
            }
            .ui-icon-button:hover { opacity: 1; scale: 1.1; background: rgba(255,255,255,0.15); box-shadow: 0 0 20px rgba(255,255,255,0.2); }
            input[type=range] { width: 100%; accent-color: white; cursor: pointer; }
        `}</style>
        </div>
    )
}

const ConfigSlider = ({ label, val, min, max, onChange }) => (
    <div style={{ marginBottom: 10 }}>
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 8,
                marginBottom: 3,
            }}
        >
            <span>{label}</span>
            <span>{Number(val || 0).toFixed(2)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={0.01}
            value={val}
            onChange={(event) => onChange(parseFloat(event.target.value))}
        />
    </div>
)

const containerMainStyle = {
    background: "transparent",
    touchAction: "none",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
}

const bottomHUDBarStyle = {
    position: "absolute",
    bottom: 40,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 12,
    padding: "10px 24px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 50,
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    zIndex: 9000,
    alignItems: "center",
}

const overlayWrapperStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    width: "100%",
    pointerEvents: "none",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "transform 0.1s ease-out",
}

const overlayContentStyle = {
    pointerEvents: "auto",
    width: "fit-content",
    maxWidth: "100%",
}

const labelStyle = {
    position: "absolute",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "white",
    transform: "translate(-50%, -50%)",
    transition: "opacity 0.3s",
}

const dotStyle = { borderRadius: "50%", marginBottom: 4 }

const textStyle = {
    textShadow: "0 2px 4px black",
    pointerEvents: "none",
    marginTop: 4,
    textAlign: "center",
}

const settingsPanelStyle = {
    position: "absolute",
    bottom: 110,
    left: "50%",
    transform: "translateX(-50%)",
    width: 180,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(15px)",
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
    zIndex: 9001,
    color: "white",
    fontFamily: "monospace",
}

const btnSmallStyle = {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
    padding: "8px",
    fontSize: 7,
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
    marginTop: 8,
}

/* addPropertyControls(SolarSystemRenderer, {
    // 01 SUN
    sunTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Sun Texture",
        group: "01 Sun",
    },
    sunSize: {
        type: ControlType.Number,
        title: "Sun Size",
        default: 3,
        min: 0.1,
        max: 30,
        step: 0.1,
        group: "01 Sun",
    },
    sunGlowTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Sun Glow",
        group: "01 Sun",
    },
    sunFlareTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Sun Flare",
        group: "01 Sun",
    },
    sunFlareBrightness: {
        type: ControlType.Number,
        title: "Flare Brightness",
        default: 0.4,
        min: 0,
        //max: 2,
        step: 0.01,
        group: "01 Sun",
    },

    sunIntensity: {
        type: ControlType.Number,
        title: "Sun Intensity",
        default: 8,
        group: "20 Engine",
    },
    sunGlowScale: {
        type: ControlType.Number,
        title: "Sun Glow Scale",
        default: 5,
        min: 0,
        max: 30,
        step: 0.1,
        group: "01 Sun",
    },
    sunGlowOpacity: {
        type: ControlType.Number,
        title: "Sun Glow Opacity",
        default: 0.9,
        min: 0,
        max: 2,
        step: 0.01,
        group: "01 Sun",
    },

    bloomStrength: {
        type: ControlType.Number,
        title: "Bloom Strength",
        defaultValue: 0.55,
        min: 0,
        max: 3,
        step: 0.05,
        group: "01 Sun",
    },
    bloomRadius: {
        type: ControlType.Number,
        title: "Bloom Radius",
        defaultValue: 0.65,
        min: 0,
        max: 2,
        step: 0.05,
        group: "01 Sun",
    },
    bloomThreshold: {
        type: ControlType.Number,
        title: "Bloom Threshold",
        defaultValue: 0.05,
        min: 0,
        max: 1,
        step: 0.01,
        group: "01 Sun",
    },
    toneMappingExposure: {
        type: ControlType.Number,
        title: "Tone Exposure",
        defaultValue: 1.15,
        min: 0.1,
        max: 3,
        step: 0.05,
        group: "01 Sun",
    },
    sunFlareMainSize: {
        type: ControlType.Number,
        title: "Flare Main",
        default: 420,
        min: 0,
        max: 5000,
        step: 10,
        group: "01 Sun",
    },
    sunFlareGhost1Size: {
        type: ControlType.Number,
        title: "Ghost 1",
        default: 45,
        min: 0,
        max: 300,
        step: 5,
        group: "01 Sun",
    },
    sunFlareGhost2Size: {
        type: ControlType.Number,
        title: "Ghost 2",
        default: 65,
        min: 0,
        max: 300,
        step: 5,
        group: "01 Sun",
    },
    sunFlareGhost3Size: {
        type: ControlType.Number,
        title: "Ghost 3",
        default: 110,
        min: 0,
        max: 400,
        step: 5,
        group: "01 Sun",
    },
    sunFlareGhost4Size: {
        type: ControlType.Number,
        title: "Ghost 4",
        default: 70,
        min: 0,
        max: 300,
        step: 5,
        group: "01 Sun",
    },

    scenes: {
        type: ControlType.Array,
        title: "Cenas",
        group: "30 Cenas",
        control: {
            type: ControlType.Object,
            controls: {
                id: {
                    type: ControlType.String,
                    title: "ID",
                    defaultValue: "realScaleLine",
                },
                label: {
                    type: ControlType.String,
                    title: "Nome",
                    defaultValue: "REAL SCALE",
                },
                camX: {
                    type: ControlType.Number,
                    title: "Cam X",
                    defaultValue: 0,
                    step: 0.1,
                },
                camY: {
                    type: ControlType.Number,
                    title: "Cam Y",
                    defaultValue: 0.6,
                    step: 0.1,
                },
                camZ: {
                    type: ControlType.Number,
                    title: "Cam Z",
                    defaultValue: 28,
                    step: 0.1,
                },
                targetX: {
                    type: ControlType.Number,
                    title: "Target X",
                    defaultValue: 1.5,
                    step: 0.1,
                },
                targetY: {
                    type: ControlType.Number,
                    title: "Target Y",
                    defaultValue: 0,
                    step: 0.1,
                },
                targetZ: {
                    type: ControlType.Number,
                    title: "Target Z",
                    defaultValue: 0,
                    step: 0.1,
                },

                objects: {
                    type: ControlType.Array,
                    title: "Planetas",
                    control: {
                        type: ControlType.Object,
                        controls: {
                            objectName: {
                                type: ControlType.Enum,
                                title: "Objeto",
                                options: [
                                    "Sun",
                                    "Mercury",
                                    "Venus",
                                    "Earth",
                                    "Moon",
                                    "Mars",
                                    "Jupiter",
                                    "Saturn",
                                    "Uranus",
                                    "Neptune",
                                    "Callisto",
                                    "Europa",
                                    "Ganymede",
                                    "IO",
                                ],
                                defaultValue: "Earth",
                            },
                            enabled: {
                                type: ControlType.Boolean,
                                title: "Usar?",
                                defaultValue: true,
                            },
                            x: {
                                type: ControlType.Number,
                                title: "X",
                                defaultValue: 0,
                                step: 0.1,
                            },
                            y: {
                                type: ControlType.Number,
                                title: "Y",
                                defaultValue: 0,
                                step: 0.1,
                            },
                            z: {
                                type: ControlType.Number,
                                title: "Z",
                                defaultValue: 0,
                                step: 0.1,
                            },
                            scale: {
                                type: ControlType.Number,
                                title: "Escala",
                                defaultValue: 1,
                                min: 0,
                                max: 80,
                                step: 0.05,
                            },
                        },
                    },
                },
            },
        },
    },

    // 02 MERCURY
    mercuryTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Mercury Texture",
        group: "02 Mercury",
    },
    mercuryDist: {
        type: ControlType.Number,
        title: "Mercury Dist",
        default: 12,
        group: "02 Mercury",
    },
    mercurySize: {
        type: ControlType.Number,
        title: "Mercury Size",
        default: 0.18,
        step: 0.01,
        group: "02 Mercury",
    },
    mercurySpeed: {
        type: ControlType.Number,
        title: "Mercury Speed",
        default: 1.6,
        step: 0.01,
        group: "02 Mercury",
    },
    mercuryTiltX: {
        type: ControlType.Number,
        title: "Mercury Tilt X",
        default: 0,
        group: "02 Mercury",
    },
    mercuryTiltZ: {
        type: ControlType.Number,
        title: "Mercury Tilt Z",
        default: 7,
        group: "02 Mercury",
    },
    mercuryStartAngle: {
        type: ControlType.Number,
        title: "Mercury Start Angle",
        default: 15,
        group: "02 Mercury",
    },

    // 03 VENUS
    venusTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Venus Texture",
        group: "03 Venus",
    },
    venusDist: {
        type: ControlType.Number,
        title: "Venus Dist",
        default: 18,
        group: "03 Venus",
    },
    venusSize: {
        type: ControlType.Number,
        title: "Venus Size",
        default: 0.34,
        step: 0.01,
        group: "03 Venus",
    },
    venusSpeed: {
        type: ControlType.Number,
        title: "Venus Speed",
        default: 1.2,
        step: 0.01,
        group: "03 Venus",
    },
    venusTiltX: {
        type: ControlType.Number,
        title: "Venus Tilt X",
        default: 0,
        group: "03 Venus",
    },
    venusTiltZ: {
        type: ControlType.Number,
        title: "Venus Tilt Z",
        default: 3,
        group: "03 Venus",
    },
    venusStartAngle: {
        type: ControlType.Number,
        title: "Venus Start Angle",
        default: 75,
        group: "03 Venus",
    },

    // 04 EARTH
    earthTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Earth Texture",
        group: "04 Earth",
    },
    earthCloudsTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Earth Clouds Texture",
        group: "04 Earth",
    },
    earthDist: {
        type: ControlType.Number,
        title: "Earth Dist",
        default: 24,
        group: "04 Earth",
    },
    earthSize: {
        type: ControlType.Number,
        title: "Earth Size",
        default: 0.36,
        step: 0.01,
        group: "04 Earth",
    },
    earthSpeed: {
        type: ControlType.Number,
        title: "Earth Speed",
        default: 1,
        step: 0.01,
        group: "04 Earth",
    },
    earthTiltX: {
        type: ControlType.Number,
        title: "Earth Tilt X",
        default: 0,
        group: "04 Earth",
    },
    earthTiltZ: {
        type: ControlType.Number,
        title: "Earth Tilt Z",
        default: 0,
        group: "04 Earth",
    },
    earthStartAngle: {
        type: ControlType.Number,
        title: "Earth Start Angle",
        default: 150,
        group: "04 Earth",
    },

    // 05 MARS
    marsTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Mars Texture",
        group: "05 Mars",
    },
    marsDist: {
        type: ControlType.Number,
        title: "Mars Dist",
        default: 31,
        group: "05 Mars",
    },
    marsSize: {
        type: ControlType.Number,
        title: "Mars Size",
        default: 0.28,
        step: 0.01,
        group: "05 Mars",
    },
    marsSpeed: {
        type: ControlType.Number,
        title: "Mars Speed",
        default: 0.8,
        step: 0.01,
        group: "05 Mars",
    },
    marsTiltX: {
        type: ControlType.Number,
        title: "Mars Tilt X",
        default: 0,
        group: "05 Mars",
    },
    marsTiltZ: {
        type: ControlType.Number,
        title: "Mars Tilt Z",
        default: 1.8,
        group: "05 Mars",
    },
    marsStartAngle: {
        type: ControlType.Number,
        title: "Mars Start Angle",
        default: 220,
        group: "05 Mars",
    },

    // 06 JUPITER
    jupiterTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Jupiter Texture",
        group: "06 Jupiter",
    },
    jupiterInteriorTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Jupiter Interior Texture",
        group: "06 Jupiter",
    },
    jupiterRadius: {
        type: ControlType.Number,
        title: "Jupiter Radius",
        default: 1,
        min: 0.1,
        max: 10,
        step: 0.01,
        group: "06 Jupiter",
    },
    jupiterOrbitDist: {
        type: ControlType.Number,
        title: "Jupiter Orbit Dist",
        default: 45,
        group: "06 Jupiter",
    },
    jupiterOrbitSpeed: {
        type: ControlType.Number,
        title: "Jupiter Orbit Speed",
        default: 0.45,
        step: 0.01,
        group: "06 Jupiter",
    },
    jupiterOrbitTiltX: {
        type: ControlType.Number,
        title: "Jupiter Orbit Tilt X",
        default: 0,
        group: "06 Jupiter",
    },
    jupiterOrbitTiltZ: {
        type: ControlType.Number,
        title: "Jupiter Orbit Tilt Z",
        default: 1.3,
        group: "06 Jupiter",
    },
    jupiterStartAngle: {
        type: ControlType.Number,
        title: "Jupiter Start Angle",
        default: 0,
        group: "06 Jupiter",
    },

    // 06 JUPITER RINGS
    ringTexture: {
        type: ControlType.File,
        allowedFileTypes: ["png", "webp"],
        title: "Jupiter Ring Texture",
        group: "06 Jupiter Rings",
    },
    ringWidth: {
        type: ControlType.Number,
        title: "Jupiter Ring Width",
        default: 4.5,
        min: 0.1,
        max: 20,
        step: 0.1,
        group: "06 Jupiter Rings",
    },
    ringHeight: {
        type: ControlType.Number,
        title: "Jupiter Ring Height",
        default: 4.5,
        min: 0.1,
        max: 20,
        step: 0.1,
        group: "06 Jupiter Rings",
    },
    ringsRotX: {
        type: ControlType.Number,
        title: "Jupiter Ring Rot X",
        default: 90,
        group: "06 Jupiter Rings",
    },
    ringsRotY: {
        type: ControlType.Number,
        title: "Jupiter Ring Rot Y",
        default: 0,
        group: "06 Jupiter Rings",
    },
    ringsRotZ: {
        type: ControlType.Number,
        title: "Jupiter Ring Rot Z",
        default: 0,
        group: "06 Jupiter Rings",
    },
    ringsScale: {
        type: ControlType.Number,
        title: "Jupiter Ring Scale",
        default: 1,
        step: 0.1,
        group: "06 Jupiter Rings",
    },
    ringOpacity: {
        type: ControlType.Number,
        title: "Jupiter Ring Opacity",
        default: 0.75,
        min: 0,
        max: 1,
        step: 0.01,
        group: "06 Jupiter Rings",
    },
    ringAlphaTest: {
        type: ControlType.Number,
        title: "Jupiter Ring Alpha Test",
        default: 0.02,
        min: 0,
        max: 1,
        step: 0.01,
        group: "06 Jupiter Rings",
    },

    // 07 SATURN
    saturnTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Saturn Texture",
        group: "07 Saturn",
    },
    saturnDist: {
        type: ControlType.Number,
        title: "Saturn Dist",
        default: 62,
        group: "07 Saturn",
    },
    saturnSize: {
        type: ControlType.Number,
        title: "Saturn Size",
        default: 0.9,
        step: 0.01,
        group: "07 Saturn",
    },
    saturnSpeed: {
        type: ControlType.Number,
        title: "Saturn Speed",
        default: 0.3,
        step: 0.01,
        group: "07 Saturn",
    },
    saturnTiltX: {
        type: ControlType.Number,
        title: "Saturn Tilt X",
        default: 0,
        group: "07 Saturn",
    },
    saturnTiltZ: {
        type: ControlType.Number,
        title: "Saturn Tilt Z",
        default: 2.5,
        group: "07 Saturn",
    },
    saturnStartAngle: {
        type: ControlType.Number,
        title: "Saturn Start Angle",
        default: 300,
        group: "07 Saturn",
    },

    // 07 SATURN RINGS
    saturnRingTexture: {
        type: ControlType.File,
        allowedFileTypes: ["png", "webp"],
        title: "Saturn Ring Texture",
        group: "07 Saturn Rings",
    },
    saturnRingWidth: {
        type: ControlType.Number,
        title: "Saturn Ring Width",
        default: 3.2,
        min: 0.1,
        max: 20,
        step: 0.1,
        group: "07 Saturn Rings",
    },
    saturnRingHeight: {
        type: ControlType.Number,
        title: "Saturn Ring Height",
        default: 3.2,
        min: 0.1,
        max: 20,
        step: 0.1,
        group: "07 Saturn Rings",
    },
    saturnRingRotX: {
        type: ControlType.Number,
        title: "Saturn Ring Rot X",
        default: 90,
        group: "07 Saturn Rings",
    },
    saturnRingRotY: {
        type: ControlType.Number,
        title: "Saturn Ring Rot Y",
        default: 0,
        group: "07 Saturn Rings",
    },
    saturnRingRotZ: {
        type: ControlType.Number,
        title: "Saturn Ring Rot Z",
        default: 0,
        group: "07 Saturn Rings",
    },
    saturnRingScale: {
        type: ControlType.Number,
        title: "Saturn Ring Scale",
        default: 1,
        step: 0.1,
        group: "07 Saturn Rings",
    },
    saturnRingOpacity: {
        type: ControlType.Number,
        title: "Saturn Ring Opacity",
        default: 0.55,
        min: 0,
        max: 1,
        step: 0.01,
        group: "07 Saturn Rings",
    },
    saturnRingLightBoost: {
        type: ControlType.Number,
        title: "Saturn Ring Light",
        default: 0.5,
        min: 0,
        max: 2,
        step: 0.01,
        group: "07 Saturn Rings",
    },
    saturnRingShadowStrength: {
        type: ControlType.Number,
        title: "Saturn Ring Shadow",
        default: 0.75,
        min: 0,
        max: 1,
        step: 0.01,
        group: "07 Saturn Rings",
    },
    saturnRingShadowWidth: {
        type: ControlType.Number,
        title: "Saturn Shadow Width",
        default: 0.18,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        group: "07 Saturn Rings",
    },
    uranusRingLightBoost: {
        type: ControlType.Number,
        title: "Uranus Ring Light",
        default: 0.25,
        min: 0,
        max: 2,
        step: 0.01,
        group: "08 Uranus Rings",
    },

    neptuneRingLightBoost: {
        type: ControlType.Number,
        title: "Neptune Ring Light",
        default: 0.25,
        min: 0,
        max: 2,
        step: 0.01,
        group: "09 Neptune Rings",
    },

    ringLightBoost: {
        type: ControlType.Number,
        title: "Jupiter Ring Light",
        default: 0.4,
        min: 0,
        max: 2,
        step: 0.01,
        group: "06 Jupiter Rings",
    },
    ringShadowStrength: {
        type: ControlType.Number,
        title: "Jupiter Ring Shadow",
        default: 0.6,
        min: 0,
        max: 1,
        step: 0.01,
        group: "06 Jupiter Rings",
    },
    ringShadowWidth: {
        type: ControlType.Number,
        title: "Jupiter Shadow Width",
        default: 0.18,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        group: "06 Jupiter Rings",
    },

    saturnRingAlphaTest: {
        type: ControlType.Number,
        title: "Saturn Ring Alpha Test",
        default: 0.05,
        min: 0,
        max: 1,
        step: 0.01,
        group: "07 Saturn Rings",
    },

    // 08 URANUS
    uranusTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Uranus Texture",
        group: "08 Uranus",
    },
    uranusDist: {
        type: ControlType.Number,
        title: "Uranus Dist",
        default: 78,
        group: "08 Uranus",
    },
    uranusSize: {
        type: ControlType.Number,
        title: "Uranus Size",
        default: 0.65,
        step: 0.01,
        group: "08 Uranus",
    },
    uranusSpeed: {
        type: ControlType.Number,
        title: "Uranus Speed",
        default: 0.2,
        step: 0.01,
        group: "08 Uranus",
    },
    uranusTiltX: {
        type: ControlType.Number,
        title: "Uranus Tilt X",
        default: 0,
        group: "08 Uranus",
    },
    uranusTiltZ: {
        type: ControlType.Number,
        title: "Uranus Tilt Z",
        default: 0.8,
        group: "08 Uranus",
    },
    uranusStartAngle: {
        type: ControlType.Number,
        title: "Uranus Start Angle",
        default: 35,
        group: "08 Uranus",
    },

    // 08 URANUS RINGS
    uranusRingTexture: {
        type: ControlType.File,
        allowedFileTypes: ["png", "webp"],
        title: "Uranus Ring Texture",
        group: "08 Uranus Rings",
    },
    uranusRingWidth: {
        type: ControlType.Number,
        title: "Uranus Ring Width",
        default: 2.5,
        min: 0.1,
        max: 20,
        step: 0.1,
        group: "08 Uranus Rings",
    },
    uranusRingHeight: {
        type: ControlType.Number,
        title: "Uranus Ring Height",
        default: 2.5,
        min: 0.1,
        max: 20,
        step: 0.1,
        group: "08 Uranus Rings",
    },
    uranusRingRotX: {
        type: ControlType.Number,
        title: "Uranus Ring Rot X",
        default: 90,
        group: "08 Uranus Rings",
    },
    uranusRingRotY: {
        type: ControlType.Number,
        title: "Uranus Ring Rot Y",
        default: 0,
        group: "08 Uranus Rings",
    },
    uranusRingRotZ: {
        type: ControlType.Number,
        title: "Uranus Ring Rot Z",
        default: 0,
        group: "08 Uranus Rings",
    },
    uranusRingScale: {
        type: ControlType.Number,
        title: "Uranus Ring Scale",
        default: 1,
        step: 0.1,
        group: "08 Uranus Rings",
    },
    uranusRingOpacity: {
        type: ControlType.Number,
        title: "Uranus Ring Opacity",
        default: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
        group: "08 Uranus Rings",
    },
    uranusRingAlphaTest: {
        type: ControlType.Number,
        title: "Uranus Ring Alpha Test",
        default: 0.05,
        min: 0,
        max: 1,
        step: 0.01,
        group: "08 Uranus Rings",
    },

    // 09 NEPTUNE
    neptuneTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Neptune Texture",
        group: "09 Neptune",
    },
    neptuneDist: {
        type: ControlType.Number,
        title: "Neptune Dist",
        default: 95,
        group: "09 Neptune",
    },
    neptuneSize: {
        type: ControlType.Number,
        title: "Neptune Size",
        default: 0.65,
        step: 0.01,
        group: "09 Neptune",
    },
    neptuneSpeed: {
        type: ControlType.Number,
        title: "Neptune Speed",
        default: 0.15,
        step: 0.01,
        group: "09 Neptune",
    },
    neptuneTiltX: {
        type: ControlType.Number,
        title: "Neptune Tilt X",
        default: 0,
        group: "09 Neptune",
    },
    neptuneTiltZ: {
        type: ControlType.Number,
        title: "Neptune Tilt Z",
        default: 1.8,
        group: "09 Neptune",
    },
    neptuneStartAngle: {
        type: ControlType.Number,
        title: "Neptune Start Angle",
        default: 115,
        group: "09 Neptune",
    },

    // 09 NEPTUNE RINGS
    neptuneRingTexture: {
        type: ControlType.File,
        allowedFileTypes: ["png", "webp"],
        title: "Neptune Ring Texture",
        group: "09 Neptune Rings",
    },
    neptuneRingWidth: {
        type: ControlType.Number,
        title: "Neptune Ring Width",
        default: 2.4,
        min: 0.1,
        max: 20,
        step: 0.1,
        group: "09 Neptune Rings",
    },
    neptuneRingHeight: {
        type: ControlType.Number,
        title: "Neptune Ring Height",
        default: 2.4,
        min: 0.1,
        max: 20,
        step: 0.1,
        group: "09 Neptune Rings",
    },
    neptuneRingRotX: {
        type: ControlType.Number,
        title: "Neptune Ring Rot X",
        default: 90,
        group: "09 Neptune Rings",
    },
    neptuneRingRotY: {
        type: ControlType.Number,
        title: "Neptune Ring Rot Y",
        default: 0,
        group: "09 Neptune Rings",
    },
    neptuneRingRotZ: {
        type: ControlType.Number,
        title: "Neptune Ring Rot Z",
        default: 0,
        group: "09 Neptune Rings",
    },
    neptuneRingScale: {
        type: ControlType.Number,
        title: "Neptune Ring Scale",
        default: 1,
        step: 0.1,
        group: "09 Neptune Rings",
    },
    neptuneRingOpacity: {
        type: ControlType.Number,
        title: "Neptune Ring Opacity",
        default: 0.3,
        min: 0,
        max: 1,
        step: 0.01,
        group: "09 Neptune Rings",
    },
    neptuneRingAlphaTest: {
        type: ControlType.Number,
        title: "Neptune Ring Alpha Test",
        default: 0.05,
        min: 0,
        max: 1,
        step: 0.01,
        group: "09 Neptune Rings",
    },

    // 10 JUPITER MOONS
    ioTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "IO Texture",
        group: "10 Jupiter Moons",
    },
    europaTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Europa Texture",
        group: "10 Jupiter Moons",
    },
    callistoTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Callisto Texture",
        group: "10 Jupiter Moons",
    },
    ganymedeTexture: {
        type: ControlType.File,
        allowedFileTypes: ["jpg", "jpeg", "png", "webp"],
        title: "Ganymede Texture",
        group: "10 Jupiter Moons",
    },
    ioRadius: {
        type: ControlType.Number,
        title: "IO Radius",
        default: 0.02,
        min: 0.005,
        max: 1,
        step: 0.005,
        group: "10 Jupiter Moons",
    },
    europaRadius: {
        type: ControlType.Number,
        title: "Europa Radius",
        default: 0.02,
        min: 0.005,
        max: 1,
        step: 0.005,
        group: "10 Jupiter Moons",
    },
    callistoRadius: {
        type: ControlType.Number,
        title: "Callisto Radius",
        default: 0.02,
        min: 0.005,
        max: 1,
        step: 0.005,
        group: "10 Jupiter Moons",
    },
    ganymedeRadius: {
        type: ControlType.Number,
        title: "Ganymede Radius",
        default: 0.02,
        min: 0.005,
        max: 1,
        step: 0.005,
        group: "10 Jupiter Moons",
    },

    // 11 MOON POSITIONS
    ioX: {
        type: ControlType.Number,
        title: "IO X",
        default: 0.78437079,
        step: 0.01,
        group: "11 Moon Positions",
    },
    ioY: {
        type: ControlType.Number,
        title: "IO Y",
        default: -0.03102102,
        step: 0.01,
        group: "11 Moon Positions",
    },
    ioZ: {
        type: ControlType.Number,
        title: "IO Z",
        default: 1.74507503,
        step: 0.01,
        group: "11 Moon Positions",
    },
    europaX: {
        type: ControlType.Number,
        title: "Europa X",
        default: 1.5266029,
        step: 0.01,
        group: "11 Moon Positions",
    },
    europaY: {
        type: ControlType.Number,
        title: "Europa Y",
        default: -0.21509023,
        step: 0.01,
        group: "11 Moon Positions",
    },
    europaZ: {
        type: ControlType.Number,
        title: "Europa Z",
        default: -1.41535184,
        step: 0.01,
        group: "11 Moon Positions",
    },
    callistoX: {
        type: ControlType.Number,
        title: "Callisto X",
        default: -3.08223687,
        step: 0.01,
        group: "11 Moon Positions",
    },
    callistoY: {
        type: ControlType.Number,
        title: "Callisto Y",
        default: -0.03102102,
        step: 0.01,
        group: "11 Moon Positions",
    },
    callistoZ: {
        type: ControlType.Number,
        title: "Callisto Z",
        default: -1.09343633,
        step: 0.01,
        group: "11 Moon Positions",
    },
    ganymedeX: {
        type: ControlType.Number,
        title: "Ganymede X",
        default: 3.46876701,
        step: 0.01,
        group: "11 Moon Positions",
    },
    ganymedeY: {
        type: ControlType.Number,
        title: "Ganymede Y",
        default: -0.03102102,
        step: 0.01,
        group: "11 Moon Positions",
    },
    ganymedeZ: {
        type: ControlType.Number,
        title: "Ganymede Z",
        default: 1.47353192,
        step: 0.01,
        group: "11 Moon Positions",
    },

    // 12 ASTEROID BELT
    asteroidCount: {
        type: ControlType.Number,
        title: "Asteroid Count",
        default: 600,
        min: 0,
        //max: 3000,
        step: 1,
        group: "12 Asteroid Belt",
    },
    asteroidBeltInner: {
        type: ControlType.Number,
        title: "Inner Radius",
        default: 140,
        step: 1,
        group: "12 Asteroid Belt",
    },
    asteroidBeltOuter: {
        type: ControlType.Number,
        title: "Outer Radius",
        default: 160,
        step: 1,
        group: "12 Asteroid Belt",
    },
    asteroidBeltThickness: {
        type: ControlType.Number,
        title: "Thickness",
        default: 0.5,
        step: 0.1,
        group: "12 Asteroid Belt",
    },

    // 13 GEOMETRY QUALITY
    jupiterSegments: {
        type: ControlType.Number,
        title: "Jupiter Segments",
        default: 96,
        min: 16,
        max: 192,
        step: 1,
        group: "13 Geometry Quality",
    },
    moonSegments: {
        type: ControlType.Number,
        title: "Moon Segments",
        default: 48,
        min: 8,
        max: 128,
        step: 1,
        group: "13 Geometry Quality",
    },

    // 14 CAMERA
    camStartX: {
        type: ControlType.Number,
        title: "Cam X",
        default: 45,
        group: "14 Camera",
    },
    camStartY: {
        type: ControlType.Number,
        title: "Cam Y",
        default: 5,
        group: "14 Camera",
    },
    camStartZ: {
        type: ControlType.Number,
        title: "Cam Z",
        default: 18,
        group: "14 Camera",
    },
    targetStartX: {
        type: ControlType.Number,
        title: "Look At X",
        default: 45,
        group: "14 Camera",
    },
    targetStartY: {
        type: ControlType.Number,
        title: "Look At Y",
        default: 0,
        group: "14 Camera",
    },
    targetStartZ: {
        type: ControlType.Number,
        title: "Look At Z",
        default: 0,
        group: "14 Camera",
    },

    // 15 HUD BASE OVERLAYS
    autoJupiterHudThreshold: {
        type: ControlType.Number,
        title: "Auto Jupiter HUD",
        default: 7,
        min: 0.1,
        max: 60,
        step: 0.1,
        group: "15 HUD Base",
    },
    interiorThreshold: {
        type: ControlType.Number,
        title: "Interior Trigger",
        default: 3.5,
        group: "15 HUD Base",
    },
    overlayJupiter: {
        type: ControlType.ComponentInstance,
        title: "HUD Jupiter",
        group: "15 HUD Base",
    },
    overlayInteriorJupiter: {
        type: ControlType.ComponentInstance,
        title: "HUD Interior Jupiter",
        group: "15 HUD Base",
    },
    overlayCallisto: {
        type: ControlType.ComponentInstance,
        title: "HUD Callisto",
        group: "15 HUD Base",
    },
    overlayEuropa: {
        type: ControlType.ComponentInstance,
        title: "HUD Europa",
        group: "15 HUD Base",
    },
    overlayGanymede: {
        type: ControlType.ComponentInstance,
        title: "HUD Ganymede",
        group: "15 HUD Base",
    },
    overlayIO: {
        type: ControlType.ComponentInstance,
        title: "HUD IO",
        group: "15 HUD Base",
    },
    overlaySun: {
        type: ControlType.ComponentInstance,
        title: "HUD Sun",
        group: "15 HUD Base",
    },
    overlayMercury: {
        type: ControlType.ComponentInstance,
        title: "HUD Mercury",
        group: "15 HUD Base",
    },
    overlayVenus: {
        type: ControlType.ComponentInstance,
        title: "HUD Venus",
        group: "15 HUD Base",
    },
    overlayEarth: {
        type: ControlType.ComponentInstance,
        title: "HUD Earth",
        group: "15 HUD Base",
    },
    overlayMars: {
        type: ControlType.ComponentInstance,
        title: "HUD Mars",
        group: "15 HUD Base",
    },
    overlaySaturn: {
        type: ControlType.ComponentInstance,
        title: "HUD Saturn",
        group: "15 HUD Base",
    },
    overlayUranus: {
        type: ControlType.ComponentInstance,
        title: "HUD Uranus",
        group: "15 HUD Base",
    },
    overlayNeptune: {
        type: ControlType.ComponentInstance,
        title: "HUD Neptune",
        group: "15 HUD Base",
    },

    // 16 HUD VISUALS
    overlayWidth: {
        type: ControlType.Number,
        title: "HUD Width %",
        default: 100,
        group: "16 HUD Visuals",
    },
    hudIntensity: {
        type: ControlType.Number,
        title: "HUD Parallax",
        default: 20,
        group: "16 HUD Visuals",
    },

    // 17 HUD LIBRARY SLOTS
    hudSlot1: {
        type: ControlType.ComponentInstance,
        title: "HUD 01",
        group: "17 HUD Library Slots",
    },
    hudSlot2: {
        type: ControlType.ComponentInstance,
        title: "HUD 02",
        group: "17 HUD Library Slots",
    },
    hudSlot3: {
        type: ControlType.ComponentInstance,
        title: "HUD 03",
        group: "17 HUD Library Slots",
    },
    hudSlot4: {
        type: ControlType.ComponentInstance,
        title: "HUD 04",
        group: "17 HUD Library Slots",
    },
    hudSlot5: {
        type: ControlType.ComponentInstance,
        title: "HUD 05",
        group: "17 HUD Library Slots",
    },
    hudSlot6: {
        type: ControlType.ComponentInstance,
        title: "HUD 06",
        group: "17 HUD Library Slots",
    },
    hudSlot7: {
        type: ControlType.ComponentInstance,
        title: "HUD 07",
        group: "17 HUD Library Slots",
    },
    hudSlot8: {
        type: ControlType.ComponentInstance,
        title: "HUD 08",
        group: "17 HUD Library Slots",
    },
    hudSlot9: {
        type: ControlType.ComponentInstance,
        title: "HUD 09",
        group: "17 HUD Library Slots",
    },
    hudSlot10: {
        type: ControlType.ComponentInstance,
        title: "HUD 10",
        group: "17 HUD Library Slots",
    },

    // 18 CUSTOM MARKERS
    customMarkers: {
        type: ControlType.Array,
        title: "Custom Markers",
        group: "18 Custom Markers",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Nome" },
                overlaySlot: {
                    type: ControlType.Enum,
                    title: "Usar HUD",
                    options: [
                        "none",
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "10",
                    ],
                    optionTitles: [
                        "Nenhum",
                        "HUD 01",
                        "HUD 02",
                        "HUD 03",
                        "HUD 04",
                        "HUD 05",
                        "HUD 06",
                        "HUD 07",
                        "HUD 08",
                        "HUD 09",
                        "HUD 10",
                    ],
                },
                x: { type: ControlType.Number, title: "X", step: 0.1 },
                y: { type: ControlType.Number, title: "Y", step: 0.1 },
                z: { type: ControlType.Number, title: "Z", step: 0.1 },
                zoomDist: {
                    type: ControlType.Number,
                    title: "Focus Zoom",
                    default: 2,
                },
            },
        },
    },

    // 19 LABELS
    labelFontFamily: {
        type: ControlType.String,
        title: "Font",
        default: "Inter, sans-serif",
        group: "19 Labels",
    },
    labelFontSize: {
        type: ControlType.Number,
        title: "Size",
        default: 9,
        group: "19 Labels",
    },
    labelFontColor: {
        type: ControlType.Color,
        title: "Color",
        default: "#FFFFFF",
        group: "19 Labels",
    },
    labelLetterSpacing: {
        type: ControlType.Number,
        title: "Spacing",
        default: 0,
        step: 0.1,
        group: "19 Labels",
    },
    labelUppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        default: false,
        group: "19 Labels",
    },
    showText: {
        type: ControlType.Boolean,
        title: "Names",
        default: true,
        group: "19 Labels",
    },
    showPulse: {
        type: ControlType.Boolean,
        title: "Pulsar",
        default: true,
        group: "19 Labels",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        default: 6,
        group: "19 Labels",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        default: "#FFFFFF",
        group: "19 Labels",
    },
    dotGlow: {
        type: ControlType.Number,
        title: "Dot Glow",
        default: 8,
        group: "19 Labels",
    },

    // 20 ENGINE
    focusDistPlanet: {
        type: ControlType.Number,
        title: "Planet Zoom",
        default: 6,
        group: "20 Engine",
    },
    focusDistMoon: {
        type: ControlType.Number,
        title: "Moon Zoom",
        default: 1.5,
        group: "20 Engine",
    },
    maxZoom: {
        type: ControlType.Number,
        title: "Initial Dist",
        default: 10,
        group: "20 Engine",
    },
    minZoom: {
        type: ControlType.Number,
        title: "Min Zoom",
        default: 0.05,
        group: "20 Engine",
    },
    maxZoomLimit: {
        type: ControlType.Number,
        title: "Max Zoom Limit",
        default: 1000,
        group: "20 Engine",
    },
    ambientIntensity: {
        type: ControlType.Number,
        title: "Ambient Intensity",
        default: 0.1,
        group: "20 Engine",
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        default: true,
        group: "20 Engine",
    },
    orbitSpeed: {
        type: ControlType.Number,
        title: "Orbit Speed",
        default: 0.3,
        group: "20 Engine",
    },
    rotateSpeed: {
        type: ControlType.Number,
        title: "Rotate Speed",
        default: 0.5,
        group: "20 Engine",
    },
    travelSpeed: {
        type: ControlType.Number,
        title: "Travel Speed",
        default: 0.08,
        group: "20 Engine",
    },
    zoomSmoothness: {
        type: ControlType.Number,
        title: "Zoom Smoothness",
        default: 0.05,
        group: "20 Engine",
    },
    sunX: {
        type: ControlType.Number,
        title: "Sun X",
        default: -10,
        group: "20 Engine",
    },
    sunZ: {
        type: ControlType.Number,
        title: "Sun Z",
        default: 5,
        group: "20 Engine",
    },
    grainAmount: {
        type: ControlType.Number,
        title: "Grain Amount",
        defaultValue: 0.012,
        min: 0,
        max: 0.08,
        step: 0.001,
        group: "99 Effects",
    },
    grainBrightnessProtect: {
        type: ControlType.Number,
        title: "Grain Protect",
        defaultValue: 0.65,
        min: 0,
        max: 1,
        step: 0.01,
        group: "99 Effects",
    },
    earthMoonDist: {
        type: ControlType.Number,
        title: "Moon Dist",
        min: 0.1,
        //max: 10,
        step: 0.1,
        defaultValue: 1.2,
    },

    earthMoonSize: {
        type: ControlType.Number,
        title: "Moon Size",
        min: 0.05,
        max: 2,
        step: 0.05,
        defaultValue: 0.2,
    },

    earthMoonSpeed: {
        type: ControlType.Number,
        title: "Moon Speed",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 1,
    },

    earthMoonTexture: {
        type: ControlType.Image,
        title: "Moon Tex",
    },

    overlayMoon: {
        type: ControlType.ComponentInstance,
        title: "HUD Moon",
    },
}) */
