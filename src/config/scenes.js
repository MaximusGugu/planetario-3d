export const SCENE_PRESETS = {}

export const getSceneConfig = (config, sceneId) => {
    const preset = SCENE_PRESETS[sceneId]
    if (preset) return preset

    const customScene = config.scenes?.find((scene) => scene.id === sceneId)

    if (!customScene) return null

    return {
        id: customScene.id,
        type: customScene.type || "simulation",
        name: customScene.label || customScene.id,
        camera: {
            position: customScene.camera?.position || [
                customScene.camX ?? 0,
                customScene.camY ?? 0.6,
                customScene.camZ ?? 28,
            ],
            target: customScene.camera?.target || [
                customScene.targetX ?? 1.5,
                customScene.targetY ?? 0,
                customScene.targetZ ?? 0,
            ],
            distance:
                customScene.camera?.distance ??
                customScene.camZ ??
                28,
        },
        objects: customScene.objects || [],
        background: customScene.background,
        hideStarTravel: customScene.hideStarTravel,
        hideNavigation: customScene.hideNavigation,
        hideLabels: customScene.hideLabels,
    }
}
