import * as THREE from "three"

export const updateMoonSystems = ({
    moons,
    earth,
    selectedName,
    orbitSpeed,
    rotateSpeed,
}) => {
    Object.values(moons).forEach((moon) => {
        const isEarthMoon = moon.mesh.name === "Moon"

        if (isEarthMoon) {
            if (selectedName !== "Moon") {
                moon.phase = (moon.phase ?? 0) + 0.01 * (moon.speed ?? 1)
                moon.pivot.rotation.y += moon.precessionSpeed ?? 0.00004
            }

            const phase = moon.phase ?? 0
            const distance = moon.distance ?? moon.mesh.position.length()
            const eccentricity = moon.eccentricity ?? 0.055
            const orbitalRadius =
                (distance * (1 - eccentricity * eccentricity)) /
                (1 + eccentricity * Math.cos(phase))

            moon.mesh.position.set(
                Math.cos(phase) * orbitalRadius,
                Math.sin(phase) * orbitalRadius * Math.sin(moon.inclination ?? 0),
                Math.sin(phase) * orbitalRadius
            )

            if (earth) {
                const earthWorld = new THREE.Vector3()
                const moonWorld = new THREE.Vector3()

                earth.getWorldPosition(earthWorld)
                moon.mesh.getWorldPosition(moonWorld)

                const direction = earthWorld.sub(moonWorld).normalize()
                const targetQuat = new THREE.Quaternion()
                targetQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction)
                moon.mesh.quaternion.copy(targetQuat)
            }

            return
        }

        if (selectedName !== moon.mesh.name) {
            moon.pivot.rotation.y += (orbitSpeed ?? 0.3) * 0.005 * (moon.speed ?? 1)
        }

        moon.mesh.rotation.y += (rotateSpeed ?? 0.5) * 0.01
    })
}
