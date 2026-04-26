export const resolveHoveredSceneUnit = ({ raycaster, mouseNdc, camera, sceneUnits }) => {
    raycaster.setFromCamera(mouseNdc, camera)

    const hoverCandidates = Object.entries(sceneUnits)
        .map(([name, unit]) => ({
            name,
            obj: unit.focusTarget || unit.body || unit.root,
            root: unit.root,
        }))
        .filter(({ obj, root }) => obj && root?.visible !== false)

    const intersects = raycaster.intersectObjects(
        hoverCandidates.map((item) => item.obj),
        true
    )

    if (intersects.length === 0) return null

    const hit = intersects[0].object
    const found = hoverCandidates.find(({ obj }) => {
        let current = hit

        while (current) {
            if (current === obj) return true
            current = current.parent
        }

        return false
    })

    return found?.name || null
}

export const syncRendererSize = ({ renderer, composer, bloomPass, camera, rect }) => {
    const expectedWidth = Math.floor(rect.width * renderer.getPixelRatio())
    const expectedHeight = Math.floor(rect.height * renderer.getPixelRatio())

    if (
        renderer.domElement.width === expectedWidth &&
        renderer.domElement.height === expectedHeight
    ) {
        return
    }

    renderer.setSize(rect.width, rect.height)
    composer.setSize(rect.width, rect.height)
    bloomPass.setSize(rect.width, rect.height)
    camera.aspect = rect.width / rect.height
    camera.updateProjectionMatrix()
}
