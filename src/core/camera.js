import * as THREE from "three"

export const createCamera = ({ container, config }) => {
    const camera = new THREE.PerspectiveCamera(
        45,
        container.offsetWidth / container.offsetHeight,
        0.01,
        5000
    )

    camera.position.set(
        config.camStartX ?? config.jupiterOrbitDist ?? 45,
        config.camStartY ?? 5,
        config.camStartZ ?? 18
    )

    return camera
}

export const getInitialCameraTarget = (config) =>
    new THREE.Vector3(
        config.targetStartX ?? config.jupiterOrbitDist ?? 45,
        config.targetStartY ?? 0,
        config.targetStartZ ?? 0
    )
