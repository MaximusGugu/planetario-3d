import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export const createControls = ({ camera, domElement, config }) => {
    const controls = new OrbitControls(camera, domElement)

    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.enablePan = true
    controls.panSpeed = 0.35
    controls.rotateSpeed = 0.7
    controls.minDistance = config.minZoom || 0.05
    controls.maxDistance = config.maxZoomLimit || 1000
    controls.target.set(
        config.targetStartX ?? config.jupiterOrbitDist ?? 45,
        config.targetStartY ?? 0,
        config.targetStartZ ?? 0
    )

    return controls
}
