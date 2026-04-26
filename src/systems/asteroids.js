import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

export const ASTEROID_LAYER = 1

const createAsteroidMaterial = (config) =>
    new THREE.ShaderMaterial({
        uniforms: {
            baseColor: {
                value: new THREE.Color(config.asteroidColor ?? 0xd8d0c4),
            },
            sunWorldPosition: { value: new THREE.Vector3() },
            ambientStrength: {
                value: config.asteroidAmbientStrength ?? 0.025,
            },
            sunStrength: {
                value: config.asteroidSunShaderStrength ?? 0.62,
            },
            sunExposure: {
                value: config.asteroidSunExposure ?? 0.7,
            },
            maxBrightness: {
                value: config.asteroidMaxBrightness ?? 0.58,
            },
            distanceFadeStart: {
                value: config.asteroidLightFadeStart ?? 35,
            },
            distanceFadeEnd: {
                value: config.asteroidLightFadeEnd ?? 44,
            },
            distanceFadeFloor: {
                value: config.asteroidLightFadeFloor ?? 0.35,
            },
        },
        vertexShader: `
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;

            void main() {
                mat4 instanceWorld = modelMatrix * instanceMatrix;
                vec4 worldPosition = instanceWorld * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                vWorldNormal = normalize(mat3(instanceWorld) * normal);
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 baseColor;
            uniform vec3 sunWorldPosition;
            uniform float ambientStrength;
            uniform float sunStrength;
            uniform float sunExposure;
            uniform float maxBrightness;
            uniform float distanceFadeStart;
            uniform float distanceFadeEnd;
            uniform float distanceFadeFloor;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPosition;

            void main() {
                vec3 toSun = normalize(sunWorldPosition - vWorldPosition);
                float diffuse = max(dot(normalize(vWorldNormal), toSun), 0.0);
                float distanceFromSun = length(vWorldPosition - sunWorldPosition);
                float distanceFade = mix(
                    1.0,
                    distanceFadeFloor,
                    smoothstep(distanceFadeStart, distanceFadeEnd, distanceFromSun)
                );
                float light = ambientStrength + diffuse * sunStrength * sunExposure * distanceFade;
                vec3 color = min(baseColor * light, vec3(maxBrightness));
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    })

const collectRockGeometries = (gltf) => {
    const geometries = []

    gltf.scene.updateMatrixWorld(true)
    gltf.scene.traverse((child) => {
        if (!child.isMesh || !child.geometry) return

        const geometry = child.geometry.clone()
        geometry.applyMatrix4(child.matrixWorld)
        geometry.computeBoundingBox()

        const box = geometry.boundingBox
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxAxis = Math.max(size.x, size.y, size.z)

        if (!Number.isFinite(maxAxis) || maxAxis <= 0) return

        geometry.translate(-center.x, -center.y, -center.z)
        geometry.scale(1 / maxAxis, 1 / maxAxis, 1 / maxAxis)
        geometry.computeVertexNormals()
        geometries.push(geometry)
    })

    return geometries.slice(0, gltf.userData?.geometryLimit ?? Infinity)
}

const randomAsteroidScale = (config) => {
    const roll = Math.random()
    const base =
        roll > 0.92
            ? THREE.MathUtils.randFloat(
                  config.asteroidMediumMinScale ?? 1.05,
                  config.asteroidMediumMaxScale ?? 1.75
              )
            : THREE.MathUtils.randFloat(
                  config.asteroidMinScale ?? 0.35,
                  config.asteroidMaxScale ?? 1.05
              )
    const scaleMultiplier = config.asteroidScaleMultiplier ?? 1

    return new THREE.Vector3(
        base * scaleMultiplier * THREE.MathUtils.randFloat(0.75, 1.25),
        base * scaleMultiplier * THREE.MathUtils.randFloat(0.7, 1.15),
        base * scaleMultiplier * THREE.MathUtils.randFloat(0.8, 1.35)
    )
}

const getBeltPlacement = ({ config, safeInner, safeOuter, beltWidth, groupIndex }) => {
    const angle = Math.random() * Math.PI * 2
    const clusterCount = config.asteroidClusterCount ?? 30
    const clusterAngle =
        Math.round(Math.random() * clusterCount) *
        ((Math.PI * 2) / clusterCount)
    const clusteredAngle = THREE.MathUtils.lerp(
        angle,
        clusterAngle + THREE.MathUtils.randFloatSpread(0.16),
        config.asteroidClusterStrength ?? 0.32
    )
    const lane = Math.pow(Math.random(), 0.86)
    const radius =
        safeInner +
        beltWidth * lane +
        Math.sin(clusteredAngle * 7 + groupIndex) * beltWidth * 0.035
    const clampedRadius = THREE.MathUtils.clamp(radius, safeInner, safeOuter)

    return new THREE.Vector3(
        Math.cos(clusteredAngle) * clampedRadius,
        (Math.random() - 0.5) * (config.asteroidBeltThickness ?? 2.1),
        Math.sin(clusteredAngle) * clampedRadius
    )
}

const populateBelt = ({ belt, geometries, config, safeInner, safeOuter, beltWidth }) => {
    if (!geometries.length) return

    const asteroidCount = config.asteroidCount ?? 6200
    const material = createAsteroidMaterial(config)
    belt.userData.asteroidMaterials = [material]
    const dummy = new THREE.Object3D()
    let placed = 0

    geometries.forEach((geometry, groupIndex) => {
        const remaining = asteroidCount - placed
        const groupsLeft = geometries.length - groupIndex
        const count =
            groupIndex === geometries.length - 1
                ? remaining
                : Math.max(1, Math.round(remaining / groupsLeft))

        placed += count

        const instanced = new THREE.InstancedMesh(geometry, material, count)
        instanced.name = `AsteroidBelt_GLBRock_${groupIndex}`
        instanced.userData.focused = false
        instanced.castShadow = false
        instanced.receiveShadow = false
        instanced.layers.set(ASTEROID_LAYER)
        instanced.layers.disable(2)

        for (let i = 0; i < count; i++) {
            dummy.position.copy(
                getBeltPlacement({
                    config,
                    safeInner,
                    safeOuter,
                    beltWidth,
                    groupIndex,
                })
            )
            dummy.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            )
            dummy.scale.copy(randomAsteroidScale(config))
            dummy.updateMatrix()
            instanced.setMatrixAt(i, dummy.matrix)
        }

        instanced.instanceMatrix.needsUpdate = true
        belt.add(instanced)
    })

    belt.traverse((object) => {
        object.userData.focused = false
        object.layers.set(ASTEROID_LAYER)
        object.layers.disable(2)
        object.castShadow = false
        object.receiveShadow = false
    })
}

export const createAsteroidBelt = (config, loadingManager) => {
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
    const belt = new THREE.Group()
    belt.name = "AsteroidBelt"
    belt.userData.focused = false
    belt.layers.set(ASTEROID_LAYER)
    belt.layers.disable(2)

    const loader = new GLTFLoader(loadingManager)
    loader.load(
        config.asteroidModel,
        (gltf) => {
            gltf.userData.geometryLimit = config.asteroidGeometryLimit ?? 12
            populateBelt({
                belt,
                geometries: collectRockGeometries(gltf),
                config,
                safeInner,
                safeOuter,
                beltWidth,
            })
        },
        undefined,
        (error) => {
            console.warn("Erro ao carregar asteroides GLB:", error)
        }
    )

    return belt
}
