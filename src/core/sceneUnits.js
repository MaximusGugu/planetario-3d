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

        savedState[name] = {
            position: root.position.clone(),
            rotation: root.rotation.clone(),
            scale: root.scale.clone(),
            visible: root.visible,
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
