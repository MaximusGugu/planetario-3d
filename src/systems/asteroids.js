import * as THREE from "three"

export const createAsteroidBelt = (config) => {
    const marsOrbit = config.marsDist ?? 31
    const jupiterOrbit = config.jupiterOrbitDist ?? 45
    const orbitGap = Math.max(0, jupiterOrbit - marsOrbit)
    const beltInner =
        config.asteroidBeltInner ?? marsOrbit + Math.max(2.5, orbitGap * 0.18)
    const beltOuter =
        config.asteroidBeltOuter ?? jupiterOrbit - Math.max(3, orbitGap * 0.16)
    const safeInner = Math.min(beltInner, beltOuter - 0.5)
    const safeOuter = Math.max(beltOuter, safeInner + 0.5)
    const beltWidth = safeOuter - safeInner
    const asteroidCount = config.asteroidCount ?? 3000
    const asteroidGroups = [
        {
            name: "AsteroidBelt_Rubble",
            geometry: new THREE.IcosahedronGeometry(0.055, 0),
            share: 0.38,
        },
        {
            name: "AsteroidBelt_Chunks",
            geometry: new THREE.DodecahedronGeometry(0.05, 0),
            share: 0.27,
        },
        {
            name: "AsteroidBelt_Slabs",
            geometry: new THREE.TetrahedronGeometry(0.06, 0),
            share: 0.2,
        },
        {
            name: "AsteroidBelt_Shards",
            geometry: new THREE.OctahedronGeometry(0.045, 0),
            share: 0.15,
        },
    ]
    const asteroidMat = new THREE.MeshStandardMaterial({
        color: 0x8f8b84,
        roughness: 0.9,
        metalness: 0.03,
        vertexColors: true,
    })
    const belt = new THREE.Group()
    belt.name = "AsteroidBelt"

    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    let placed = 0

    asteroidGroups.forEach((group, groupIndex) => {
        const count =
            groupIndex === asteroidGroups.length - 1
                ? Math.max(0, asteroidCount - placed)
                : Math.min(
                      Math.max(0, asteroidCount - placed),
                      Math.round(asteroidCount * group.share)
                  )
        if (count === 0) return
        placed += count

        const instanced = new THREE.InstancedMesh(
            group.geometry,
            asteroidMat,
            count
        )
        instanced.name = group.name

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const lane = Math.random()
            const radius =
                safeInner +
                beltWidth * lane +
                Math.sin(angle * 7 + groupIndex) * beltWidth * 0.025
            const clampedRadius = THREE.MathUtils.clamp(
                radius,
                safeInner,
                safeOuter
            )

            dummy.position.set(
                Math.cos(angle) * clampedRadius,
                (Math.random() - 0.5) *
                    (config.asteroidBeltThickness ?? 1.25),
                Math.sin(angle) * clampedRadius
            )

            dummy.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            )

            const baseScale = Math.random() * 0.85 + 0.45
            dummy.scale.set(
                baseScale * (Math.random() * 0.8 + 0.65),
                baseScale * (Math.random() * 0.9 + 0.45),
                baseScale * (Math.random() * 1.1 + 0.55)
            )
            dummy.updateMatrix()
            instanced.setMatrixAt(i, dummy.matrix)

            color.setHSL(
                0.09 + Math.random() * 0.04,
                0.08 + Math.random() * 0.08,
                0.38 + Math.random() * 0.18
            )
            instanced.setColorAt(i, color)
        }

        instanced.instanceMatrix.needsUpdate = true
        if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
        belt.add(instanced)
    })

    return belt
}
