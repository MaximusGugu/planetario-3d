export const registerSceneUnit = (
    sceneUnits,
    {
        name,
        type = "object",
        root,
        body,
        focusTarget,
        orbitPivot = null,
        parent = null,
        children = [],
        hideWithScene = true,
    }
) => {
    if (!name || !root) return

    sceneUnits[name] = {
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

export const getSceneUnit = (sceneUnits, name) => sceneUnits[name] || null

export const getSceneUnitTarget = (sceneUnits, moons, name) => {
    const unit = getSceneUnit(sceneUnits, name)
    return unit?.focusTarget || moons[name] || null
}

export const saveSceneUnitState = (sceneUnits) => {
    const savedState = {}

    Object.entries(sceneUnits).forEach(([name, unit]) => {
        const root = unit.root
        if (!root) return

        const nodes = []
        root.traverse((object) => {
            const material = object.material
            nodes.push({
                object,
                position: object.position.clone(),
                rotation: object.rotation.clone(),
                quaternion: object.quaternion.clone(),
                scale: object.scale.clone(),
                visible: object.visible,
                material: material
                    ? {
                          color: material.color?.clone?.(),
                          emissive: material.emissive?.clone?.(),
                          emissiveIntensity: material.emissiveIntensity,
                      }
                    : null,
            })
        })

        savedState[name] = {
            position: root.position.clone(),
            rotation: root.rotation.clone(),
            quaternion: root.quaternion.clone(),
            scale: root.scale.clone(),
            visible: root.visible,
            nodes,
        }
    })

    return savedState
}

export const restoreSceneUnitVisibility = (sceneUnits) => {
    Object.values(sceneUnits).forEach((unit) => {
        if (unit?.root) unit.root.visible = true
        if (unit?.body) unit.body.visible = true
    })
}

export const restoreSceneUnitState = (sceneUnits, savedState) => {
    const restoredObjects = new Set()

    Object.entries(sceneUnits).forEach(([name, unit]) => {
        const root = unit?.root
        const saved = savedState?.[name]
        if (!root || !saved) return

        const restoreObject = (object, state) => {
            if (!object || !state || restoredObjects.has(object)) return

            object.position.copy(state.position)
            object.quaternion.copy(state.quaternion)
            object.rotation.copy(state.rotation)
            object.scale.copy(state.scale)
            object.visible = state.visible
            if (state.material && object.material) {
                if (state.material.color && object.material.color) {
                    object.material.color.copy(state.material.color)
                }
                if (state.material.emissive && object.material.emissive) {
                    object.material.emissive.copy(state.material.emissive)
                }
                if (
                    state.material.emissiveIntensity !== undefined &&
                    object.material.emissiveIntensity !== undefined
                ) {
                    object.material.emissiveIntensity =
                        state.material.emissiveIntensity
                }
            }
            object.updateMatrix()
            object.updateMatrixWorld(true)
            restoredObjects.add(object)
        }

        if (saved.nodes?.length) {
            saved.nodes.forEach((nodeState) => {
                restoreObject(nodeState.object, nodeState)
            })
            return
        }

        restoreObject(root, saved)
    })
}
