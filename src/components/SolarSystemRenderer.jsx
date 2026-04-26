import React, { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { createCamera, getInitialCameraTarget } from "../core/camera.js"
import { createControls } from "../core/controls.js"
import {
    getDistanceForViewportHeight,
    getFocusDistance,
    getNextPlanetName,
} from "../core/navigation.js"
import { createPostProcessing } from "../core/postprocessing.js"
import {
    resolveHoveredSceneUnit,
    syncRendererSize,
} from "../core/raycasting.js"
import { createRenderer, createScene } from "../core/scene.js"
import {
    applySceneOverrides,
    applySceneVisibility,
    buildSceneOverrides,
} from "../core/scenePlayback.js"
import {
    getSceneUnit as resolveSceneUnit,
    getSceneUnitTarget as resolveSceneUnitTarget,
    registerSceneUnit as addSceneUnit,
    restoreSceneUnitVisibility as showAllSceneUnits,
    saveSceneUnitState as snapshotSceneUnitState,
} from "../core/sceneUnits.js"
import {
    BASE_MOONS,
    DEFAULT_SYSTEM,
    PLANET_NAV,
    getJupiterMoonConfigs,
    getPlanetConfigs,
} from "../config/planets.js"
import { getSceneConfig } from "../config/scenes.js"
import { GrainShader, rendererConfig } from "../config/renderer.js"
import { createSphere } from "../systems/planets.js"
import { createRingPlane } from "../systems/orbits.js"
import { updateMoonSystems } from "../systems/moons.js"
import { createSunLighting } from "../systems/lights.js"
import { createAsteroidBelt } from "../systems/asteroids.js"
import {
    getDisplayName as resolveDisplayName,
} from "../ui/labels.js"
import { HUD_BY_BODY } from "../huds/index.jsx"
import JupiterInteriorHUD from "../huds/JupiterinteriorHUD.jsx"
import { createTextureLoader } from "../utils/textures.js"
import BottomNavigation from "../ui/BottomNavigation.jsx"
import LabelsLayer from "../ui/LabelsLayer.jsx"
import LoadingOverlay from "../ui/LoadingOverlay.jsx"
import OverlayHost from "../ui/OverlayHost.jsx"
import SettingsPanel from "../ui/SettingsPanel.jsx"
import StarTravel from "./StarTravel.jsx"

const lerpAngle = (from, to, amount) => {
    const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from))
    return from + delta * amount
}

const getSphereTextureDirection = ({ u, v }) => {
    const phi = u * Math.PI * 2
    const theta = v * Math.PI

    return new THREE.Vector3(
        -Math.cos(phi) * Math.sin(theta),
        Math.cos(theta),
        Math.sin(phi) * Math.sin(theta)
    ).normalize()
}

const getYRotationToFaceCamera = ({ baseDirection, object, camera }) => {
    if (!baseDirection || !object?.parent || !camera) return null

    const centerWorld = new THREE.Vector3()
    object.getWorldPosition(centerWorld)

    const cameraDirectionWorld = new THREE.Vector3()
        .subVectors(camera.position, centerWorld)
        .normalize()

    const centerParent = object.parent.worldToLocal(centerWorld.clone())
    const cameraParent = object.parent.worldToLocal(
        centerWorld.clone().add(cameraDirectionWorld)
    )
    const cameraDirectionParent = cameraParent.sub(centerParent).normalize()

    const baseAngle = Math.atan2(baseDirection.z, baseDirection.x)
    const cameraAngle = Math.atan2(
        cameraDirectionParent.z,
        cameraDirectionParent.x
    )

    return baseAngle - cameraAngle
}

export default function SolarSystemRenderer(externalProps) {
    const props = useMemo(
        () => ({ ...rendererConfig, ...(externalProps || {}) }),
        [externalProps]
    )
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
    const solarSystemGroup = useRef(new THREE.Group())
    const jupiterOrbitPivot = useRef(new THREE.Group())
    const jupiterGroup = useRef(new THREE.Group())
    const ringsGroup = useRef(new THREE.Group())
    const saturnRingsGroup = useRef(new THREE.Group())
    const uranusRingsGroup = useRef(new THREE.Group())
    const neptuneRingsGroup = useRef(new THREE.Group())
    const sunPosLerp = useRef(new THREE.Vector3())
    const sunFlareSpriteRef = useRef(null)
    const jupiterInteriorRadiusRef = useRef(
        props.jupiterRadius ?? DEFAULT_SYSTEM.Jupiter.radius
    )
    const jupiterGreatRedSpotDirectionRef = useRef(
        getSphereTextureDirection({
            u: props.greatRedSpotTextureU ?? 0.365,
            v: props.greatRedSpotTextureV ?? 0.635,
        })
    )

    const [labels, setLabels] = useState([])
    const [focusedMoon, setFocusedMoon] = useState(null)
    const focusedMoonRef = useRef(null)
    const [hudFeatureFocus, setHudFeatureFocus] = useState(null)
    const hudFeatureFocusRef = useRef(null)
    const [isInsideJupiter, setIsInsideJupiter] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [settingsAnchorX, setSettingsAnchorX] = useState(null)
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

    const [isLoadingAssets, setIsLoadingAssets] = useState(true)
    const [loadingProgress, setLoadingProgress] = useState(0)

    const [cfg, setCfg] = useState({
        sunIntensity: props.sunIntensity ?? 0.5,
        bloomStrength: props.bloomStrength ?? 0.25,
        bloomRadius: props.bloomRadius ?? 0.35,
        bloomThreshold: props.bloomThreshold ?? 0.05,
        ambientIntensity: props.ambientIntensity,
        orbitSpeed: props.orbitSpeed ?? 1,
        rotateSpeed: props.rotateSpeed ?? 1,
        autoRotate: props.autoRotate ?? 1,
        showText: props.showText ?? 1,
        hideUI: false,
    })

    const cfgRef = useRef(cfg)
    const selectedMoonRef = useRef(null)
    const [selectedName, setSelectedName] = useState(null)
    const isInsideRef = useRef(false)
    const freeNavigationRef = useRef(false)
    const hasUserInteractedRef = useRef(false)
    const savedFocusRef = useRef(null)
    const savedDistanceRef = useRef(null)

    const currentViewRef = useRef({ mode: "focus", target: "Jupiter" })
    const viewHistoryRef = useRef([])
    const suppressHistoryRef = useRef(false)

    const setSelectedTarget = (name) => {
        selectedMoonRef.current = name
        setSelectedName(name)
    }

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
    const [hoveredObjectName, setHoveredObjectName] = useState(null)
    const raycasterRef = useRef(new THREE.Raycaster())
    const mouseNdcRef = useRef(new THREE.Vector2())
    const propsRef = useRef(props)

    const registerSceneUnit = (unit) => addSceneUnit(sceneUnitsRef.current, unit)

    const getSceneUnit = (name) => resolveSceneUnit(sceneUnitsRef.current, name)

    const getSceneUnitTarget = (name) =>
        resolveSceneUnitTarget(sceneUnitsRef.current, moonsRef.current, name)

    const getObjectWorldRadius = (unit) => {
        const body = unit?.body || unit?.focusTarget
        const baseRadius = body?.userData?.baseRadius
        if (!body || !baseRadius) return null

        const worldScale = body.getWorldScale
            ? body.getWorldScale(body.scale.clone())
            : body.scale

        return baseRadius * Math.max(worldScale.x, worldScale.y, worldScale.z)
    }

    const getProjectedViewportHeight = ({ camera, worldPos, radius }) => {
        if (!camera || !worldPos || !radius) return 0

        const distance = camera.position.distanceTo(worldPos)
        if (distance <= 0) return 1

        const angularDiameter = 2 * Math.atan(radius / distance)
        const fovRadians = (camera.fov * Math.PI) / 180

        return angularDiameter / fovRadians
    }

    const saveSceneUnitState = () => {
        sceneUnitSavedStateRef.current = snapshotSceneUnitState(
            sceneUnitsRef.current
        )
    }

    const restoreSceneUnitVisibility = () => {
        showAllSceneUnits(sceneUnitsRef.current)
    }

    useEffect(() => {
        propsRef.current = props
        jupiterGreatRedSpotDirectionRef.current = getSphereTextureDirection({
            u: props.greatRedSpotTextureU ?? 0.365,
            v: props.greatRedSpotTextureV ?? 0.635,
        })
    }, [props])

    useEffect(() => {
        cfgRef.current = cfg
    }, [cfg])

    useEffect(() => {
        focusedMoonRef.current = focusedMoon
    }, [focusedMoon])

    useEffect(() => {
        hudFeatureFocusRef.current = hudFeatureFocus
    }, [hudFeatureFocus])

    const getActiveOverlay = () => {
        if (!focusedMoon) return null

        if (BASE_MOONS.includes(focusedMoon)) {
            return HUD_BY_BODY[focusedMoon] || props[`overlay${focusedMoon}`]
        }

        if (focusedMoon === "Moon") {
            return HUD_BY_BODY.Moon || props.overlayMoon || null
        }

        if (HUD_BY_BODY[focusedMoon]) {
            return HUD_BY_BODY[focusedMoon]
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

    const getDefaultFocusDistance = (name) => {
        const custom = props.customMarkers?.find((m) => m.name === name)
        const unit = getSceneUnit(name)

        return getFocusDistance({
            name,
            config: propsRef.current,
            customMarker: custom,
            unit,
            camera: cameraRef.current,
        })
    }

    const handleHudFeatureFocus = (feature) => {
        setHudFeatureFocus(feature)
        hudFeatureFocusRef.current = feature

        if (feature === "jupiter-great-red-spot") {
            if (selectedMoonRef.current !== "Jupiter") {
                focusOn("Jupiter")
            }

            const jupiterUnit = getSceneUnit("Jupiter")
            const jupiterRadius = getObjectWorldRadius(jupiterUnit)
            const featureDistance = getDistanceForViewportHeight({
                camera: cameraRef.current,
                radius: jupiterRadius,
                viewportFraction: props.greatRedSpotViewportHeight ?? 1.08,
            })

            targetDistance.current =
                featureDistance ?? getDefaultFocusDistance("Jupiter")
            return
        }

        if (selectedMoonRef.current === "Jupiter") {
            targetDistance.current = getDefaultFocusDistance("Jupiter")
        }
    }

    const decorateOverlay = (overlay) => {
        if (!React.isValidElement(overlay)) return overlay

        return React.cloneElement(overlay, {
            onFeatureFocus: handleHudFeatureFocus,
        })
    }

    const ActiveOverlay = decorateOverlay(getActiveOverlay())
    const InteriorOverlay = isInsideJupiter
        ? props.overlayInteriorJupiter || <JupiterInteriorHUD />
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
        setHudFeatureFocus(null)
        hudFeatureFocusRef.current = null
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
        hasUserInteractedRef.current = false

        setSelectedTarget(null)
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
        setSelectedTarget(null)
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
            setSelectedTarget(null)
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

        if (view.mode === "locked" && view.target) {
            freeNavigationRef.current = false
            setFreeFlightMode(false)
            setSelectedTarget(view.target)
            focusedMoonRef.current = null
            currentViewRef.current = { mode: "locked", target: view.target }

            targetDistance.current = propsRef.current.focusDistPlanet ?? 6
            currentDistance.current = propsRef.current.focusDistPlanet ?? 6

            setHudFeatureFocus(null)
            hudFeatureFocusRef.current = null
            setFocusedMoon(null)
            setIsInsideJupiter(false)
            isInsideRef.current = false
            setCfg((prev) => ({ ...prev, hideUI: false }))
        }

        if (view.mode === "focus" && view.target) {
            freeNavigationRef.current = false
            setSelectedTarget(view.target)
            focusedMoonRef.current = view.target
            currentViewRef.current = { mode: "focus", target: view.target }

            const custom = props.customMarkers?.find(
                (m) => m.name === view.target
            )
            const unit = getSceneUnit(view.target)

            targetDistance.current = getFocusDistance({
                name: view.target,
                config: propsRef.current,
                customMarker: custom,
                unit,
                camera: cameraRef.current,
            })

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

        Object.entries(sceneUnitsRef.current).forEach(([name, unit]) => {
            const obj = unit.focusTarget || unit.body || unit.root
            if (!obj || unit.root?.visible === false) return

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
        setSelectedTarget(closestName)
        focusedMoonRef.current = null

        setFocusedMoon(null)
        setIsInsideJupiter(false)
        isInsideRef.current = false

        const custom = props.customMarkers?.find((m) => m.name === closestName)
        const unit = getSceneUnit(closestName)

        targetDistance.current = getFocusDistance({
            name: closestName,
            config: propsRef.current,
            customMarker: custom,
            unit,
            camera: cameraRef.current,
        })

        setCfg((prev) => ({ ...prev, hideUI: false }))
    }

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        if (container.offsetWidth === 0 || container.offsetHeight === 0)
            return

        if (rendererRef.current) {
            const oldCanvas = rendererRef.current.domElement
            rendererRef.current.dispose()
            rendererRef.current.forceContextLoss?.()
            if (oldCanvas && oldCanvas.parentNode === container) {
                container.removeChild(oldCanvas)
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

        solarSystemGroup.current.clear()
        jupiterOrbitPivot.current.clear()
        jupiterGroup.current.clear()
        ringsGroup.current.clear()
        saturnRingsGroup.current.clear()
        uranusRingsGroup.current.clear()
        neptuneRingsGroup.current.clear()

        const renderer = createRenderer({
            container,
            toneMappingExposure: props.toneMappingExposure,
        })
        rendererRef.current = renderer

        const scene = createScene({
            solarSystemGroup: solarSystemGroup.current,
            jupiterOrbitPivot: jupiterOrbitPivot.current,
            jupiterGroup: jupiterGroup.current,
            ringsGroup: ringsGroup.current,
        })
        sceneRef.current = scene

        const camera = createCamera({
            container,
            config: props,
        })
        cameraRef.current = camera

        const controls = createControls({
            camera,
            domElement: renderer.domElement,
            config: props,
        })
        controlsRef.current = controls

        cameraTarget.current.copy(getInitialCameraTarget(props))

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

        const loadTexture = createTextureLoader({ renderer, loadingManager })

        const makeSphere = ({
            name,
            textureUrl,
            radius,
            position,
            color,
            segments = 64,
            emissive = 0x000000,
            basic = false,
        }) =>
            createSphere({
                name,
                textureUrl,
                radius,
                position,
                color,
                segments,
                emissive,
                basic,
                loadTexture,
                config: props,
            })

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
        }) =>
            createRingPlane({
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
                loadTexture,
                config: props,
            })

        const sunMesh = makeSphere({
            name: "Sun",
            textureUrl: props.sunTexture,
            radius: props.sunSize || 3,
            position: [0, 0, 0],
            color: 0xffaa33,
            segments: 96,
            basic: true,
        })

        const sunTarget = new THREE.Mesh(
            new THREE.SphereGeometry(props.sunTargetSize ?? 0.18, 8, 8),
            new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                depthWrite: false,
                depthTest: false,
            })
        )
        sunTarget.name = "Sun Target"
        sunTarget.position.set(0, 0, 0)
        sunMesh.add(sunTarget)

        solarSystemGroup.current.add(sunMesh)
        moonsRef.current["Sun"] = sunMesh

        registerSceneUnit({
            name: "Sun",
            type: "star",
            root: sunMesh,
            body: sunMesh,
            focusTarget: sunTarget,
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

        const {
            sunLight,
            directionalLight,
            ambient,
            sunFlareLight,
            sunFlareSprite,
        } = createSunLighting({
            scene,
            solarSystemGroup: solarSystemGroup.current,
            sunMesh,
            loadTexture,
            config: props,
        })

        sunFlareSpriteRef.current = sunFlareSprite
        sunPosLerp.current.set(props.sunX ?? -10, 0, props.sunZ ?? 5)

        const planets = getPlanetConfigs(props)

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
                    scale: props.saturnRingScale ?? 1.5,
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
            if (planet.name === "Earth") {
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
            textureUrl: rendererConfig.jupiterTexture,
            radius: jupiterRadius,
            position: DEFAULT_SYSTEM.Jupiter.position,
            color: DEFAULT_SYSTEM.Jupiter.color,
            segments: props.jupiterSegments || 96,
        })

        jupiterInteriorRadiusRef.current =
            props.jupiterInteriorRadius ?? jupiterRadius * 0.985

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
            setSelectedTarget("Jupiter")
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

        const moonsData = getJupiterMoonConfigs(props)

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

        const instanced = createAsteroidBelt(props)

        solarSystemGroup.current.add(instanced)
        registerSceneUnit({
            name: "AsteroidBelt",
            type: "environment",
            root: instanced,
            body: instanced,
            focusTarget: instanced,
            hideWithScene: true,
        })

        const { composer, bloomPass, grainPass } = createPostProcessing({
            renderer,
            scene,
            camera,
            container,
            config: props,
            grainShader: GrainShader,
        })

        composerRef.current = composer

        const handleMouseMove = (event) => {
            const rect = container.getBoundingClientRect()
            if (!rect) return

            // movimento normal
            setMousePos({
                x: (event.clientX / window.innerWidth - 0.5) * 2,
                y: (event.clientY / window.innerHeight - 0.5) * 2,
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

        container.addEventListener("wheel", handleWheel, {
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
            const sunWorldPos = new THREE.Vector3()
            sunMesh.getWorldPosition(sunWorldPos)
            sunFlareLight.position.copy(sunWorldPos)

            const sunDirection = new THREE.Vector3().subVectors(
                sunWorldPos,
                cam.position
            )
            const sunDistance = sunDirection.length()
            let sunOccluded = false

            if (sunDistance > 0.001) {
                sunDirection.normalize()
                raycasterRef.current.set(cam.position, sunDirection)

                const occluderObjects = Object.values(sceneUnitsRef.current)
                    .map((unit) => unit.body || unit.root)
                    .filter(Boolean)
                    .filter((obj) => obj.name !== "Sun")

                const intersections = raycasterRef.current.intersectObjects(
                    occluderObjects,
                    true
                )
                sunOccluded = intersections.some(
                    (hit) => hit.distance < sunDistance - 0.001
                )
            }

            const flareVisible = !isRealScaleScene && !sunOccluded
            sunFlareLight.visible = flareVisible
            if (sunFlareSpriteRef.current) {
                sunFlareSpriteRef.current.visible = flareVisible
            }
            sunGlow.visible = flareVisible
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

            if (ctrl && cam && container) {
                setHoveredObjectName(
                    resolveHoveredSceneUnit({
                        raycaster: raycasterRef.current,
                        mouseNdc: mouseNdcRef.current,
                        camera: cam,
                        sceneUnits: sceneUnitsRef.current,
                    })
                )

                const rect = container.getBoundingClientRect()

                syncRendererSize({
                    renderer,
                    composer,
                    bloomPass,
                    camera: cam,
                    rect,
                })

                currentDistance.current +=
                    (targetDistance.current - currentDistance.current) *
                    (p.zoomSmoothness ?? 0.05)

                const selectedName = selectedMoonRef.current
                const selectedUnit = selectedName
                    ? getSceneUnit(selectedName)
                    : null
                const selectedObj = selectedName
                    ? getSceneUnitTarget(selectedName)
                    : null
                const selectedRadius = getObjectWorldRadius(selectedUnit)
                const selectedViewportHeight =
                    selectedObj && selectedRadius
                        ? getProjectedViewportHeight({
                              camera: cam,
                              worldPos: selectedObj.getWorldPosition(
                                  new THREE.Vector3()
                              ),
                              radius: selectedRadius,
                          })
                        : 0
                const hudHideViewportHeight = p.hudHideViewportHeight ?? 0.3

                if (focusedMoon && selectedName === focusedMoon) {
                    const shouldHide =
                        selectedViewportHeight > 0 &&
                        selectedViewportHeight <= hudHideViewportHeight

                    if (shouldHide) {
                        setHudFeatureFocus(null)
                        hudFeatureFocusRef.current = null
                        setFocusedMoon(null)
                        focusedMoonRef.current = null
                    }
                }

                ctrl.minDistance = p.minZoom || 0.05
                ctrl.maxDistance = p.maxZoomLimit || 1000

                if (
                    activeSceneName &&
                    activeSceneConfig?.camera &&
                    !selectedMoonRef.current &&
                    !hasUserInteractedRef.current
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
                } else if (activeSceneName && !selectedMoonRef.current) {
                    ctrl.enableZoom = true
                    ctrl.enablePan = true
                    ctrl.enableRotate = true
                    ctrl.update()
                } else if (freeNavigationRef.current) {
                    ctrl.enableZoom = true
                    ctrl.enablePan = true
                    ctrl.enableRotate = true
                    ctrl.update()
                } else {
                    const moonName = selectedMoonRef.current
                    const targetSunPos = new THREE.Vector3()

                    const targetObj = getSceneUnitTarget(moonName)

                    if (moonName && targetObj) {
                        const worldPos = new THREE.Vector3()
                        targetObj.getWorldPosition(worldPos)
                        const isGreatRedSpotFocus =
                            moonName === "Jupiter" &&
                            hudFeatureFocusRef.current ===
                                "jupiter-great-red-spot"
                        const focusWorldPos = worldPos.clone()

                        if (isGreatRedSpotFocus) {
                            const jupiterRadius =
                                getObjectWorldRadius(getSceneUnit("Jupiter")) ??
                                DEFAULT_SYSTEM.Jupiter.radius
                            const spotLocal = jupiterGreatRedSpotDirectionRef
                                .current.clone()
                                .multiplyScalar(
                                    jupiterRadius *
                                        (p.greatRedSpotSurfaceOffset ?? 0.98)
                                )
                            focusWorldPos.copy(
                                jupiterGroup.current.localToWorld(spotLocal)
                            )
                        }

                        cameraTarget.current.copy(focusWorldPos)

                        const direction = new THREE.Vector3()
                            .subVectors(cam.position, ctrl.target)
                            .normalize()

                        if (!Number.isFinite(direction.x)) {
                            direction.set(0, 0, 1)
                        }

                        const desiredCamPos = new THREE.Vector3()
                            .copy(focusWorldPos)
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
                            .add(focusWorldPos)
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
                        currentDistance.current <
                            jupiterInteriorRadiusRef.current

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

                const allNav = Object.keys(sceneUnitsRef.current).filter(
                    (name) => {
                        const unit = sceneUnitsRef.current[name]
                        if (!unit) return false

                        return ["star", "planet", "moon", "marker"].includes(
                            unit.type
                        )
                    }
                )

                const newLabels = []

                allNav.forEach((name) => {
                    const obj = getSceneUnitTarget(name)
                    if (!obj) return

                    const unit = getSceneUnit(name)
                    if (
                        activeSceneConfig?.objects?.length &&
                        unit?.root?.visible === false
                    )
                        return

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

                const isGreatRedSpotFocus =
                    hudFeatureFocusRef.current === "jupiter-great-red-spot"

                if (isGreatRedSpotFocus) {
                    const targetJupiterRotation =
                        getYRotationToFaceCamera({
                            baseDirection:
                                jupiterGreatRedSpotDirectionRef.current,
                            object: jupiterGroup.current,
                            camera: cam,
                        }) ??
                        THREE.MathUtils.degToRad(
                            p.greatRedSpotRotationY ?? -124
                        )

                    jupiterGroup.current.rotation.y = lerpAngle(
                        jupiterGroup.current.rotation.y,
                        targetJupiterRotation,
                        p.greatRedSpotTurnSpeed ?? 0.08
                    )
                } else if (!focusedJupiterChild) {
                    jupiterGroup.current.rotation.y +=
                        (c.rotateSpeed ?? 0.5) * 0.005
                }

                updateMoonSystems({
                    moons: pivotsRef.current,
                    earth: moonsRef.current["Earth"],
                    selectedName: selectedMoonRef.current,
                    orbitSpeed: c.orbitSpeed,
                    rotateSpeed: c.rotateSpeed,
                })

                sunMesh.rotation.y += 0.002
                const clouds = moonsRef.current["Earth_Clouds"]
                if (clouds) {
                    clouds.rotation.y += 0.0008
                }
            }

            const { overrides, activeSceneUnits } = buildSceneOverrides({
                activeSceneConfig,
                getSceneUnit,
            })
            sceneOverrideRef.current = overrides
            const isCustomSceneActive = !!activeSceneConfig?.objects?.length

            applySceneVisibility({
                sceneUnits: sceneUnitsRef.current,
                activeSceneUnits,
                isCustomSceneActive,
            })

            applySceneOverrides({
                sceneUnits: sceneUnitsRef.current,
                sceneUnitSavedState: sceneUnitSavedStateRef.current,
                originalScales: originalScalesRef.current,
                overrides,
            })

            // Keep the rim lift subtle so planets do not bloom when frontlit.
            const sunPos = new THREE.Vector3()
            sunMesh.getWorldPosition(sunPos)

            Object.values(sceneUnitsRef.current).forEach((unit) => {
                if (unit?.body?.material && (unit.type === "planet" || unit.type === "moon")) {
                    const planetPos = new THREE.Vector3()
                    unit.body.getWorldPosition(planetPos)
                    const toCam = new THREE.Vector3().subVectors(cam.position, planetPos).normalize()
                    const toSun = new THREE.Vector3().subVectors(sunPos, planetPos).normalize()
                    const backlit = toCam.dot(toSun)

                    if (unit.body.material.emissiveIntensity !== undefined) {
                        unit.body.material.emissiveIntensity = Math.max(
                            0,
                            backlit * (p.planetBacklightEmissive ?? 0.12)
                        )
                    }
                }
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
            bloomPass.threshold = c.bloomThreshold ?? p.bloomThreshold ?? 0.04

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

            container.removeEventListener("wheel", handleWheel)

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

                if (canvas && canvas.parentNode === container) {
                    container.removeChild(canvas)
                }

                rendererRef.current = null
            }
        }
    }, [props])

    const focusOn = (name) => {
        const wasFocused = focusedMoonRef.current === name

        pushCurrentViewToHistory()

        hasUserInteractedRef.current = true
        freeNavigationRef.current = false
        setFreeFlightMode(false)
        setSelectedTarget(name)
        focusedMoonRef.current = name
        if (name !== "Jupiter") {
            setHudFeatureFocus(null)
            hudFeatureFocusRef.current = null
        }

        currentViewRef.current = { mode: "focus", target: name }

        const custom = props.customMarkers?.find((m) => m.name === name)
        const unit = getSceneUnit(name)

        const focusDist = getFocusDistance({
            name,
            config: propsRef.current,
            customMarker: custom,
            unit,
            camera: cameraRef.current,
        })

        targetDistance.current = focusDist
        currentDistance.current = focusDist

        if (wasFocused) {
            setFocusedMoon(null)
            window.requestAnimationFrame(() => setFocusedMoon(name))
        } else {
            setFocusedMoon(name)
        }

        if (cleanNavigationMode) {
            setFocusedMoon(null)
            focusedMoonRef.current = null
            setCfg((prev) => ({ ...prev, hideUI: true }))
        } else {
            setCfg((prev) => ({ ...prev, hideUI: false }))
        }
    }

    const navigate = (dir) => {
        focusOn(
            getNextPlanetName({
                focusedName: focusedMoon,
                selectedName: selectedMoonRef.current,
                direction: dir,
                nav: PLANET_NAV,
            })
        )
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

    const getDisplayName = (name) => resolveDisplayName(name, props)

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
            <StarTravel {...props.starTravel} />

            {isLoadingAssets && <LoadingOverlay progress={loadingProgress} />}

            <LabelsLayer
                labels={labels}
                focusedMoon={focusedMoon}
                selectedName={selectedName}
                isInsideJupiter={isInsideJupiter}
                cleanNavigationMode={cleanNavigationMode}
                freeFlightMode={freeFlightMode}
                autoHideUI={autoHideUI}
                cfg={cfg}
                config={props}
                isJupiterChildTarget={isJupiterChildTarget}
                isJupiterContext={isJupiterContext}
                getDisplayName={getDisplayName}
                onFocus={focusOn}
                hudOpen={!!ActiveOverlay || !!InteriorOverlay}
                hoveredObjectName={hoveredObjectName}
            />
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
            <BottomNavigation
                activeButtonStyle={activeButtonStyle}
                activeScene={activeScene}
                autoHideUI={autoHideUI}
                cleanNavigationMode={cleanNavigationMode}
                cfg={cfg}
                freeFlightMode={freeFlightMode}
                isFullscreen={isFullscreen}
                menuForceHidden={menuForceHidden}
                menuHoverZone={menuHoverZone}
                scenes={props.scenes}
                simMenuOpen={simMenuOpen}
                onBack={() => navigate(-1)}
                onForward={() => navigate(1)}
                onGoBackView={goBackView}
                onReleaseToSpace={releaseToSpace}
                onSceneClick={(sceneId) => {
                    startScene(sceneId)
                    setSimMenuOpen(false)
                }}
                onSettingsToggle={(event) => {
                    const buttonRect =
                        event.currentTarget.getBoundingClientRect()
                    const containerRect =
                        containerRef.current?.getBoundingClientRect()

                    if (containerRect) {
                        setSettingsAnchorX(
                            buttonRect.left +
                                buttonRect.width / 2 -
                                containerRect.left
                        )
                    }

                    setShowSettings(!showSettings)
                }}
                onSimMenuToggle={() => {
                    if (activeScene) {
                        stopScene()
                        setSimMenuOpen(false)
                    } else if (props.scenes?.length) {
                        setSimMenuOpen((prev) => !prev)
                    }
                }}
                onToggleFullscreen={toggleFullscreen}
                onToggleHideUI={toggleHideUI}
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
            />
            {showSettings && (
                <SettingsPanel
                    key={settingsAnchorX ?? "center"}
                    anchorX={settingsAnchorX}
                    cfg={cfg}
                    setCfg={setCfg}
                />
            )}

            <OverlayHost
                activeOverlay={ActiveOverlay}
                interiorOverlay={InteriorOverlay}
                mousePos={mousePos}
                hudIntensity={props.hudIntensity}
            />

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
