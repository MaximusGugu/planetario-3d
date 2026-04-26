export const SCENE_PRESETS = {}

export const getSceneConfig = (config, sceneId) => {
    const preset = SCENE_PRESETS[sceneId]
    if (preset) return preset

    const customScene = config.scenes?.find((scene) => scene.id === sceneId)

    if (!customScene) return null

    return {
        name: customScene.label || customScene.id,
        camera: {
            position: [
                customScene.camX ?? 0,
                customScene.camY ?? 0.6,
                customScene.camZ ?? 28,
            ],
            target: [
                customScene.targetX ?? 1.5,
                customScene.targetY ?? 0,
                customScene.targetZ ?? 0,
            ],
            distance: customScene.camZ ?? 28,
        },
        objects: customScene.objects || [],
    }
}
