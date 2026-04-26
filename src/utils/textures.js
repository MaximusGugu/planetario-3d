import * as THREE from "three"

export const createTextureLoader = ({ renderer, loadingManager }) => {
    const textureLoader = new THREE.TextureLoader(loadingManager)

    return (url) => {
        if (!url) return null

        const texture = textureLoader.load(
            url,
            (loadedTexture) => {
                loadedTexture.colorSpace = THREE.SRGBColorSpace
                loadedTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()
                loadedTexture.needsUpdate = true
            },
            undefined,
            (error) => {
                console.warn("Falha ao carregar textura:", url, error)
            }
        )

        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy()

        return texture
    }
}
