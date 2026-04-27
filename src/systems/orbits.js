import * as THREE from "three"

const seededRandom = (seed) => {
    let value = seed % 2147483647
    if (value <= 0) value += 2147483646

    return () => {
        value = (value * 16807) % 2147483647
        return (value - 1) / 2147483646
    }
}

const pickRingBand = (bands, random) => {
    if (!bands?.length) return null

    const total = bands.reduce((sum, band) => sum + (band.weight ?? 1), 0)
    let cursor = random() * total

    for (const band of bands) {
        cursor -= band.weight ?? 1
        if (cursor <= 0) return band
    }

    return bands[bands.length - 1]
}

const colorFromPalette = (palette, random) => {
    const fallback = [0xd8c5a3, 0x8d7f68, 0xf1e3c2, 0x4f493f]
    const colors = palette?.length ? palette : fallback

    return new THREE.Color(colors[Math.floor(random() * colors.length)])
}

export const createRingPlane = ({
    name,
    textureUrl,
    width,
    height,
    rotX,
    rotY,
    rotZ,
    scale,
    opacity,
    alphaTest,
    loadTexture,
    config,
}) => {
    const texture = loadTexture(textureUrl)

    const material = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
            map: { value: texture },
            opacity: { value: opacity ?? 0.6 },
            alphaTestValue: { value: alphaTest ?? 0.03 },
            lightBoost: {
                value:
                    name === "Saturn Rings"
                        ? (config.saturnRingLightBoost ?? 0.5)
                        : name === "Uranus Rings"
                          ? (config.uranusRingLightBoost ?? 0.45)
                          : name === "Neptune Rings"
                            ? (config.neptuneRingLightBoost ?? 0.55)
                            : (config.ringLightBoost ?? 0.55),
            },
            shadowStrength: {
                value:
                    name === "Saturn Rings"
                        ? (config.saturnRingShadowStrength ?? 0.75)
                        : name === "Uranus Rings"
                          ? (config.uranusRingShadowStrength ?? 0.65)
                          : name === "Neptune Rings"
                            ? (config.neptuneRingShadowStrength ?? 0.65)
                            : (config.ringShadowStrength ?? 0.6),
            },
            shadowWidth: {
                value:
                    name === "Saturn Rings"
                        ? (config.saturnRingShadowWidth ?? 0.18)
                        : name === "Uranus Rings"
                          ? (config.uranusRingShadowWidth ?? 0.16)
                          : name === "Neptune Rings"
                            ? (config.neptuneRingShadowWidth ?? 0.16)
                            : (config.ringShadowWidth ?? 0.18),
            },
            sunDir: { value: new THREE.Vector2(1, 0) },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D map;
            uniform float opacity;
            uniform float alphaTestValue;
            uniform float lightBoost;
            uniform float shadowStrength;
            uniform float shadowWidth;
            uniform vec2 sunDir;

            varying vec2 vUv;

            void main() {
                vec4 tex = texture2D(map, vUv);

                float alpha = tex.a * opacity;
                if (alpha < alphaTestValue) discard;

                vec2 center = vec2(0.5, 0.5);
                vec2 p = vUv - center;
                vec2 dir = normalize(sunDir);

                float towardSun = dot(normalize(p), dir);
                float lit = smoothstep(-0.2, 1.0, towardSun);

                float behindPlanet = 1.0 - smoothstep(-0.15, 0.0, dot(p, dir));
                float sideDistance = abs(dot(p, vec2(-dir.y, dir.x)));
                float shadowBand = 1.0 - smoothstep(shadowWidth, shadowWidth + 0.08, sideDistance);
                float shadow = behindPlanet * shadowBand * shadowStrength;

                vec3 color = tex.rgb;
                color *= 0.08 + lit * lightBoost;
                color *= 1.0 - shadow;

                gl_FragColor = vec4(color, alpha);
            }
        `,
    })

    const ring = new THREE.Mesh(new THREE.PlaneGeometry(width, height, 1, 1), material)

    ring.name = name
    ring.rotation.set(
        THREE.MathUtils.degToRad(rotX || 0),
        THREE.MathUtils.degToRad(rotY || 0),
        THREE.MathUtils.degToRad(rotZ || 0)
    )
    ring.scale.setScalar(scale || 1)

    return ring
}

export const createRingDebrisLayer = ({
    name = "Ring Debris",
    count = 2400,
    innerRadius = 0.24,
    outerRadius = 0.49,
    width = 3.2,
    height = 3.2,
    sizeMin = 0.004,
    sizeMax = 0.024,
    verticalSpread = 0.012,
    tilt = 0.55,
    seed = 731,
    colors,
    bands,
    opacity = 0.78,
}) => {
    const random = seededRandom(seed)
    const geometry = new THREE.BufferGeometry()
    const vertices = new Float32Array([
        -0.5, -0.28, 0,
        0.5, -0.18, 0,
        -0.08, 0.55, 0,
    ])

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))
    geometry.computeVertexNormals()

    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.88,
        metalness: 0,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        flatShading: true,
        depthWrite: false,
    })

    const debris = new THREE.InstancedMesh(geometry, material, count)
    debris.name = name
    debris.instanceMatrix.setUsage(THREE.StaticDrawUsage)

    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const rotation = new THREE.Euler()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const color = new THREE.Color()

    for (let index = 0; index < count; index += 1) {
        const band = pickRingBand(bands, random)
        const bandInner = band?.innerRadius ?? innerRadius
        const bandOuter = band?.outerRadius ?? outerRadius
        const radius = THREE.MathUtils.lerp(bandInner, bandOuter, random())
        const angle = random() * Math.PI * 2
        const radiusX = radius * width
        const radiusY = radius * height

        position.set(
            Math.cos(angle) * radiusX,
            Math.sin(angle) * radiusY,
            (random() - 0.5) * verticalSpread
        )

        rotation.set(
            (random() - 0.5) * tilt,
            (random() - 0.5) * tilt,
            angle + random() * Math.PI
        )
        quaternion.setFromEuler(rotation)

        const size = THREE.MathUtils.lerp(
            band?.sizeMin ?? sizeMin,
            band?.sizeMax ?? sizeMax,
            random()
        )
        const stretch = THREE.MathUtils.lerp(0.55, 1.85, random())
        scale.set(size * stretch, size, size)

        matrix.compose(position, quaternion, scale)
        debris.setMatrixAt(index, matrix)

        color.copy(colorFromPalette(band?.colors ?? colors, random))
        color.multiplyScalar(THREE.MathUtils.lerp(0.45, 1.2, random()))
        debris.setColorAt(index, color)
    }

    debris.instanceMatrix.needsUpdate = true
    if (debris.instanceColor) {
        debris.instanceColor.needsUpdate = true
    }
    debris.frustumCulled = false
    debris.visible = false

    return debris
}

export const createRingShadowShell = ({
    name = "Ring Shadow",
    radius = 1,
    rotX = 90,
    rotY = 0,
    rotZ = 0,
    opacity = 0.22,
    width = 0.08,
    softness = 0.12,
    color = 0x050403,
    segments = 96,
}) => {
    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.FrontSide,
        uniforms: {
            shadowColor: { value: new THREE.Color(color) },
            opacity: { value: opacity },
            width: { value: width },
            softness: { value: softness },
            sunWorldPosition: { value: new THREE.Vector3(0, 0, 0) },
        },
        vertexShader: `
            varying vec3 vLocalPosition;
            varying vec3 vWorldPosition;
            varying vec3 vWorldNormal;

            void main() {
                vLocalPosition = position;
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 shadowColor;
            uniform float opacity;
            uniform float width;
            uniform float softness;
            uniform vec3 sunWorldPosition;

            varying vec3 vLocalPosition;
            varying vec3 vWorldPosition;
            varying vec3 vWorldNormal;

            void main() {
                float normalizedY = abs(normalize(vLocalPosition).y);
                float band = 1.0 - smoothstep(width, width + softness, normalizedY);
                vec3 toSun = normalize(sunWorldPosition - vWorldPosition);
                float litSide = smoothstep(-0.2, 0.65, dot(normalize(vWorldNormal), toSun));
                float alpha = band * litSide * opacity;

                if (alpha < 0.002) discard;

                gl_FragColor = vec4(shadowColor, alpha);
            }
        `,
    })

    const shell = new THREE.Mesh(
        new THREE.SphereGeometry(radius, segments, segments),
        material
    )

    shell.name = name
    shell.rotation.set(
        THREE.MathUtils.degToRad(rotX || 0),
        THREE.MathUtils.degToRad(rotY || 0),
        THREE.MathUtils.degToRad(rotZ || 0)
    )
    shell.renderOrder = 4
    shell.visible = false

    return shell
}
