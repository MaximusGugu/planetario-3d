import * as THREE from "three"

export const createSphere = ({
    name,
    textureUrl,
    radius,
    position,
    color,
    segments = 64,
    emissive = 0x000000,
    basic = false,
    loadTexture,
    config,
}) => {
    const geometry = new THREE.SphereGeometry(radius, segments, segments)
    const texture = loadTexture(textureUrl)

    const material = basic
        ? new THREE.MeshBasicMaterial({
              map: texture || null,
              color: texture
                  ? new THREE.Color(
                        config.sunColorR ?? 1.2,
                        config.sunColorG ?? 1.1,
                        config.sunColorB ?? 0.9
                    )
                  : color,
              toneMapped: false,
          })
        : new THREE.MeshStandardMaterial({
              map: texture || null,
              color: texture ? 0xffffff : color,
              roughness: 0.85,
              metalness: 0,
              emissive: 0x444444,
              emissiveIntensity: 0,
              side: THREE.FrontSide,
          })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = name
    mesh.userData.baseRadius = radius
    mesh.position.set(position[0], position[1], position[2])

    return mesh
}
