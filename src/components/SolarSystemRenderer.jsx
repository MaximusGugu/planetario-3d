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
    restoreSceneUnitState as restoreSavedSceneUnitState,
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
import { createEarth, createSphere } from "../systems/planets.js"
import {
    createRingDebrisLayer,
    createRingPlane,
    createRingShadowShell,
} from "../systems/orbits.js"
import { updateMoonSystems } from "../systems/moons.js"
import { createSunLighting } from "../systems/lights.js"
import {
    ASTEROID_LAYER,
    createAsteroidBelt,
} from "../systems/asteroids.js"
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

const getSphereLatLonDirection = ({ latitude = 0, longitude = 0 }) => {
    const lat = THREE.MathUtils.degToRad(latitude)
    const lon = THREE.MathUtils.degToRad(longitude)
    const cosLat = Math.cos(lat)

    return new THREE.Vector3(
        -Math.cos(lon) * cosLat,
        Math.sin(lat),
        Math.sin(lon) * cosLat
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

const getAngularRadius = ({ radius, distance }) => {
    if (!radius || !distance || distance <= 0) return 0

    return Math.asin(Math.min(1, radius / distance))
}

const getLabelsSignature = (labels) =>
    labels
        .map(
            (label) =>
                `${label.name}:${Math.round(label.x)}:${Math.round(label.y)}:${label.visible ? 1 : 0}`
        )
        .join("|")

const formatPerfNumber = (value, digits = 0) =>
    Number.isFinite(value) ? value.toFixed(digits) : "-"

export default function SolarSystemRenderer(externalProps) {
    const props = useMemo(
        () => ({ ...rendererConfig, ...(externalProps || {}) }),
        [externalProps]
    )
    const showPerformanceMonitor = useMemo(() => {
        if (props.performanceMonitor) return true
        if (typeof window === "undefined") return false

        return new URLSearchParams(window.location.search).has("perf")
    }, [props.performanceMonitor])
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
    const jupiterRingDebrisRef = useRef(null)
    const saturnRingsGroup = useRef(new THREE.Group())
    const saturnRingDebrisRef = useRef(null)
    const uranusRingsGroup = useRef(new THREE.Group())
    const uranusRingDebrisRef = useRef(null)
    const neptuneRingsGroup = useRef(new THREE.Group())
    const neptuneRingDebrisRef = useRef(null)
    const ringShadowRefs = useRef({})
    const labelsLastUpdateRef = useRef(0)
    const labelsSignatureRef = useRef("")
    const sceneOverrideCacheRef = useRef({
        activeSceneName: null,
        activeSceneConfig: null,
        overrides: {},
        activeSceneUnits: new Set(),
        activeSceneChildParents: new Set(),
        isCustomSceneActive: false,
    })
    const perfFrameRef = useRef({
        lastUpdate: 0,
        lastFrameTime: 0,
        frames: 0,
        frameTotal: 0,
        fps: 0,
        frameMs: 0,
    })
    const sunPosLerp = useRef(new THREE.Vector3())
    const focusLightBlendRef = useRef(0)
    const focusLayerObjectRef = useRef(null)
    const hudCameraLockRef = useRef(null)
    const jupiterInteriorRadiusRef = useRef(
        props.jupiterRadius ?? DEFAULT_SYSTEM.Jupiter.radius
    )

    const [labels, setLabels] = useState([])
    const [focusedMoon, setFocusedMoon] = useState(null)
    const focusedMoonRef = useRef(null)
    const [hudFeatureFocus, setHudFeatureFocus] = useState(null)
    const hudFeatureFocusRef = useRef(null)
    const [activeFeatureHud, setActiveFeatureHud] = useState(null)
    const [hudAccordionResetKey, setHudAccordionResetKey] = useState(0)
    const [isInsideJupiter, setIsInsideJupiter] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [settingsAnchorX, setSettingsAnchorX] = useState(null)
    const [autoHideUI, setAutoHideUI] = useState(false)

    const [cleanNavigationMode, setCleanNavigationMode] = useState(false)
    const [freeFlightMode, setFreeFlightMode] = useState(false)
    const [showFreeFlightHint, setShowFreeFlightHint] = useState(false)
    const [menuHoverZone, setMenuHoverZone] = useState(false)
    const ignoreMenuHoverRef = useRef(false)
    const hideMenuUntilMouseLeavesRef = useRef(false)
    const [menuForceHidden, setMenuForceHidden] = useState(false)
    const menuRevealUnlockAtRef = useRef(0)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const [activeScene, setActiveScene] = useState(null)
    const [simMenuOpen, setSimMenuOpen] = useState(false)
    const activeSceneRef = useRef(null)
    const runtimeSceneConfigRef = useRef(null)
    const [runtimeSceneSettings, setRuntimeSceneSettings] = useState(null)
    const sceneStartTimeRef = useRef(0)
    const originalScalesRef = useRef({})

    const [isLoadingAssets, setIsLoadingAssets] = useState(true)
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [perfStats, setPerfStats] = useState(null)

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
    const freeFlightKeysRef = useRef({
        KeyW: false,
        KeyA: false,
        KeyS: false,
        KeyD: false,
        ShiftLeft: false,
        ShiftRight: false,
    })
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

    const FOCUSED_LAYER = 3;

    const setLayerRecursive = (object, layer) => {
        if (!object) return;
        object.traverse((child) => {
            if (layer === FOCUSED_LAYER) {
                if ((child.layers.mask & 1) !== 0) {
                    child.layers.disable(0);
                    child.layers.enable(FOCUSED_LAYER);
                    child.userData.movedToLayer3 = true;
                }
            } else {
                if (child.userData.movedToLayer3) {
                    child.layers.disable(FOCUSED_LAYER);
                    child.layers.enable(0);
                    child.userData.movedToLayer3 = false;
                }
            }
        });
    }

    const setFocusLayerObject = (unit) => {
        if (focusLayerObjectRef.current === unit) return

        if (focusLayerObjectRef.current) {
            if (focusLayerObjectRef.current.body) {
                focusLayerObjectRef.current.body.userData.focused = false
            }
            setLayerRecursive(focusLayerObjectRef.current.root, 0)
        }

        focusLayerObjectRef.current = unit || null

        if (focusLayerObjectRef.current) {
            if (focusLayerObjectRef.current.body) {
                focusLayerObjectRef.current.body.userData.focused = true
            }
            setLayerRecursive(focusLayerObjectRef.current.root, FOCUSED_LAYER)
        }
    }

    const pushCurrentViewToHistory = () => {
        if (suppressHistoryRef.current) return
        viewHistoryRef.current.push({ ...currentViewRef.current })
    }

    const resetHudAccordion = () => {
        setHudAccordionResetKey((key) => key + 1)
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

    const restoreSceneUnitState = () => {
        restoreSavedSceneUnitState(
            sceneUnitsRef.current,
            sceneUnitSavedStateRef.current
        )
        sceneUnitSavedStateRef.current = {}
        originalScalesRef.current = {}
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

    useEffect(() => {
        hudFeatureFocusRef.current = hudFeatureFocus
    }, [hudFeatureFocus])

    const getActiveOverlay = () => {
        if (activeFeatureHud) return activeFeatureHud
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

    const getLandingTargetName = (name) => {
        const marker = propsRef.current.customMarkers?.find(
            (m) => m.name === name
        )

        return marker ? marker.parent || "Jupiter" : name
    }

    const getViewportDistance = (name, viewportFraction) => {
        const unit = getSceneUnit(name)
        const radius = getObjectWorldRadius(unit)

        return (
            getDistanceForViewportHeight({
                camera: cameraRef.current,
                radius,
                viewportFraction,
            }) ?? getDefaultFocusDistance(name)
        )
    }

    const getOrbitDistance = (name) =>
        getViewportDistance(
            getLandingTargetName(name),
            propsRef.current.orbitViewportHeight ?? 0.6
        )

    const getLandingDistance = (name) =>
        getViewportDistance(
            getLandingTargetName(name),
            propsRef.current.landingViewportHeight ??
            propsRef.current.planetViewportHeight ??
            0.75
        )

    const getHudFocusTargetConfig = (feature) => {
        if (!feature) return null

        const featureId =
            typeof feature === "string" ? feature : feature.id || feature.name
        if (!featureId) return null

        const featureSpec = typeof feature === "object" ? feature : {}
        const targetSpec = featureSpec.target || {}
        const cameraSpec = featureSpec.camera || {}
        const motionSpec = featureSpec.motion || {}

        return {
            id: featureId,
            type: featureSpec.type || "focus",
            bodyName:
                featureSpec.bodyName ||
                featureSpec.body ||
                targetSpec.body ||
                cameraSpec.body,
            target: targetSpec,
            camera: cameraSpec,
            motion: motionSpec,
            viewportHeight:
                cameraSpec.viewportHeight ?? featureSpec.viewportHeight,
            hud: featureSpec.hud || null,
            viewportHeightKey:
                cameraSpec.viewportHeightKey ?? featureSpec.viewportHeightKey,
            surfaceOffset:
                targetSpec.surfaceOffset ?? featureSpec.surfaceOffset,
            surfaceOffsetKey:
                targetSpec.surfaceOffsetKey ?? featureSpec.surfaceOffsetKey,
            textureU: targetSpec.textureU ?? featureSpec.textureU,
            textureV: targetSpec.textureV ?? featureSpec.textureV,
            latitude: targetSpec.latitude ?? featureSpec.latitude,
            longitude: targetSpec.longitude ?? featureSpec.longitude,
            localDirection:
                targetSpec.localDirection ?? featureSpec.localDirection,
            pivotTargetOffset:
                targetSpec.frame === "bodyPivot"
                    ? targetSpec.offset
                    : featureSpec.pivotTargetOffset,
            cameraDirection:
                cameraSpec.direction ?? featureSpec.cameraDirection,
            cameraLocalDirection:
                cameraSpec.localDirection ?? featureSpec.cameraLocalDirection,
            cameraPivotOffset:
                cameraSpec.frame === "bodyPivot"
                    ? cameraSpec.offset
                    : featureSpec.cameraPivotOffset,
            lockPosition: cameraSpec.lockPosition ?? featureSpec.lockPosition,
            allowLookAround:
                cameraSpec.allowLookAround ?? featureSpec.allowLookAround,
            allowZoom: cameraSpec.allowZoom ?? featureSpec.allowZoom,
            allowPan: cameraSpec.allowPan ?? featureSpec.allowPan,
            rotationYKey:
                motionSpec.rotationYKey ?? featureSpec.rotationYKey,
            turnSpeedKey:
                motionSpec.turnSpeedKey ?? featureSpec.turnSpeedKey,
            rotationY: motionSpec.rotationY ?? featureSpec.rotationY,
            turnSpeed: motionSpec.turnSpeed ?? featureSpec.turnSpeed,
            ...(propsRef.current.hudFocusTargets?.[featureId] || {}),
            ...featureSpec,
        }
    }

    const getHudFocusLocalDirection = (featureConfig) => {
        if (!featureConfig) return null

        if (
            Number.isFinite(featureConfig.textureU) &&
            Number.isFinite(featureConfig.textureV)
        ) {
            return getSphereTextureDirection({
                u: featureConfig.textureU,
                v: featureConfig.textureV,
            })
        }

        if (
            Number.isFinite(featureConfig.latitude) &&
            Number.isFinite(featureConfig.longitude)
        ) {
            return getSphereLatLonDirection({
                latitude: featureConfig.latitude,
                longitude: featureConfig.longitude,
            })
        }

        const localDirection = featureConfig.localDirection
        if (Array.isArray(localDirection) && localDirection.length >= 3) {
            return new THREE.Vector3(
                localDirection[0],
                localDirection[1],
                localDirection[2]
            ).normalize()
        }

        return null
    }

    const getHudFocusPivotFrame = (body) => {
        if (!body) return null

        const center = body.getWorldPosition(new THREE.Vector3())
        const radial = center.clone()

        if (radial.lengthSq() < 0.000001) {
            radial.set(1, 0, 0)
        } else {
            radial.normalize()
        }

        const up = new THREE.Vector3(0, 1, 0)
        const right = new THREE.Vector3().crossVectors(up, radial)

        if (right.lengthSq() < 0.000001) {
            right.set(1, 0, 0)
        } else {
            right.normalize()
        }

        return { center, radial, right, up }
    }

    const getHudFocusWorldPosition = (featureConfig) => {
        if (!featureConfig?.bodyName) return null

        const bodyUnit = getSceneUnit(featureConfig.bodyName)
        const body = bodyUnit?.body
        if (!body) return null

        if (featureConfig.pivotTargetOffset) {
            const frame = getHudFocusPivotFrame(body)
            if (frame) {
                const offset = featureConfig.pivotTargetOffset

                return frame.center
                    .clone()
                    .add(frame.right.clone().multiplyScalar(offset.right ?? 0))
                    .add(frame.up.clone().multiplyScalar(offset.up ?? 0))
                    .add(
                        frame.radial
                            .clone()
                            .multiplyScalar(offset.radial ?? 0)
                    )
            }
        }

        const localDirection = getHudFocusLocalDirection(featureConfig)

        if (localDirection) {
            const radius =
                getObjectWorldRadius(bodyUnit) ??
                body.userData?.baseRadius ??
                1
            const surfaceOffset =
                featureConfig.surfaceOffset ??
                (featureConfig.surfaceOffsetKey
                    ? propsRef.current[featureConfig.surfaceOffsetKey]
                    : null) ??
                1
            const local = localDirection
                .clone()
                .multiplyScalar(radius * surfaceOffset)

            return body.localToWorld(local)
        }

        return body.getWorldPosition(new THREE.Vector3())
    }

    const getHudFocusCameraDirection = (featureConfig) => {
        if (!featureConfig) return null

        if (
            featureConfig.camera?.frame === "surfaceNormal" &&
            featureConfig.bodyName
        ) {
            const body = getSceneUnit(featureConfig.bodyName)?.body
            const localDirection = getHudFocusLocalDirection(featureConfig)
            if (body && localDirection) {
                const center = body.getWorldPosition(new THREE.Vector3())
                const worldPoint = body.localToWorld(localDirection.clone())

                return worldPoint.sub(center).normalize()
            }
        }

        if (featureConfig.cameraPivotOffset && featureConfig.bodyName) {
            const bodyUnit = getSceneUnit(featureConfig.bodyName)
            if (bodyUnit?.body) {
                const frame = getHudFocusPivotFrame(bodyUnit.body)
                if (!frame) return null
                const offset = featureConfig.cameraPivotOffset

                const dir = new THREE.Vector3()
                    .add(frame.radial.clone().multiplyScalar(offset.radial ?? 0))
                    .add(frame.right.clone().multiplyScalar(offset.right ?? 0))
                    .add(frame.up.clone().multiplyScalar(offset.up ?? 0))

                return dir.lengthSq() > 0.000001 ? dir.normalize() : null
            }
        }

        const direction = featureConfig.cameraDirection
        if (Array.isArray(direction) && direction.length >= 3) {
            return new THREE.Vector3(
                direction[0],
                direction[1],
                direction[2]
            ).normalize()
        }

        const localDirection = featureConfig.cameraLocalDirection
        if (Array.isArray(localDirection) && localDirection.length >= 3) {
            const body = getSceneUnit(featureConfig.bodyName)?.body
            if (!body) return null

            const center = body.getWorldPosition(new THREE.Vector3())
            const localPoint = new THREE.Vector3(
                localDirection[0],
                localDirection[1],
                localDirection[2]
            ).normalize()
            const worldPoint = body.localToWorld(localPoint)

            return worldPoint.sub(center).normalize()
        }

        return null
    }

    const getHudFocusViewportHeight = (featureConfig) => {
        if (!featureConfig) return null

        if (featureConfig.viewportHeight) return featureConfig.viewportHeight
        if (featureConfig.viewportHeightKey) {
            return propsRef.current[featureConfig.viewportHeightKey]
        }

        return propsRef.current.featureViewportHeight
    }

    const createHudCameraLock = (featureConfig, targetPosition, distance) => {
        if (!featureConfig || !targetPosition || !Number.isFinite(distance)) {
            return null
        }

        const direction =
            getHudFocusCameraDirection(featureConfig) ??
            new THREE.Vector3()
                .subVectors(
                    cameraRef.current?.position ?? new THREE.Vector3(),
                    targetPosition
                )
                .normalize()

        if (!Number.isFinite(direction.x) || direction.lengthSq() < 0.000001) {
            direction.set(0, 0, 1)
        }

        return {
            featureId: featureConfig.id,
            position: targetPosition
                .clone()
                .add(direction.multiplyScalar(distance)),
            target: targetPosition.clone(),
            lookDistance: Math.max(distance, 1),
            allowLookAround: featureConfig.allowLookAround ?? true,
            allowZoom: featureConfig.allowZoom ?? false,
            allowPan: featureConfig.allowPan ?? false,
        }
    }

    const returnToOrbit = (name) => {
        const targetName = getLandingTargetName(name || selectedMoonRef.current)
        if (!targetName) return

        freeNavigationRef.current = false
        setFreeFlightMode(false)
        setSelectedTarget(targetName)
        focusedMoonRef.current = null
        setFocusedMoon(null)
        setHudFeatureFocus(null)
        hudFeatureFocusRef.current = null
        setActiveFeatureHud(null)
        hudCameraLockRef.current = null
        setIsInsideJupiter(false)
        isInsideRef.current = false
        currentViewRef.current = { mode: "locked", target: targetName }

        const orbitDistance = getOrbitDistance(targetName)
        targetDistance.current = orbitDistance
        currentDistance.current = Math.max(
            currentDistance.current,
            orbitDistance
        )

        setCfg((prev) => ({ ...prev, hideUI: false }))
    }

    const returnFromCloseUpToHud = ({ resetAccordion = false } = {}) => {
        const targetName = selectedMoonRef.current || focusedMoonRef.current
        if (!targetName) return false

        const landingTarget = getLandingTargetName(targetName)
        freeNavigationRef.current = false
        setFreeFlightMode(false)
        setSelectedTarget(landingTarget)
        focusedMoonRef.current = targetName
        setFocusedMoon(targetName)
        setHudFeatureFocus(null)
        hudFeatureFocusRef.current = null
        setActiveFeatureHud(null)
        hudCameraLockRef.current = null
        if (resetAccordion) {
            resetHudAccordion()
        }
        setIsInsideJupiter(false)
        isInsideRef.current = false
        currentViewRef.current = { mode: "focus", target: targetName }

        const landingDistance = getLandingDistance(targetName)
        targetDistance.current = landingDistance
        currentDistance.current = Math.max(
            currentDistance.current,
            landingDistance
        )

        setCfg((prev) => ({ ...prev, hideUI: false }))
        return true
    }

    const closeUp = (feature) => {
        const featureConfig = getHudFocusTargetConfig(feature)
        if (!featureConfig) return

        hasUserInteractedRef.current = false
        hudCameraLockRef.current = null

        if (featureConfig?.bodyName) {
            if (selectedMoonRef.current !== featureConfig.bodyName) {
                focusOn(featureConfig.bodyName)
            }

            setHudFeatureFocus(featureConfig)
            hudFeatureFocusRef.current = featureConfig
            setActiveFeatureHud(featureConfig.hud || null)

            const bodyUnit = getSceneUnit(featureConfig.bodyName)
            const bodyRadius = getObjectWorldRadius(bodyUnit)
            const viewportFraction =
                getHudFocusViewportHeight(featureConfig) ??
                props.landingViewportHeight ??
                props.planetViewportHeight ??
                0.75
            const featureDistance = getDistanceForViewportHeight({
                camera: cameraRef.current,
                radius: bodyRadius,
                viewportFraction,
            })

            targetDistance.current =
                featureDistance ?? getLandingDistance(featureConfig.bodyName)
            const featureTarget =
                getHudFocusWorldPosition(featureConfig) ??
                bodyUnit?.body?.getWorldPosition(new THREE.Vector3())
            hudCameraLockRef.current =
                featureConfig.lockPosition === false
                    ? null
                    : createHudCameraLock(
                        featureConfig,
                        featureTarget,
                        targetDistance.current
                    )
            currentViewRef.current = {
                mode: "closeUp",
                target: featureConfig.bodyName,
                feature: featureConfig.id,
            }
            return
        }

        setHudFeatureFocus(featureConfig)
        hudFeatureFocusRef.current = featureConfig
        setActiveFeatureHud(featureConfig.hud || null)

        if (selectedMoonRef.current) {
            targetDistance.current = getLandingDistance(selectedMoonRef.current)
        }
    }

    const handleHudFeatureFocus = (feature) => {
        if (!feature) {
            if (hudFeatureFocusRef.current) {
                returnFromCloseUpToHud()
            }
            return
        }

        closeUp(feature)
    }

    const handleHudZoom = (direction) => {
        const activeHudFeature = getHudFocusTargetConfig(
            hudFeatureFocusRef.current
        )

        if (activeHudFeature?.bodyName && activeHudFeature.allowZoom !== true) {
            return
        }

        const p = propsRef.current
        const zoomFactor = direction > 0 ? 0.82 : 1.18

        hasUserInteractedRef.current = true
        targetDistance.current = THREE.MathUtils.clamp(
            targetDistance.current * zoomFactor,
            p.minZoom ?? 0.05,
            p.maxZoomLimit ?? 1000
        )
    }

    const startFeatureScene = (sceneConfig) => {
        if (!sceneConfig) return

        if (runtimeSceneConfigRef.current) {
            runtimeSceneConfigRef.current = sceneConfig
            setRuntimeSceneSettings(sceneConfig)
            return
        }

        pushCurrentViewToHistory()
        saveSceneUnitState()

        const sceneId = sceneConfig.id || "featureScene"
        runtimeSceneConfigRef.current = sceneConfig
        setRuntimeSceneSettings(sceneConfig)
        activeSceneRef.current = sceneId
        sceneStartTimeRef.current = performance.now()
        hasUserInteractedRef.current = false

        setSelectedTarget(null)
        setActiveScene(sceneId)
        setHudFeatureFocus(null)
        hudFeatureFocusRef.current = null
        hudCameraLockRef.current = null
        setIsInsideJupiter(false)
        isInsideRef.current = false
        freeNavigationRef.current = false
        setFreeFlightMode(false)
        currentViewRef.current = {
            mode: "featureScene",
            target: sceneId,
        }

        if (sceneConfig.camera) {
            targetDistance.current = sceneConfig.camera.distance
            currentDistance.current = sceneConfig.camera.distance
            cameraTarget.current.set(
                sceneConfig.camera.target[0],
                sceneConfig.camera.target[1],
                sceneConfig.camera.target[2]
            )
        }

        setCfg((prev) => ({ ...prev, hideUI: false }))
    }

    const updateFeatureScene = (sceneConfig) => {
        if (!sceneConfig) return

        runtimeSceneConfigRef.current = sceneConfig
        setRuntimeSceneSettings(sceneConfig)
        if (!activeSceneRef.current) {
            startFeatureScene(sceneConfig)
        }
    }

    const stopFeatureScene = (returnTarget = "Jupiter") => {
        viewHistoryRef.current.pop()
        runtimeSceneConfigRef.current = null
        setRuntimeSceneSettings(null)
        restoreSceneUnitState()
        activeSceneRef.current = null
        setActiveScene(null)
        sceneOverrideRef.current = {}
        restoreSceneUnitVisibility()

        const targetName = returnTarget || "Jupiter"
        freeNavigationRef.current = false
        setFreeFlightMode(false)
        setSelectedTarget(targetName)
        focusedMoonRef.current = targetName
        setFocusedMoon(targetName)
        currentViewRef.current = { mode: "focus", target: targetName }
        targetDistance.current = getLandingDistance(targetName)
        setCfg((prev) => ({ ...prev, hideUI: false }))
    }

    const decorateOverlay = (overlay) => {
        if (!React.isValidElement(overlay)) return overlay

        return React.cloneElement(overlay, {
            onInteraction: handleHudFeatureFocus,
            onFeatureFocus: handleHudFeatureFocus,
            onCloseUp: closeUp,
            onZoomDelta: handleHudZoom,
            accordionResetKey: hudAccordionResetKey,
            onStartFeatureScene: startFeatureScene,
            onUpdateFeatureScene: updateFeatureScene,
            onStopFeatureScene: stopFeatureScene,
        })
    }

    const ActiveOverlay = decorateOverlay(getActiveOverlay())
    const InteriorOverlay = isInsideJupiter
        ? props.overlayInteriorJupiter || <JupiterInteriorHUD />
        : null

    const toggleHideUI = () => {
        if (freeNavigationRef.current || freeFlightMode) {
            setCfg((prev) => {
                const next = !prev.hideUI
                setAutoHideUI(next)
                setMenuForceHidden(false)
                setMenuHoverZone(false)
                setShowSettings(false)
                return { ...prev, hideUI: next }
            })
            return
        }

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
        hudCameraLockRef.current = null
        setIsInsideJupiter(false)
        isInsideRef.current = false
    }

    const returnToActiveSceneOverview = () => {
        const sceneName = activeSceneRef.current
        const scenePreset =
            runtimeSceneConfigRef.current ||
            (sceneName ? getSceneConfig(propsRef.current, sceneName) : null)

        if (!scenePreset) return false

        setSelectedTarget(null)
        focusedMoonRef.current = null
        setFocusedMoon(null)
        setHudFeatureFocus(null)
        hudFeatureFocusRef.current = null
        hudCameraLockRef.current = null
        setIsInsideJupiter(false)
        isInsideRef.current = false
        freeNavigationRef.current = false
        setFreeFlightMode(false)
        hasUserInteractedRef.current = false
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

        setCfg((prev) => ({ ...prev, hideUI: false }))
        return true
    }

    const startScene = (sceneName) => {
        const scenePreset = getSceneConfig(propsRef.current, sceneName)
        if (!scenePreset) return

        pushCurrentViewToHistory()

        saveSceneUnitState()

        runtimeSceneConfigRef.current = null
        setRuntimeSceneSettings(null)
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
        const previousView = viewHistoryRef.current.pop()

        runtimeSceneConfigRef.current = null
        setRuntimeSceneSettings(null)
        restoreSceneUnitState()
        activeSceneRef.current = null
        setActiveScene(null)
        sceneOverrideRef.current = {}

        restoreSceneUnitVisibility()

        if (previousView) {
            restoreView(previousView)
            return
        }

        setSelectedTarget(null)
        focusedMoonRef.current = null
        setFocusedMoon(null)
        setHudFeatureFocus(null)
        hudFeatureFocusRef.current = null
        hudCameraLockRef.current = null
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
        setShowFreeFlightHint(true)
        window.setTimeout(() => {
            setShowFreeFlightHint(false)
        }, propsRef.current.freeFlightHintDurationMs ?? 3000)
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

            const orbitDistance = getOrbitDistance(view.target)
            targetDistance.current = orbitDistance
            currentDistance.current = orbitDistance

            setHudFeatureFocus(null)
            hudFeatureFocusRef.current = null
            hudCameraLockRef.current = null
            setFocusedMoon(null)
            setIsInsideJupiter(false)
            isInsideRef.current = false
            setCfg((prev) => ({ ...prev, hideUI: false }))
        }

        if (view.mode === "focus" && view.target) {
            freeNavigationRef.current = false
            setFreeFlightMode(false)
            setSelectedTarget(getLandingTargetName(view.target))
            focusedMoonRef.current = view.target
            currentViewRef.current = { mode: "focus", target: view.target }

            targetDistance.current = getLandingDistance(view.target)

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
        if (hudFeatureFocusRef.current && selectedMoonRef.current) {
            if (returnFromCloseUpToHud({ resetAccordion: true })) return
            return
        }

        if (focusedMoonRef.current) {
            if (activeSceneRef.current && returnToActiveSceneOverview()) {
                return
            }

            returnToOrbit(focusedMoonRef.current)
            return
        }

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

        targetDistance.current = getOrbitDistance(closestName)

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
        labelsLastUpdateRef.current = 0
        labelsSignatureRef.current = ""
        sceneOverrideCacheRef.current = {
            activeSceneName: null,
            activeSceneConfig: null,
            overrides: {},
            activeSceneUnits: new Set(),
            activeSceneChildParents: new Set(),
            isCustomSceneActive: false,
        }
        perfFrameRef.current = {
            lastUpdate: 0,
            lastFrameTime: 0,
            frames: 0,
            frameTotal: 0,
            fps: 0,
            frameMs: 0,
        }

        solarSystemGroup.current.clear()
        jupiterOrbitPivot.current.clear()
        jupiterGroup.current.clear()
        ringsGroup.current.clear()
        jupiterRingDebrisRef.current = null
        saturnRingsGroup.current.clear()
        saturnRingDebrisRef.current = null
        uranusRingsGroup.current.clear()
        uranusRingDebrisRef.current = null
        neptuneRingsGroup.current.clear()
        neptuneRingDebrisRef.current = null
        ringShadowRefs.current = {}

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
        camera.layers.enable(ASTEROID_LAYER)
        cameraRef.current = camera

        const focusCamera = camera.clone()
        focusCamera.layers.set(FOCUSED_LAYER)

        const controls = createControls({
            camera,
            domElement: renderer.domElement,
            config: props,
        })
        const handleControlsStart = () => {
            hasUserInteractedRef.current = true
        }
        controls.addEventListener("start", handleControlsStart)
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
            bumpMapUrl,
            bumpScale,
            emissiveMapUrl,
            emissiveIntensity,
            roughnessMapUrl,
            metalnessMapUrl,
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
                bumpMapUrl,
                bumpScale,
                emissiveMapUrl,
                emissiveIntensity,
                roughnessMapUrl,
                metalnessMapUrl,
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
            occlusionRadius,
            occlusionSoftness,
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
                occlusionRadius,
                occlusionSoftness,
                loadTexture,
                config: props,
            })

        const makeRingDebrisLayer = (options) =>
            createRingDebrisLayer(options)

        const makeRingShadowShell = (options) =>
            createRingShadowShell(options)

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

        const makeRadialGlowTexture = ({ stops, size = 512 }) => {
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

            stops.forEach(([offset, color]) => {
                gradient.addColorStop(offset, color)
            })

            ctx.clearRect(0, 0, size, size)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, size, size)

            const texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace
            texture.needsUpdate = true
            return texture
        }

        const createSunGlowSprite = ({
            name,
            texture,
            opacity,
            scale,
            depthTest = true,
        }) => {
            const sprite = new THREE.Sprite(
                new THREE.SpriteMaterial({
                    map: texture,
                    color: 0xffffff,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    depthTest,
                    opacity,
                })
            )
            sprite.material.toneMapped = false
            sprite.name = name
            sprite.scale.setScalar((props.sunSize || 3) * scale)
            sunMesh.add(sprite)
            return sprite
        }

        const outerGlow = createSunGlowSprite({
            name: "Sun Outer Glow",
            texture: makeRadialGlowTexture({
                stops: [
                    [0.0, "rgba(255,255,255,0.85)"],
                    [0.18, "rgba(255,224,92,0.52)"],
                    [0.42, "rgba(255,92,18,0.26)"],
                    [0.68, "rgba(198,30,7,0.12)"],
                    [1.0, "rgba(115,8,4,0)"],
                ],
            }),
            opacity: props.sunOuterGlowOpacity ?? 0.16,
            scale: props.sunOuterGlowScale ?? 5,
        })

        const fireAura = createSunGlowSprite({
            name: "Sun Fire Aura",
            texture: makeRadialGlowTexture({
                stops: [
                    [0.0, "rgba(255,255,255,1)"],
                    [0.22, "rgba(255,224,96,0.9)"],
                    [0.42, "rgba(255,96,14,0.78)"],
                    [0.58, "rgba(255,54,6,0.48)"],
                    [0.76, "rgba(255,34,4,0.16)"],
                    [1.0, "rgba(255,28,4,0)"],
                ],
            }),
            opacity: props.sunFireAuraOpacity ?? 0.38,
            scale: props.sunFireAuraScale ?? 2.15,
        })

        const fireAuraBaseScale =
            (props.sunSize || 3) * (props.sunFireAuraScale ?? 2.15)

        const {
            sunLight,
            directionalLight,
            focusedSunLight,
            focusedDirectionalLight,
            focusLight,
            asteroidSunLight,
            ambient,
            sunFlareLight,
            sunEclipseFlareLight,
        } = createSunLighting({
            scene,
            solarSystemGroup: solarSystemGroup.current,
            sunMesh,
            config: props,
        })

        sunPosLerp.current.set(props.sunX ?? -10, 0, props.sunZ ?? 5)

        const planets = getPlanetConfigs(props)

        planets.forEach((planet) => {
            const pivot = new THREE.Group()
            pivot.name = `${planet.name}_Orbit`
            pivot.rotation.x = THREE.MathUtils.degToRad(planet.tiltX || 0)
            pivot.rotation.z = THREE.MathUtils.degToRad(planet.tiltZ || 0)
            pivot.rotation.y = THREE.MathUtils.degToRad(planet.startAngle || 0)

            solarSystemGroup.current.add(pivot)

            let mesh
            let axialGroup = null
            let ringParent = null

            if (planet.name === "Earth") {
                const earthSystem = createEarth({
                    radius: planet.size,
                    position: [planet.dist, 0, 0],
                    loadTexture,
                    config: props,
                })
                pivot.add(earthSystem.root)
                mesh = earthSystem.surface

                moonsRef.current["Earth_Clouds"] = earthSystem.clouds
                moonsRef.current["Earth_Atmosphere"] = earthSystem.atmosphere
                mesh.userData.isEarthShader = true
            } else {
                mesh = makeSphere({
                    name: planet.name,
                    textureUrl: planet.texture,
                    radius: planet.size,
                    position: [planet.dist, 0, 0],
                    color: planet.color,
                    segments: 48,
                })
                mesh.castShadow = true

                if (planet.axisTiltX || planet.axisTiltZ) {
                    axialGroup = new THREE.Group()
                    axialGroup.name = `${planet.name}_Axis`
                    axialGroup.position.copy(mesh.position)
                    axialGroup.rotation.x = THREE.MathUtils.degToRad(
                        planet.axisTiltX || 0
                    )
                    axialGroup.rotation.z = THREE.MathUtils.degToRad(
                        planet.axisTiltZ || 0
                    )
                    mesh.position.set(0, 0, 0)
                    axialGroup.add(mesh)
                    pivot.add(axialGroup)
                    ringParent = axialGroup
                } else {
                    pivot.add(mesh)
                    ringParent = mesh
                }
            }

            if (planet.name === "Earth") {
                const moonPivot = new THREE.Group()

                // coloca o pivô da Lua exatamente na posição da Terra
                moonPivot.position.set(planet.dist, 0, 0)

                pivot.add(moonPivot)

                const earthRadius = planet.size
                const earthMoon = makeSphere({
                    name: "Moon",
                    textureUrl: props.earthMoonTexture,
                    radius: props.earthMoonSize ?? earthRadius * 0.2727,
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

                pivotsRef.current["Moon"].distance =
                    props.earthMoonDist ?? 1.35
                pivotsRef.current["Moon"].eccentricity =
                    props.earthMoonEccentricity ?? 0.055
                pivotsRef.current["Moon"].inclination =
                    THREE.MathUtils.degToRad(props.earthMoonInclination ?? 5.14)
                pivotsRef.current["Moon"].phase = props.earthMoonPhase ?? 0.4
                pivotsRef.current["Moon"].precessionSpeed =
                    props.earthMoonPrecessionSpeed ?? 0.00004

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
                    occlusionRadius:
                        props.saturnRingOcclusionRadius ?? 2 / 3.2,
                    occlusionSoftness:
                        props.saturnRingOcclusionSoftness ?? 0.035,
                })
                saturnRingDebrisRef.current = makeRingDebrisLayer({
                    name: "Saturn Ring Debris",
                    count: props.saturnRingDebrisCount ?? 2600,
                    width: props.saturnRingWidth ?? 3.2,
                    height: props.saturnRingHeight ?? 3.2,
                    innerRadius: props.saturnRingDebrisInnerRadius ?? 0.26,
                    outerRadius: props.saturnRingDebrisOuterRadius ?? 0.49,
                    sizeMin: props.saturnRingDebrisSizeMin ?? 0.003,
                    sizeMax: props.saturnRingDebrisSizeMax ?? 0.018,
                    verticalSpread:
                        props.saturnRingDebrisVerticalSpread ?? 0.018,
                    tilt: props.saturnRingDebrisTilt ?? 0.72,
                    seed: props.saturnRingDebrisSeed ?? 731,
                    opacity: props.saturnRingDebrisOpacity ?? 0.72,
                    colors: props.saturnRingDebrisColors,
                    bands: props.saturnRingDebrisBands,
                })
                saturnRingsGroup.current.add(saturnRingDebrisRef.current)
                ringShadowRefs.current.Saturn = makeRingShadowShell({
                    name: "Saturn Ring Shadow",
                    radius: planet.size * 1.006,
                    rotX: props.saturnRingRotX ?? 90,
                    rotY: props.saturnRingRotY ?? 0,
                    rotZ: props.saturnRingRotZ ?? 0,
                    opacity: props.saturnRingPlanetShadowOpacity ?? 0.2,
                    width: props.saturnRingPlanetShadowWidth ?? 0.055,
                    softness: props.saturnRingPlanetShadowSoftness ?? 0.13,
                    color: props.saturnRingPlanetShadowColor ?? 0x080604,
                    segments: props.saturnSegments ?? 96,
                    faceOnFade: props.saturnRingShadowFaceOnFade ?? 0.18,
                })
                ringParent.add(saturnRingsGroup.current)
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
                    occlusionRadius:
                        props.uranusRingOcclusionRadius ?? 2 / 3.45,
                    occlusionSoftness:
                        props.uranusRingOcclusionSoftness ?? 0.045,
                })
                uranusRingDebrisRef.current = makeRingDebrisLayer({
                    name: "Uranus Ring Debris",
                    count: props.uranusRingDebrisCount ?? 12000,
                    width: props.uranusRingWidth ?? 2.5,
                    height: props.uranusRingHeight ?? 2.5,
                    innerRadius: props.uranusRingDebrisInnerRadius ?? 0.28,
                    outerRadius: props.uranusRingDebrisOuterRadius ?? 0.49,
                    sizeMin: props.uranusRingDebrisSizeMin ?? 0.0008,
                    sizeMax: props.uranusRingDebrisSizeMax ?? 0.002,
                    verticalSpread:
                        props.uranusRingDebrisVerticalSpread ?? 0.01,
                    tilt: props.uranusRingDebrisTilt ?? 0.62,
                    seed: props.uranusRingDebrisSeed ?? 907,
                    opacity: props.uranusRingDebrisOpacity ?? 0.58,
                    colors: props.uranusRingDebrisColors,
                    bands: props.uranusRingDebrisBands,
                })
                uranusRingsGroup.current.add(uranusRingDebrisRef.current)
                ringShadowRefs.current.Uranus = makeRingShadowShell({
                    name: "Uranus Ring Shadow",
                    radius: planet.size * 1.006,
                    rotX: props.uranusRingRotX ?? 90,
                    rotY: props.uranusRingRotY ?? 0,
                    rotZ: props.uranusRingRotZ ?? 0,
                    opacity: props.uranusRingPlanetShadowOpacity ?? 0.16,
                    width: props.uranusRingPlanetShadowWidth ?? 0.045,
                    softness: props.uranusRingPlanetShadowSoftness ?? 0.12,
                    color: props.uranusRingPlanetShadowColor ?? 0x031014,
                    segments: props.uranusSegments ?? 96,
                    faceOnFade: props.uranusRingShadowFaceOnFade ?? 0.95,
                })
                ringParent.add(uranusRingsGroup.current)
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
                    occlusionRadius:
                        props.neptuneRingOcclusionRadius ?? 2 / 2.75,
                    occlusionSoftness:
                        props.neptuneRingOcclusionSoftness ?? 0.04,
                })
                neptuneRingDebrisRef.current = makeRingDebrisLayer({
                    name: "Neptune Ring Debris",
                    count: props.neptuneRingDebrisCount ?? 14000,
                    width: props.neptuneRingWidth ?? 2.4,
                    height: props.neptuneRingHeight ?? 2.4,
                    innerRadius: props.neptuneRingDebrisInnerRadius ?? 0.27,
                    outerRadius: props.neptuneRingDebrisOuterRadius ?? 0.5,
                    sizeMin: props.neptuneRingDebrisSizeMin ?? 0.0008,
                    sizeMax: props.neptuneRingDebrisSizeMax ?? 0.0022,
                    verticalSpread:
                        props.neptuneRingDebrisVerticalSpread ?? 0.012,
                    tilt: props.neptuneRingDebrisTilt ?? 0.7,
                    seed: props.neptuneRingDebrisSeed ?? 1201,
                    opacity: props.neptuneRingDebrisOpacity ?? 0.82,
                    colors: props.neptuneRingDebrisColors,
                    bands: props.neptuneRingDebrisBands,
                })
                neptuneRingsGroup.current.add(neptuneRingDebrisRef.current)
                ringShadowRefs.current.Neptune = makeRingShadowShell({
                    name: "Neptune Ring Shadow",
                    radius: planet.size * 1.006,
                    rotX: props.neptuneRingRotX ?? 90,
                    rotY: props.neptuneRingRotY ?? 0,
                    rotZ: props.neptuneRingRotZ ?? 0,
                    opacity: props.neptuneRingPlanetShadowOpacity ?? 0.18,
                    width: props.neptuneRingPlanetShadowWidth ?? 0.048,
                    softness: props.neptuneRingPlanetShadowSoftness ?? 0.13,
                    color: props.neptuneRingPlanetShadowColor ?? 0x020915,
                    segments: props.neptuneSegments ?? 96,
                    faceOnFade: props.neptuneRingShadowFaceOnFade ?? 0.35,
                })
                ringParent.add(neptuneRingsGroup.current)
            }

            moonsRef.current[planet.name] = mesh
            planetPivotsRef.current[planet.name] = {
                pivot,
                mesh,
                axialGroup,
                speed: planet.speed,
                rotationDirection: planet.rotationDirection ?? 1,
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

            const orbitDistance = getOrbitDistance("Jupiter")
            targetDistance.current = orbitDistance
            currentDistance.current = orbitDistance

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
            occlusionRadius: props.ringOcclusionRadius ?? 2 / 4.5,
            occlusionSoftness: props.ringOcclusionSoftness ?? 0.04,
        })

        jupiterRingDebrisRef.current = makeRingDebrisLayer({
            name: "Jupiter Ring Debris",
            count: props.jupiterRingDebrisCount ?? 16000,
            width: props.ringWidth ?? 4.5,
            height: props.ringHeight ?? 4.5,
            innerRadius: props.jupiterRingDebrisInnerRadius ?? 0.18,
            outerRadius: props.jupiterRingDebrisOuterRadius ?? 0.48,
            sizeMin: props.jupiterRingDebrisSizeMin ?? 0.0007,
            sizeMax: props.jupiterRingDebrisSizeMax ?? 0.002,
            verticalSpread: props.jupiterRingDebrisVerticalSpread ?? 0.014,
            tilt: props.jupiterRingDebrisTilt ?? 0.68,
            seed: props.jupiterRingDebrisSeed ?? 601,
            opacity: props.jupiterRingDebrisOpacity ?? 0.86,
            colors: props.jupiterRingDebrisColors,
            bands: props.jupiterRingDebrisBands,
        })
        jupiterRing.add(jupiterRingDebrisRef.current)
        ringsGroup.current.add(jupiterRing)

        ringShadowRefs.current.Jupiter = makeRingShadowShell({
            name: "Jupiter Ring Shadow",
            radius: jupiterRadius * 1.006,
            rotX: props.ringsRotX ?? 90,
            rotY: props.ringsRotY ?? 0,
            rotZ: props.ringsRotZ ?? 0,
            opacity: props.jupiterRingPlanetShadowOpacity ?? 0.17,
            width: props.jupiterRingPlanetShadowWidth ?? 0.045,
            softness: props.jupiterRingPlanetShadowSoftness ?? 0.12,
            color: props.jupiterRingPlanetShadowColor ?? 0x050403,
            segments: props.jupiterSegments ?? 96,
            faceOnFade: props.jupiterRingShadowFaceOnFade ?? 0.25,
        })

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

        const instanced = createAsteroidBelt(props, loadingManager)

        solarSystemGroup.current.add(instanced)
        registerSceneUnit({
            name: "AsteroidBelt",
            type: "environment",
            root: instanced,
            body: instanced,
            focusTarget: instanced,
            hideWithScene: true,
        })

        const { composer, bloomPass, grainPass, focusRenderPass } = createPostProcessing({
            renderer,
            scene,
            camera,
            focusCamera,
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

            if (!(freeNavigationRef.current && cfgRef.current.hideUI)) {
                setAutoHideUI(false)

                if (inactivityTimerRef.current) {
                    clearTimeout(inactivityTimerRef.current)
                }

                inactivityTimerRef.current = setTimeout(() => {
                    isUserActiveRef.current = false

                    setAutoHideUI(true)
                }, 3000) // 3s
            }
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

        const handleKey = (event, pressed) => {
            if (!(event.code in freeFlightKeysRef.current)) return

            if (freeNavigationRef.current) {
                event.preventDefault()
            }

            freeFlightKeysRef.current[event.code] = pressed
        }

        const handleKeyDown = (event) => handleKey(event, true)
        const handleKeyUp = (event) => handleKey(event, false)

        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)

        let requestID = 0

        const animate = (time) => {
            const p = propsRef.current
            const c = cfgRef.current
            const ctrl = controlsRef.current
            const cam = cameraRef.current
            const activeSceneName = activeSceneRef.current
            const activeSceneConfig =
                runtimeSceneConfigRef.current ||
                (activeSceneName ? getSceneConfig(p, activeSceneName) : null)
            const isRealScaleScene = activeSceneName === "realScaleLine"
            const previousFrameTime = perfFrameRef.current.lastFrameTime || time
            const frameDelta = Math.max(0, time - previousFrameTime)
            perfFrameRef.current.lastFrameTime = time
            perfFrameRef.current.frames += 1
            perfFrameRef.current.frameTotal += frameDelta

            if (freeNavigationRef.current && cam && ctrl) {
                const keys = freeFlightKeysRef.current
                const forwardInput = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0)
                const strafeInput = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0)

                if (forwardInput || strafeInput) {
                    const forward = new THREE.Vector3()
                    cam.getWorldDirection(forward)
                    forward.y = 0

                    if (forward.lengthSq() < 0.000001) {
                        forward.set(0, 0, -1)
                    } else {
                        forward.normalize()
                    }

                    const right = new THREE.Vector3()
                        .crossVectors(forward, new THREE.Vector3(0, 1, 0))
                        .normalize()
                    const speed =
                        (p.freeFlightKeyboardSpeed ?? 0.08) *
                        ((keys.ShiftLeft || keys.ShiftRight)
                            ? (p.freeFlightKeyboardBoost ?? 2)
                            : 1) *
                        THREE.MathUtils.clamp(frameDelta / 16.67, 0.25, 3)
                    const movement = forward
                        .multiplyScalar(forwardInput * speed)
                        .add(right.multiplyScalar(strafeInput * speed))

                    cam.position.add(movement)
                    ctrl.target.add(movement)
                    cameraTarget.current.add(movement)
                    hasUserInteractedRef.current = true
                }
            }

            if (sunMesh.material?.color) {
                if (isRealScaleScene) {
                    sunMesh.material.color.set(p.realScaleSunTint ?? 0xff5a1f)
                } else {
                    sunMesh.material.color.setRGB(
                        p.sunColorR ?? 1.2,
                        p.sunColorG ?? 1.1,
                        p.sunColorB ?? 0.9
                    )
                }
            }
            const sceneIntroActive =
                !!activeSceneName &&
                time - sceneStartTimeRef.current < (p.sceneIntroLockMs ?? 2500)
            const sunWorldPos = new THREE.Vector3()
            sunMesh.getWorldPosition(sunWorldPos)
            sunFlareLight.position.copy(sunWorldPos)
            // Earth Shader Uniforms
            const earthPivot = planetPivotsRef.current['Earth']
            if (earthPivot?.mesh?.userData?.isEarthShader) {
                const earthMesh = earthPivot.mesh
                const earthWorldPos = new THREE.Vector3()
                earthMesh.getWorldPosition(earthWorldPos)
                const earthToSun = new THREE.Vector3().subVectors(sunWorldPos, earthWorldPos).normalize()
                earthToSun.applyMatrix4(cam.matrixWorldInverse).normalize()
                earthMesh.material.uniforms.sunDirection.value.copy(earthToSun);
                const cloudMesh = moonsRef.current['Earth_Clouds'];
                if (cloudMesh?.material?.uniforms?.sunDirection) {
                    cloudMesh.material.uniforms.sunDirection.value.copy(earthToSun);
                }
                const atmosMesh = moonsRef.current['Earth_Atmosphere'];
                if (atmosMesh?.material?.uniforms?.sunDirection) {
                    atmosMesh.material.uniforms.sunDirection.value.copy(earthToSun);
                }
            }
            getSceneUnit("AsteroidBelt")?.root?.userData?.asteroidMaterials?.forEach(
                (material) => {
                    material.uniforms.sunWorldPosition.value.copy(sunWorldPos)
                }
            )

            const sunDirection = new THREE.Vector3().subVectors(
                sunWorldPos,
                cam.position
            )
            const sunDistance = sunDirection.length()
            let sunGlowBlend = 1
            let sunNormalFlareBlend = 1
            let sunEclipseFlareBlend = 0
            const sunEclipseFlarePosition = sunWorldPos.clone()

            if (sunDistance > 0.001) {
                sunDirection.normalize()
                const sunAngularRadius = getAngularRadius({
                    radius: props.sunSize || 3,
                    distance: sunDistance,
                })

                const occluderUnits = Object.values(sceneUnitsRef.current)
                    .filter((unit) => unit?.body || unit?.root)
                    .filter((unit) => (unit.body || unit.root).name !== "Sun")
                const occluderObjects = occluderUnits.map(
                    (unit) => unit.body || unit.root
                )

                raycasterRef.current.set(cam.position, sunDirection)
                const intersections = raycasterRef.current.intersectObjects(
                    occluderObjects,
                    true
                )
                const sunCenterBlocked = intersections.some(
                    (hit) => hit.distance < sunDistance - 0.001
                )

                occluderUnits.forEach((unit) => {
                    const obj = unit.body || unit.root
                    const radius = getObjectWorldRadius(unit)
                    if (!obj || !radius) return

                    const objWorldPos = obj.getWorldPosition(
                        new THREE.Vector3()
                    )
                    const objDistance = cam.position.distanceTo(objWorldPos)
                    if (objDistance <= 0 || objDistance >= sunDistance) return

                    const objDirection = objWorldPos
                        .sub(cam.position)
                        .normalize()
                    const separation = objDirection.angleTo(sunDirection)
                    const objAngularRadius = getAngularRadius({
                        radius,
                        distance: objDistance,
                    })

                    const overlapStart = sunAngularRadius + objAngularRadius
                    if (separation >= overlapStart) return

                    const totalCover =
                        objAngularRadius >= sunAngularRadius &&
                        separation <= objAngularRadius - sunAngularRadius

                    if (totalCover) {
                        sunGlowBlend = 0
                        sunNormalFlareBlend = 0
                        return
                    }

                    const overlapDepth = Math.max(0, overlapStart - separation)
                    const partialCover = THREE.MathUtils.clamp(
                        overlapDepth / Math.max(sunAngularRadius * 2, 0.0001),
                        0,
                        1
                    )
                    const edgeBlend = Math.sin(partialCover * Math.PI)

                    sunGlowBlend = Math.min(sunGlowBlend, 1 - partialCover * 0.9)
                    sunNormalFlareBlend = Math.min(
                        sunNormalFlareBlend,
                        Math.max(0, 1 - partialCover * 1.8)
                    )

                    if (edgeBlend > sunEclipseFlareBlend) {
                        sunEclipseFlareBlend = edgeBlend
                        const limbDirection = sunDirection
                            .clone()
                            .sub(objDirection)
                            .projectOnPlane(sunDirection)

                        if (limbDirection.lengthSq() < 0.000001) {
                            limbDirection.setFromMatrixColumn(cam.matrixWorld, 0)
                        }

                        limbDirection.normalize()
                        sunEclipseFlarePosition.copy(
                            sunWorldPos.clone().add(
                                limbDirection.multiplyScalar(
                                    (props.sunSize || 3) * 0.82
                                )
                            )
                        )
                    }
                })

                if (sunCenterBlocked && sunEclipseFlareBlend <= 0.001) {
                    sunGlowBlend = 0
                    sunNormalFlareBlend = 0
                }
            }

            sunEclipseFlareLight.position.copy(sunEclipseFlarePosition)
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
            Object.values(ringShadowRefs.current).forEach((shadowShell) => {
                if (!shadowShell?.material?.uniforms?.sunWorldPosition) return
                shadowShell.visible = false
                shadowShell.material.uniforms.sunWorldPosition.value.copy(
                    sunWorldPos
                )
            })
            if (saturnRingsGroup.current?.material?.uniforms) {
                const uniforms = saturnRingsGroup.current.material.uniforms
                uniforms.opacity.value = isRealScaleScene
                    ? (p.realScaleSaturnRingOpacity ?? 0.82)
                    : (p.saturnRingOpacity ?? 0.55)
                uniforms.lightBoost.value = isRealScaleScene
                    ? (p.realScaleSaturnRingLightBoost ?? 1.55)
                    : (p.saturnRingLightBoost ?? 0.5)
                uniforms.shadowStrength.value = isRealScaleScene
                    ? (p.realScaleSaturnRingShadowStrength ?? 0.25)
                    : (p.saturnRingShadowStrength ?? 0.75)
            }

            let focusModeActive = false
            let hudFeatureMotionActive = false
            let landingExperienceActive = false

            if (ctrl && cam && container) {
                const hoverSceneUnits =
                    activeSceneConfig?.interactionMode === "galilean"
                        ? Object.fromEntries(
                            Object.entries(sceneUnitsRef.current).filter(
                                ([name]) =>
                                    [
                                        "Jupiter",
                                        "Callisto",
                                        "Europa",
                                        "Ganymede",
                                        "IO",
                                    ].includes(name)
                            )
                        )
                        : sceneUnitsRef.current
                setHoveredObjectName(
                    resolveHoveredSceneUnit({
                        raycaster: raycasterRef.current,
                        mouseNdc: mouseNdcRef.current,
                        camera: cam,
                        sceneUnits: hoverSceneUnits,
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
                const getRingPlanetDetailVisible = (name) => {
                    if (p.ringDetailMode === "always") return true
                    if (p.ringDetailMode === "focusOnly") {
                        return selectedName === name || focusedMoonRef.current === name
                    }
                    if (activeSceneName) return true

                    const unit = getSceneUnit(name)
                    const ringSystemFocused =
                        unit?.children?.includes(selectedName) ||
                        unit?.children?.includes(focusedMoonRef.current)

                    if (
                        selectedName === name ||
                        focusedMoonRef.current === name ||
                        ringSystemFocused
                    ) {
                        return true
                    }

                    const target = getSceneUnitTarget(name)
                    const radius = getObjectWorldRadius(unit)
                    if (!target || !radius) return false

                    const worldPos = target.getWorldPosition(new THREE.Vector3())
                    const viewportHeight = getProjectedViewportHeight({
                        camera: cam,
                        worldPos,
                        radius,
                    })

                    return (
                        viewportHeight >=
                        (p.ringDetailMinViewportHeight ?? 0.18)
                    )
                }
                const ringVisuals = [
                    ["Jupiter", jupiterRingDebrisRef.current],
                    ["Saturn", saturnRingDebrisRef.current],
                    ["Uranus", uranusRingDebrisRef.current],
                    ["Neptune", neptuneRingDebrisRef.current],
                ]

                ringVisuals.forEach(([name, debris]) => {
                    const visible = getRingPlanetDetailVisible(name)
                    if (debris) {
                        debris.visible = visible
                    }
                    if (ringShadowRefs.current[name]) {
                        ringShadowRefs.current[name].visible = false
                    }
                })
                const selectedUnit = selectedName
                    ? getSceneUnit(selectedName)
                    : null
                const selectedObj = selectedName
                    ? getSceneUnitTarget(selectedName)
                    : null
                const selectedRadius = getObjectWorldRadius(selectedUnit)
                const selectedWorldPos = selectedObj
                    ? selectedObj.getWorldPosition(new THREE.Vector3())
                    : null
                const selectedCameraDistance = selectedWorldPos
                    ? cam.position.distanceTo(selectedWorldPos)
                    : 0
                const selectedViewportHeight =
                    selectedWorldPos && selectedRadius
                        ? getProjectedViewportHeight({
                            camera: cam,
                            worldPos: selectedWorldPos,
                            radius: selectedRadius,
                        })
                        : 0
                const hudHideViewportHeight =
                    p.hudHideViewportHeight ?? p.planetViewportHeight ?? 0.7
                const hudShowViewportHeight =
                    p.hudShowViewportHeight ?? hudHideViewportHeight
                const hudViewportEpsilon = p.hudHideViewportEpsilon ?? 0.01
                const focusDistanceTolerance =
                    p.focusSettleDistanceTolerance ?? 0.12
                const isCameraSettledOnFocus =
                    selectedCameraDistance > 0 &&
                    selectedCameraDistance <=
                    currentDistance.current * (1 + focusDistanceTolerance)

                const activeHudTarget = focusedMoonRef.current
                const activeHudOrbitTarget = activeHudTarget
                    ? getLandingTargetName(activeHudTarget)
                    : null
                const activeHudFocusConfig = getHudFocusTargetConfig(
                    hudFeatureFocusRef.current
                )
                landingExperienceActive =
                    !!activeHudTarget &&
                    selectedName === activeHudOrbitTarget &&
                    selectedViewportHeight > 0 &&
                    selectedViewportHeight >=
                    hudShowViewportHeight - hudViewportEpsilon

                if (activeHudTarget && selectedName === activeHudOrbitTarget) {
                    const shouldHide =
                        isCameraSettledOnFocus &&
                        selectedViewportHeight > 0 &&
                        selectedViewportHeight <
                        hudHideViewportHeight - hudViewportEpsilon

                    if (shouldHide) {
                        setHudFeatureFocus(null)
                        hudFeatureFocusRef.current = null
                        hudCameraLockRef.current = null
                        setFocusedMoon(null)
                        focusedMoonRef.current = null
                    }
                }

                if (
                    activeSceneConfig?.interactionMode === "galilean" &&
                    focusedMoonRef.current &&
                    selectedName &&
                    isCameraSettledOnFocus &&
                    selectedViewportHeight > 0 &&
                    selectedViewportHeight <
                    (activeSceneConfig.returnViewportHeight ??
                        p.galileanReturnViewportHeight ??
                        0.6)
                ) {
                    returnToActiveSceneOverview()
                }

                if (
                    !activeHudTarget &&
                    selectedName &&
                    !cfgRef.current.hideUI &&
                    isCameraSettledOnFocus &&
                    selectedViewportHeight > 0 &&
                    selectedViewportHeight >=
                    hudShowViewportHeight - hudViewportEpsilon
                ) {
                    setFocusedMoon(selectedName)
                    focusedMoonRef.current = selectedName
                    currentViewRef.current = {
                        mode: "focus",
                        target: selectedName,
                    }
                }

                focusModeActive =
                    !!focusedMoonRef.current &&
                    getLandingTargetName(focusedMoonRef.current) ===
                    selectedName &&
                    isCameraSettledOnFocus &&
                    selectedViewportHeight > 0 &&
                    selectedViewportHeight >=
                    hudShowViewportHeight - hudViewportEpsilon

                hudFeatureMotionActive =
                    landingExperienceActive &&
                    activeHudFocusConfig?.bodyName === selectedName

                ctrl.minDistance = p.minZoom || 0.05
                ctrl.maxDistance = p.maxZoomLimit || 1000

                if (
                    activeSceneName &&
                    activeSceneConfig?.camera &&
                    !selectedMoonRef.current &&
                    (!hasUserInteractedRef.current || sceneIntroActive)
                ) {
                    ctrl.enableZoom = true
                    ctrl.enablePan = true
                    ctrl.enableRotate = !isRealScaleScene

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
                    ctrl.enableRotate = !isRealScaleScene
                    ctrl.update()
                } else if (freeNavigationRef.current) {
                    ctrl.enableZoom = true
                    ctrl.enablePan = true
                    ctrl.enableRotate = true
                    ctrl.update()
                } else {
                    ctrl.enableZoom = true
                    ctrl.enablePan = true
                    ctrl.enableRotate = true

                    const moonName = selectedMoonRef.current
                    const targetSunPos = new THREE.Vector3()
                    let activeHudCameraLock = null

                    const targetObj = getSceneUnitTarget(moonName)

                    if (moonName && targetObj) {
                        const worldPos = new THREE.Vector3()
                        targetObj.getWorldPosition(worldPos)
                        const hudFocusConfig = activeHudFocusConfig
                        const hudFocusWorldPos =
                            hudFeatureMotionActive &&
                                hudFocusConfig?.bodyName === moonName
                                ? getHudFocusWorldPosition(hudFocusConfig)
                                : null
                        const focusWorldPos = worldPos.clone()

                        if (hudFocusWorldPos) {
                            focusWorldPos.copy(hudFocusWorldPos)
                        }

                        if (
                            hudFocusWorldPos &&
                            hudFocusConfig &&
                            hudFocusConfig.lockPosition !== false
                        ) {
                            if (
                                !hudCameraLockRef.current ||
                                hudCameraLockRef.current.featureId !==
                                hudFocusConfig.id
                            ) {
                                hudCameraLockRef.current = createHudCameraLock(
                                    hudFocusConfig,
                                    hudFocusWorldPos,
                                    targetDistance.current
                                )
                            }

                            activeHudCameraLock = hudCameraLockRef.current
                        }

                        if (activeHudCameraLock) {
                            focusWorldPos.copy(activeHudCameraLock.target)
                        }

                        cameraTarget.current.copy(focusWorldPos)

                        const direction =
                            activeHudCameraLock
                                ? new THREE.Vector3()
                                    .subVectors(
                                        activeHudCameraLock.position,
                                        activeHudCameraLock.target
                                    )
                                    .normalize()
                                : hudFocusWorldPos && hudFocusConfig
                                    ? (getHudFocusCameraDirection(hudFocusConfig) ??
                                        new THREE.Vector3()
                                            .subVectors(cam.position, ctrl.target)
                                            .normalize())
                                    : new THREE.Vector3()
                                        .subVectors(cam.position, ctrl.target)
                                        .normalize()

                        if (!Number.isFinite(direction.x)) {
                            direction.set(0, 0, 1)
                        }

                        const desiredCamPos =
                            activeHudCameraLock?.position ??
                            new THREE.Vector3()
                                .copy(focusWorldPos)
                                .add(
                                    direction.multiplyScalar(
                                        currentDistance.current
                                    )
                                )

                        cam.position.lerp(desiredCamPos, p.travelSpeed ?? 0.08)
                        if (
                            activeHudCameraLock &&
                            cam.position.distanceTo(desiredCamPos) <
                            (p.cameraLockSnapDistance ?? 0.02)
                        ) {
                            cam.position.copy(desiredCamPos)
                        }
                        const focalLightDirection = new THREE.Vector3()
                            .subVectors(cam.position, focusWorldPos)
                            .normalize()

                        if (!Number.isFinite(focalLightDirection.x)) {
                            focalLightDirection.set(0, 0, 1)
                        }

                        if (landingExperienceActive) {
                            targetSunPos
                                .copy(focalLightDirection)
                                .multiplyScalar(p.focusLightDistance ?? 20)
                                .add(focusWorldPos)
                        } else {
                            targetSunPos.copy(sunWorldPos)
                        }
                    } else {
                        cameraTarget.current.set(
                            p.targetStartX ?? p.jupiterOrbitDist ?? 45,
                            p.targetStartY ?? 0,
                            p.targetStartZ ?? 0
                        )

                        targetSunPos.copy(sunWorldPos)
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
                    directionalLight.position.copy(sunWorldPos)
                    directionalLight.target.position.copy(cameraTarget.current)
                    focusedDirectionalLight.position.copy(sunWorldPos)
                    focusedDirectionalLight.target.position.copy(cameraTarget.current)
                    focusLight.position.copy(sunPosLerp.current)
                    focusLight.target.position.copy(cameraTarget.current)
                    scene.add(directionalLight.target)
                    scene.add(focusedDirectionalLight.target)
                    scene.add(focusLight.target)

                    if (activeHudCameraLock) {
                        ctrl.enableZoom = !!activeHudCameraLock.allowZoom
                        ctrl.enablePan = !!activeHudCameraLock.allowPan
                        ctrl.enableRotate =
                            activeHudCameraLock.allowLookAround !== false

                        const cameraLockSettled =
                            cam.position.distanceTo(
                                activeHudCameraLock.position
                            ) <= (p.cameraLockSettleDistance ?? 0.05)

                        if (hasUserInteractedRef.current && cameraLockSettled) {
                            ctrl.update()

                            const lookDirection = new THREE.Vector3()
                                .subVectors(ctrl.target, cam.position)
                                .normalize()

                            if (!Number.isFinite(lookDirection.x)) {
                                lookDirection
                                    .subVectors(
                                        activeHudCameraLock.target,
                                        activeHudCameraLock.position
                                    )
                                    .normalize()
                            }

                            cam.position.copy(activeHudCameraLock.position)
                            ctrl.target.copy(
                                activeHudCameraLock.position
                                    .clone()
                                    .add(
                                        lookDirection.multiplyScalar(
                                            activeHudCameraLock.lookDistance
                                        )
                                    )
                            )
                            cameraTarget.current.copy(ctrl.target)
                            cam.lookAt(ctrl.target)
                        } else {
                            ctrl.target.lerp(
                                cameraTarget.current,
                                p.travelSpeed ?? 0.08
                            )
                            ctrl.update()

                            if (cameraLockSettled) {
                                cam.position.copy(activeHudCameraLock.position)
                            }
                        }
                    } else {
                        ctrl.target.lerp(
                            cameraTarget.current,
                            p.travelSpeed ?? 0.08
                        )
                        ctrl.update()
                    }
                }

                const labelUpdateInterval = p.labelUpdateIntervalMs ?? 33
                if (
                    time - labelsLastUpdateRef.current >=
                    labelUpdateInterval
                ) {
                    labelsLastUpdateRef.current = time

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
                    const labelPosition = new THREE.Vector3()

                    allNav.forEach((name) => {
                        const obj = getSceneUnitTarget(name)
                        if (!obj) return

                        const unit = getSceneUnit(name)
                        if (
                            activeSceneConfig?.objects?.length &&
                            unit?.root?.visible === false
                        )
                            return

                        obj.getWorldPosition(labelPosition)
                        labelPosition.project(cam)

                        const offX = p[`offX_${name}`] || 0
                        const offY = p[`offY_${name}`] || 0

                        newLabels.push({
                            name,
                            x: (labelPosition.x * 0.5 + 0.5) * rect.width + offX,
                            y:
                                (-labelPosition.y * 0.5 + 0.5) *
                                    rect.height +
                                offY,
                            visible:
                                labelPosition.z < 1 &&
                                labelPosition.x > -1.5 &&
                                labelPosition.x < 1.5 &&
                                labelPosition.y > -1.5 &&
                                labelPosition.y < 1.5,
                        })
                    })

                    const nextSignature = getLabelsSignature(newLabels)
                    if (nextSignature !== labelsSignatureRef.current) {
                        labelsSignatureRef.current = nextSignature
                        setLabels(newLabels)
                    }
                }
            }

            if (c.autoRotate) {
                Object.entries(planetPivotsRef.current).forEach(
                    ([name, item]) => {
                        if (item.type !== "planet") return
                        if (name === "Jupiter") return
                        if (!item.mesh) return

                        item.mesh.rotation.y +=
                            (item.rotationDirection ?? 1) *
                            (c.rotateSpeed ?? 0.5) *
                            0.005
                    }
                )

                Object.entries(planetPivotsRef.current).forEach(
                    ([name, item]) => {
                        if (item.type !== "planet") return
                        if (isRealScaleScene) return

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

                const hudFocusConfig = getHudFocusTargetConfig(
                    hudFeatureFocusRef.current
                )
                const isHudFocusExperience =
                    hudFeatureMotionActive &&
                    hudFocusConfig?.bodyName === selectedMoonRef.current

                if (
                    isHudFocusExperience &&
                    hudFocusConfig.id === "jupiter-great-red-spot"
                ) {
                    const targetJupiterRotation =
                        getYRotationToFaceCamera({
                            baseDirection: getHudFocusLocalDirection(
                                hudFocusConfig
                            ),
                            object: jupiterGroup.current,
                            camera: cam,
                        }) ??
                        THREE.MathUtils.degToRad(
                            hudFocusConfig.rotationY ??
                            p[hudFocusConfig.rotationYKey] ??
                            -124
                        )

                    jupiterGroup.current.rotation.y = lerpAngle(
                        jupiterGroup.current.rotation.y,
                        targetJupiterRotation,
                        hudFocusConfig.turnSpeed ??
                        p[hudFocusConfig.turnSpeedKey] ??
                        0.08
                    )
                } else if (!focusedJupiterChild) {
                    jupiterGroup.current.rotation.y +=
                        (c.rotateSpeed ?? 0.5) * 0.005
                }

                if (!isRealScaleScene) {
                    updateMoonSystems({
                        moons: pivotsRef.current,
                        earth: moonsRef.current["Earth"],
                        selectedName: selectedMoonRef.current,
                        orbitSpeed: c.orbitSpeed,
                        rotateSpeed: c.rotateSpeed,
                        jupiterMoonOrbitSpeedMultiplier:
                            p.jupiterMoonOrbitSpeedMultiplier ?? 0.22,
                        jupiterMoonRotateSpeedMultiplier:
                            p.jupiterMoonRotateSpeedMultiplier ?? 0.28,
                    })

                    const asteroidBelt = getSceneUnit("AsteroidBelt")?.root
                    if (asteroidBelt) {
                        asteroidBelt.rotation.y +=
                            (c.orbitSpeed ?? 0.3) *
                            0.002 *
                            (p.asteroidOrbitSpeed ?? 0.55)
                    }
                }

                sunMesh.rotation.y += 0.002
                const clouds = moonsRef.current["Earth_Clouds"]
                if (clouds) {
                    clouds.rotation.y += p.earthCloudsSpeed ?? 0.0003
                }
            }

            let sceneCache = sceneOverrideCacheRef.current
            if (
                sceneCache.activeSceneName !== activeSceneName ||
                sceneCache.activeSceneConfig !== activeSceneConfig
            ) {
                const {
                    overrides,
                    activeSceneUnits,
                    activeSceneChildParents,
                } = buildSceneOverrides({
                    activeSceneConfig,
                    getSceneUnit,
                })
                const isCustomSceneActive = !!activeSceneConfig?.objects?.length

                sceneCache = {
                    activeSceneName,
                    activeSceneConfig,
                    overrides,
                    activeSceneUnits,
                    activeSceneChildParents,
                    isCustomSceneActive,
                }
                sceneOverrideCacheRef.current = sceneCache
                sceneOverrideRef.current = overrides

                applySceneVisibility({
                    sceneUnits: sceneUnitsRef.current,
                    activeSceneUnits,
                    activeSceneChildParents,
                    isCustomSceneActive,
                })
            }

            applySceneOverrides({
                sceneUnits: sceneUnitsRef.current,
                sceneUnitSavedState: sceneUnitSavedStateRef.current,
                originalScales: originalScalesRef.current,
                overrides: sceneCache.overrides,
            })

            Object.values(sceneUnitsRef.current).forEach((unit) => {
                if (unit?.body?.material && (unit.type === "planet" || unit.type === "moon")) {
                    if (
                        sceneOverrideRef.current?.[unit.name]
                            ?.emissiveIntensity !== undefined
                    ) {
                        return
                    }
                    if (unit.body.material.emissiveIntensity !== undefined) {
                        unit.body.material.emissiveIntensity = 0
                    }
                }
            })

            const sceneSunMultiplier = 1
            const sceneBloomMultiplier = isRealScaleScene ? 0.04 : 1

            const focusLightMultiplier =
                landingExperienceActive && !isRealScaleScene ? 1 : 0
            focusLightBlendRef.current +=
                (focusLightMultiplier - focusLightBlendRef.current) *
                (p.focusLightTransitionSpeed ?? 0.08)
            const focusLightBlend =
                focusLightBlendRef.current < 0.001
                    ? 0
                    : focusLightBlendRef.current > 0.999
                        ? 1
                        : focusLightBlendRef.current
            focusLightBlendRef.current = focusLightBlend

            const sunBlend = 1
            const sunEffectsAllowed = !isRealScaleScene && sunMesh.visible !== false
            const visualGlowBlend = sunEffectsAllowed
                ? sunGlowBlend * sceneSunMultiplier
                : 0
            const visualNormalFlareBlend = sunEffectsAllowed
                ? sunNormalFlareBlend * sceneSunMultiplier
                : 0
            const visualEclipseFlareBlend = sunEffectsAllowed
                ? sunEclipseFlareBlend * sceneSunMultiplier
                : 0
            const asteroidSunExposure =
                ((landingExperienceActive
                    ? (p.asteroidFocusSunExposure ?? 0.16)
                    : (p.asteroidSunExposure ?? 0.7)) ??
                    0.7) * sceneSunMultiplier
            getSceneUnit("AsteroidBelt")?.root?.userData?.asteroidMaterials?.forEach(
                (material) => {
                    if (material.uniforms.sunExposure) {
                        material.uniforms.sunExposure.value = asteroidSunExposure
                    }
                }
            )
            const currentTargetName = focusedMoonRef.current || selectedMoonRef.current
            const focusUnit = (focusLightBlendRef.current > 0.001 && currentTargetName) ? getSceneUnit(currentTargetName) : null
            setFocusLayerObject(focusUnit)
            if (focusRenderPass) {
                focusRenderPass.enabled =
                    focusLightBlend >
                    (p.focusRenderPassEnabledThreshold ?? 0.001)
            }

            sunFlareLight.visible = visualNormalFlareBlend > 0.02
            sunFlareLight.intensity =
                (p.sunNormalFlareIntensity ?? 0.35) * visualNormalFlareBlend
            sunFlareLight.userData.lensflare?.userData.setBlend?.(
                visualNormalFlareBlend
            )
            sunEclipseFlareLight.visible = visualEclipseFlareBlend > 0.02
            sunEclipseFlareLight.intensity =
                (p.sunEclipseFlareIntensity ?? 1.8) * visualEclipseFlareBlend
            sunEclipseFlareLight.userData.lensflare?.userData.setBlend?.(
                visualEclipseFlareBlend
            )

            outerGlow.visible = visualGlowBlend > 0.02
            outerGlow.material.opacity =
                (p.sunOuterGlowOpacity ?? 0.16) * visualGlowBlend

            const auraPulse =
                1 +
                Math.sin(time * (p.sunFireAuraPulseSpeed ?? 0.0018)) *
                (p.sunFireAuraPulseAmount ?? 0.08)
            fireAura.visible = visualGlowBlend > 0.02
            fireAura.material.opacity =
                (p.sunFireAuraOpacity ?? 0.38) *
                visualGlowBlend *
                (0.86 + (auraPulse - 1) * 0.8)
            fireAura.material.rotation =
                time * (p.sunFireAuraRotationSpeed ?? 0.00012)
            fireAura.scale.setScalar(fireAuraBaseScale * auraPulse)

            const baseSunIntensity =
                (isRealScaleScene
                    ? (p.realScaleSunIntensity ?? 1.65)
                    : (c.sunIntensity ?? 8)) * sceneSunMultiplier

            // Use radial point light for background planets to avoid spotlight illusion
            sunLight.intensity = baseSunIntensity
            directionalLight.intensity = 0

            focusedSunLight.intensity = baseSunIntensity * sunBlend
            focusedDirectionalLight.intensity = baseSunIntensity * sunBlend

            const baseFocusIntensity = (p.focusLightIntensity ?? 1.6) + (c.sunIntensity ?? 8)
            focusLight.intensity =
                baseFocusIntensity *
                focusLightBlend *
                sceneSunMultiplier
            asteroidSunLight.intensity = 0
            ambient.intensity =
                (c.ambientIntensity ?? 0.1) * sunBlend +
                (p.focusAmbientIntensity ?? 0.08) * focusLightBlend +
                (isRealScaleScene ? (p.realScaleAmbientIntensity ?? 0.28) : 0)
            const baseBloomStrength =
                (c.bloomStrength ?? p.bloomStrength ?? 0.55) *
                sceneBloomMultiplier
            const baseBloomRadius = c.bloomRadius ?? p.bloomRadius ?? 0.65
            const baseBloomThreshold =
                c.bloomThreshold ?? p.bloomThreshold ?? 0.04
            bloomPass.strength = baseBloomStrength
            bloomPass.radius = baseBloomRadius
            bloomPass.threshold = baseBloomThreshold

            grainPass.uniforms["amount"].value = p.grainAmount ?? 0.012
            grainPass.uniforms["brightnessProtect"].value =
                p.grainBrightnessProtect ?? 0.65
            grainPass.uniforms["time"].value = time * 0.001

            focusCamera.position.copy(cam.position)
            focusCamera.quaternion.copy(cam.quaternion)
            focusCamera.scale.copy(cam.scale)
            focusCamera.near = cam.near
            focusCamera.far = cam.far
            focusCamera.fov = cam.fov
            focusCamera.aspect = cam.aspect
            focusCamera.projectionMatrix.copy(cam.projectionMatrix)
            focusCamera.projectionMatrixInverse.copy(cam.projectionMatrixInverse)
            focusCamera.updateMatrixWorld(true)

            composer.render()

            if (
                showPerformanceMonitor &&
                time - perfFrameRef.current.lastUpdate >= 500
            ) {
                const sample = perfFrameRef.current
                const averageFrame =
                    sample.frames > 0 ? sample.frameTotal / sample.frames : 0

                sample.fps = averageFrame > 0 ? 1000 / averageFrame : 0
                sample.frameMs = averageFrame
                sample.frames = 0
                sample.frameTotal = 0
                sample.lastUpdate = time

                setPerfStats({
                    fps: sample.fps,
                    frameMs: sample.frameMs,
                    drawCalls: renderer.info.render.calls,
                    triangles: renderer.info.render.triangles,
                    geometries: renderer.info.memory.geometries,
                    textures: renderer.info.memory.textures,
                    dpr: renderer.getPixelRatio(),
                    ringDetails: [
                        jupiterRingDebrisRef.current,
                        saturnRingDebrisRef.current,
                        uranusRingDebrisRef.current,
                        neptuneRingDebrisRef.current,
                    ].filter((item) => item?.visible).length,
                    focusPass: !!focusRenderPass?.enabled,
                })
            }

            requestID = requestAnimationFrame(animate)
        }


        requestID = requestAnimationFrame(animate)

        return () => {
            cancelAnimationFrame(requestID)

            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("keyup", handleKeyUp)

            container.removeEventListener("wheel", handleWheel)

            if (controlsRef.current) {
                controlsRef.current.removeEventListener(
                    "start",
                    handleControlsStart
                )
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
        const targetName = getLandingTargetName(name)

        pushCurrentViewToHistory()

        hasUserInteractedRef.current = true
        freeNavigationRef.current = false
        setFreeFlightMode(false)
        setSelectedTarget(targetName)
        focusedMoonRef.current = name
        if (name !== "Jupiter") {
            setHudFeatureFocus(null)
            hudFeatureFocusRef.current = null
            hudCameraLockRef.current = null
        }

        currentViewRef.current = { mode: "focus", target: name }

        const focusDist = getLandingDistance(name)

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
                .catch(() => { })
        } else {
            document
                .exitFullscreen()
                .then(() => {
                    setIsFullscreen(false)
                })
                .catch(() => { })
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

    const activeRuntimeSceneSettings = runtimeSceneSettings || {}
    const runtimeBackground = activeRuntimeSceneSettings.background || {}
    const isGalileanScene =
        activeRuntimeSceneSettings.interactionMode === "galilean"
    const hideStarTravel =
        !!activeRuntimeSceneSettings.hideStarTravel ||
        runtimeBackground.starTravel === false
    const hideNavigation = !!activeRuntimeSceneSettings.hideNavigation
    const hideLabels =
        !!activeRuntimeSceneSettings.hideLabels &&
        !activeRuntimeSceneSettings.showLabelsOnHover

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
                    (cleanNavigationMode || freeFlightMode || activeScene) &&
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
            {!hideStarTravel && <StarTravel {...props.starTravel} />}

            {isLoadingAssets && <LoadingOverlay progress={loadingProgress} />}

            {showPerformanceMonitor && perfStats && (
                <aside style={perfPanelStyle} aria-label="Performance">
                    <strong style={perfTitleStyle}>PERF</strong>
                    <span>FPS {formatPerfNumber(perfStats.fps, 1)}</span>
                    <span>Frame {formatPerfNumber(perfStats.frameMs, 1)}ms</span>
                    <span>Draw {perfStats.drawCalls}</span>
                    <span>Tri {formatPerfNumber(perfStats.triangles)}</span>
                    <span>Geo {perfStats.geometries}</span>
                    <span>Tex {perfStats.textures}</span>
                    <span>DPR {formatPerfNumber(perfStats.dpr, 2)}</span>
                    <span>Rings {perfStats.ringDetails}/4</span>
                    <span>Focus pass {perfStats.focusPass ? "on" : "off"}</span>
                </aside>
            )}

            {showFreeFlightHint && (
                <aside style={freeFlightHintStyle} aria-label="Dica de navegacao">
                    <span style={freeFlightHintTextStyle}>
                        Navegue usando as teclas:
                    </span>
                    <div style={wasdGridStyle} aria-hidden="true">
                        <span style={{ ...wasdKeyStyle, gridColumn: 2 }}>W</span>
                        <span style={{ ...wasdKeyStyle, gridColumn: 1 }}>A</span>
                        <span style={{ ...wasdKeyStyle, gridColumn: 2 }}>S</span>
                        <span style={{ ...wasdKeyStyle, gridColumn: 3 }}>D</span>
                    </div>
                </aside>
            )}

            {!hideLabels && (
                <LabelsLayer
                    labels={labels}
                    focusedMoon={focusedMoon}
                    selectedName={selectedName}
                    isInsideJupiter={isInsideJupiter}
                    cleanNavigationMode={cleanNavigationMode}
                    freeFlightMode={freeFlightMode}
                    autoHideUI={activeScene ? false : autoHideUI}
                    cfg={cfg}
                    config={props}
                    isJupiterChildTarget={isJupiterChildTarget}
                    isJupiterContext={isJupiterContext}
                    getDisplayName={getDisplayName}
                    onFocus={focusOn}
                    hudOpen={!!ActiveOverlay || !!InteriorOverlay}
                    hoveredObjectName={hoveredObjectName}
                    labelsOnlyOnHover={
                        activeScene === "realScaleLine" ||
                        !!activeRuntimeSceneSettings.showLabelsOnHover
                    }
                    sceneLabelsOnHover={isGalileanScene}
                />
            )}
            {(cleanNavigationMode || (freeFlightMode && cfg.hideUI)) && (
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
            {!hideNavigation && (
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
            )}
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

const perfPanelStyle = {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 9000,
    display: "grid",
    gap: 4,
    minWidth: 132,
    padding: "10px 12px",
    background: "rgba(0,0,0,0.68)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#fff",
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
    fontSize: 11,
    lineHeight: 1.25,
    pointerEvents: "none",
}

const perfTitleStyle = {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    letterSpacing: "0.12em",
}

const freeFlightHintStyle = {
    position: "absolute",
    left: "50%",
    top: "14vh",
    transform: "translateX(-50%)",
    zIndex: 9200,
    display: "grid",
    justifyItems: "center",
    gap: 14,
    padding: "18px 22px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.42)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 18px 48px rgba(0,0,0,0.32)",
    color: "white",
    pointerEvents: "none",
}

const freeFlightHintTextStyle = {
    fontFamily: "'General Sans', Inter, system-ui, sans-serif",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.82)",
}

const wasdGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 42px)",
    gridAutoRows: "42px",
    gap: 8,
}

const wasdKeyStyle = {
    display: "grid",
    placeItems: "center",
    borderRadius: 10,
    border: "2px solid rgba(255,255,255,0.82)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.94)",
    fontFamily: "'General Sans', Inter, system-ui, sans-serif",
    fontSize: 20,
    fontWeight: 800,
}
