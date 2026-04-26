import * as THREE from "three"

export const buildSceneOverrides = ({ activeSceneConfig, getSceneUnit }) => {
    const overrides = {}
    const activeSceneUnits = new Set()

    if (activeSceneConfig?.objects?.length) {
        activeSceneConfig.objects
            .filter((item) => item.enabled && item.objectName)
            .forEach((item) => {
                const unit = getSceneUnit(item.objectName)
                if (!unit?.root) return

                activeSceneUnits.add(item.objectName)
                overrides[item.objectName] = {
                    position: new THREE.Vector3(item.x ?? 0, item.y ?? 0, item.z ?? 0),
                    scale: item.scale ?? 1,
                }
            })
    }

    return { overrides, activeSceneUnits }
}

export const applySceneVisibility = ({
    sceneUnits,
    activeSceneUnits,
    isCustomSceneActive,
}) => {
    Object.entries(sceneUnits).forEach(([, unit]) => {
        if (!unit?.root) return

        const parentIsActive = unit.parent && activeSceneUnits.has(unit.parent)
        const shouldShow =
            !isCustomSceneActive ||
            activeSceneUnits.has(unit.name) ||
            parentIsActive ||
            unit.hideWithScene === false

        unit.root.visible = shouldShow
    })
}

export const applySceneOverrides = ({
    sceneUnits,
    sceneUnitSavedState,
    originalScales,
    overrides,
}) => {
    Object.entries(sceneUnits).forEach(([name, unit]) => {
        const root = unit.root
        if (!root) return

        if (!originalScales[name]) {
            originalScales[name] = root.scale.clone()
        }

        const override = overrides[name]

        if (!override) {
            const saved = sceneUnitSavedState[name]

            if (saved) {
                root.position.lerp(saved.position, 0.04)
                root.scale.lerp(saved.scale, 0.04)
            } else {
                root.scale.lerp(originalScales[name], 0.04)
            }

            return
        }

        const bodyWorld = new THREE.Vector3()
        unit.focusTarget.getWorldPosition(bodyWorld)

        const rootWorld = new THREE.Vector3()
        root.getWorldPosition(rootWorld)

        const bodyOffsetFromRoot = bodyWorld.clone().sub(rootWorld)
        const correctedTargetWorld = override.position
            .clone()
            .sub(bodyOffsetFromRoot.multiplyScalar(override.scale ?? 1))

        const parent = root.parent
        const localTarget = parent
            ? parent.worldToLocal(correctedTargetWorld.clone())
            : correctedTargetWorld.clone()

        root.position.lerp(localTarget, 0.04)

        const targetScale = originalScales[name]
            .clone()
            .multiplyScalar(override.scale ?? 1)

        root.scale.lerp(targetScale, 0.04)
    })
}
