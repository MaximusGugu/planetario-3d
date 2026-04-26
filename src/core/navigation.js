const getBodyWorldRadius = (unit) => {
    const body = unit?.body || unit?.focusTarget
    const baseRadius = body?.userData?.baseRadius

    if (!body || !baseRadius) return null

    const worldScale = body.getWorldScale
        ? body.getWorldScale(body.scale.clone())
        : body.scale

    return baseRadius * Math.max(worldScale.x, worldScale.y, worldScale.z)
}

export const getDistanceForViewportHeight = ({ camera, radius, viewportFraction }) => {
    if (!camera || !radius || !viewportFraction) return null

    const fovRadians = (camera.fov * Math.PI) / 180
    const halfAngle = (viewportFraction * fovRadians) / 2
    return radius / Math.tan(halfAngle)
}

export const getFocusDistance = ({ config, customMarker, unit, camera }) => {
    if (customMarker) return customMarker.zoomDist ?? 2

    if (unit?.type === "planet" || unit?.type === "star") {
        const visualDistance = getDistanceForViewportHeight({
            camera,
            radius: getBodyWorldRadius(unit),
            viewportFraction:
                unit.type === "planet"
                    ? (config.planetViewportHeight ?? 0.5)
                    : (config.starViewportHeight ?? config.planetViewportHeight ?? 0.5),
        })

        return visualDistance ?? config.focusDistPlanet ?? 6
    }

    if (unit?.type === "moon") {
        const visualDistance = getDistanceForViewportHeight({
            camera,
            radius: getBodyWorldRadius(unit),
            viewportFraction: config.moonViewportHeight ?? 0.5,
        })

        return visualDistance ?? config.focusDistMoon ?? 1.5
    }

    return config.focusDistMoon ?? 1.5
}

export const getNextPlanetName = ({ focusedName, selectedName, direction, nav }) => {
    const current =
        focusedName && nav.includes(focusedName)
            ? focusedName
            : selectedName && nav.includes(selectedName)
              ? selectedName
              : "Jupiter"

    const index = nav.indexOf(current)
    let next = index + direction

    if (next < 0) next = nav.length - 1
    if (next >= nav.length) next = 0

    return nav[next]
}
