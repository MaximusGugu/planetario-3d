import * as THREE from "three"

export const createAsteroidBelt = (config) => {
    const asteroidGeo = new THREE.IcosahedronGeometry(0.05, 0)
    const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x888888 })
    const asteroidCount = config.asteroidCount ?? 600
    const instanced = new THREE.InstancedMesh(
        asteroidGeo,
        asteroidMat,
        asteroidCount
    )

    const dummy = new THREE.Object3D()

    for (let i = 0; i < asteroidCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const radius =
            (config.asteroidBeltInner ?? 140) +
            Math.random() *
                ((config.asteroidBeltOuter ?? 160) -
                    (config.asteroidBeltInner ?? 140))

        dummy.position.set(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * (config.asteroidBeltThickness ?? 0.5),
            Math.sin(angle) * radius
        )

        dummy.rotation.set(Math.random(), Math.random(), Math.random())
        dummy.scale.setScalar(Math.random() * 0.5 + 0.5)
        dummy.updateMatrix()
        instanced.setMatrixAt(i, dummy.matrix)
    }

    return instanced
}
