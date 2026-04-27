import * as THREE from "three"

export const buildSceneOverrides = ({ activeSceneConfig, getSceneUnit }) => {
    const overrides = {}
    const activeSceneUnits = new Set()
    const activeSceneChildParents = new Set()

    if (activeSceneConfig?.objects?.length) {
        activeSceneConfig.objects
            .filter((item) => item.enabled && item.objectName)
            .forEach((item) => {
                const unit = getSceneUnit(item.objectName)
                if (!unit?.root) return

                activeSceneUnits.add(item.objectName)
                if (item.includeChildren !== false) {
                    activeSceneChildParents.add(item.objectName)
                }
                overrides[item.objectName] = {
                    position: new THREE.Vector3(item.x ?? 0, item.y ?? 0, item.z ?? 0),
                    scale: item.scale ?? 1,
                    rotation: new THREE.Euler(
                        THREE.MathUtils.degToRad(item.rotX ?? 0),
                        THREE.MathUtils.degToRad(item.rotY ?? 0),
                        THREE.MathUtils.degToRad(item.rotZ ?? 0)
                    ),
                    materialColor: item.materialColor,
                    emissive: item.emissive,
                    emissiveIntensity: item.emissiveIntensity,
                }
            })
    }

    return { overrides, activeSceneUnits, activeSceneChildParents }
}

export const applySceneVisibility = ({
    sceneUnits,
    activeSceneUnits,
    activeSceneChildParents,
    isCustomSceneActive,
}) => {
    Object.entries(sceneUnits).forEach(([, unit]) => {
        if (!unit?.root) return

        const parentIsActive =
            unit.parent && activeSceneChildParents?.has(unit.parent)
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
                root.rotation.x = THREE.MathUtils.lerp(
                    root.rotation.x,
                    saved.rotation.x,
                    0.04
                )
                root.rotation.y = THREE.MathUtils.lerp(
                    root.rotation.y,
                    saved.rotation.y,
                    0.04
                )
                root.rotation.z = THREE.MathUtils.lerp(
                    root.rotation.z,
                    saved.rotation.z,
                    0.04
                )
                root.scale.lerp(saved.scale, 0.04)
            } else {
                root.scale.lerp(originalScales[name], 0.04)
            }

            return
        }

        const bodyMaterial = unit.body?.material
        if (bodyMaterial) {
            if (override.materialColor !== undefined && bodyMaterial.color) {
                bodyMaterial.color.set(override.materialColor)
            }
            if (override.emissive !== undefined && bodyMaterial.emissive) {
                bodyMaterial.emissive.set(override.emissive)
            }
            if (
                override.emissiveIntensity !== undefined &&
                bodyMaterial.emissiveIntensity !== undefined
            ) {
                bodyMaterial.emissiveIntensity = override.emissiveIntensity
            }
        }

        const targetScale = originalScales[name]
            .clone()
            .multiplyScalar(override.scale ?? 1)

        const bodyWorld = new THREE.Vector3()
        unit.focusTarget.getWorldPosition(bodyWorld)

        const rootWorld = new THREE.Vector3()
        root.getWorldPosition(rootWorld)

        const bodyOffsetFromRoot = bodyWorld.clone().sub(rootWorld)
        const currentScale = Math.max(root.scale.x, root.scale.y, root.scale.z)
        const targetScaleScalar = Math.max(
            targetScale.x,
            targetScale.y,
            targetScale.z
        )
        const scaleCorrection =
            currentScale > 0 ? targetScaleScalar / currentScale : 1
        const correctedTargetWorld = override.position
            .clone()
            .sub(bodyOffsetFromRoot.multiplyScalar(scaleCorrection))

        const parent = root.parent
        const localTarget = parent
            ? parent.worldToLocal(correctedTargetWorld.clone())
            : correctedTargetWorld.clone()

        root.position.lerp(localTarget, 0.04)
        root.rotation.x = THREE.MathUtils.lerp(
            root.rotation.x,
            override.rotation.x,
            0.04
        )
        root.rotation.y = THREE.MathUtils.lerp(
            root.rotation.y,
            override.rotation.y,
            0.04
        )
        root.rotation.z = THREE.MathUtils.lerp(
            root.rotation.z,
            override.rotation.z,
            0.04
        )

        root.scale.lerp(targetScale, 0.04)
    })
}
