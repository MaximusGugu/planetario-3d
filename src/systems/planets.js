import * as THREE from "three"

export const createSphere = ({
    name,
    textureUrl,
    bumpMapUrl,
    bumpScale = 0,
    roughnessMapUrl,
    metalnessMapUrl,
    emissiveMapUrl,
    emissiveIntensity = 1,
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
    const bumpMap = bumpMapUrl ? loadTexture(bumpMapUrl) : null
    const roughnessMap = roughnessMapUrl ? loadTexture(roughnessMapUrl) : null
    const metalnessMap = metalnessMapUrl ? loadTexture(metalnessMapUrl) : null
    const emissiveMap = emissiveMapUrl ? loadTexture(emissiveMapUrl) : null

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
            bumpMap: bumpMap,
            bumpScale: bumpScale,
            roughnessMap: roughnessMap,
            metalnessMap: metalnessMap,
            emissiveMap: emissiveMap,
            emissive: emissiveMap ? 0xffffff : emissive,
            emissiveIntensity: emissiveMap ? emissiveIntensity : 0,
            color: texture ? 0xffffff : color,
            roughness: config.planetRoughness ?? 1,
            metalness: metalnessMap ? 1 : 0,
            side: THREE.FrontSide,
        })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = name
    mesh.userData.baseRadius = radius
    mesh.position.set(position[0], position[1], position[2])

    return mesh
}
export const createEarth = ({
    radius,
    position,
    loadTexture,
    config,
}) => {
    const group = new THREE.Group()

    // 1. Superfície da Terra (ShaderMaterial)
    const earthGeometry = new THREE.SphereGeometry(radius, 128, 128)
    const earthMaterial = new THREE.ShaderMaterial({
        uniforms: {
            dayTexture: { value: loadTexture(config.earthDayTexture) },
            nightTexture: { value: loadTexture(config.earthNightTexture) },
            specularMap: { value: loadTexture(config.earthSpecularTexture) },
            bumpMap: { value: loadTexture(config.earthHeightTexture) },
            sunDirection: { value: new THREE.Vector3(1, 0, 0) },
            bumpScale: { value: config.earthBumpScale ?? 0.05 },
            nightIntensity: { value: config.earthNightIntensity ?? 1.4 },
            specularIntensity: { value: config.earthSpecularIntensity ?? 0.8 },
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D dayTexture;
            uniform sampler2D nightTexture;
            uniform sampler2D specularMap;
            uniform sampler2D bumpMap;
            uniform vec3 sunDirection;
            uniform float bumpScale;
            uniform float nightIntensity;
            uniform float specularIntensity;

            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(-vPosition);
                
                // Iluminação
                float light = dot(normal, normalize(sunDirection));
                float dayFactor = smoothstep(-0.2, 0.5, light);
                
                vec3 dayColor = texture2D(dayTexture, vUv).rgb;
                vec3 nightColor = texture2D(nightTexture, vUv).rgb;
                
                // Mix Dia/Noite
                vec3 color = mix(nightColor, dayColor, dayFactor);
                
                // Luzes da Cidade (Brilham no lado escuro)
                float nightMask = 1.0 - dayFactor;
                // Tint amarelado/âmbar para as luzes
                vec3 amberColor = vec3(1.0, 0.7, 0.3);
                color += (nightColor * amberColor) * nightMask * nightIntensity;
                
                // Reflexo Especular (Oceanos)
                float specMask = texture2D(specularMap, vUv).r;
                vec3 reflectDir = reflect(-normalize(sunDirection), normal);
                float spec = pow(max(dot(reflectDir, viewDir), 0.0), 32.0);
                color += spec * specMask * specularIntensity;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    })

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial)
    earthMesh.name = "Earth_Surface"
    earthMesh.userData.baseRadius = radius // CRUCIAL para o sistema de zoom/HUD
    group.add(earthMesh)

    // 2. Nuvens (ShaderMaterial para sumirem à noite)
    const cloudGeometry = new THREE.SphereGeometry(radius * 1.01, 96, 96)
    const cloudMaterial = new THREE.ShaderMaterial({
        uniforms: {
            cloudTexture: { value: loadTexture(config.earthCloudsTexture) },
            sunDirection: { value: new THREE.Vector3(1, 0, 0) },
            opacity: { value: config.earthCloudsOpacity ?? 0.8 },
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D cloudTexture;
            uniform vec3 sunDirection;
            uniform float opacity;
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
                vec4 texColor = texture2D(cloudTexture, vUv);
                float light = dot(vNormal, normalize(sunDirection));
                float cloudFactor = smoothstep(-0.2, 0.3, light);
                gl_FragColor = vec4(texColor.rgb, texColor.a * opacity * cloudFactor);
            }
        `,
        transparent: true,
        depthWrite: false,
    })
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial)
    cloudMesh.name = "Earth_Clouds"
    group.add(cloudMesh)

    /* // 3. Atmosfera (Fresnel Ultra-Suave)
    const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.03, 96, 96)
    const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(config.earthAtmosphereColor ?? 0x3388ff) },
            intensity: { value: config.earthAtmosphereIntensity ?? 0.25 },
            power: { value: config.earthAtmospherePower ?? 2.0 },
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform float intensity;
            uniform float power;
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vec3 viewDir = normalize(-vPosition);
                float glow = pow(1.0 - dot(vNormal, viewDir), power);
                gl_FragColor = vec4(color, glow * intensity);
            }
        `,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false, // Nunca bloqueia a Terra
    })
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    atmosphereMesh.name = "Earth_Atmosphere"
    group.add(atmosphereMesh) */

    // 3. Atmosfera (Fresnel suave / camada externa)

    const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.09, 128, 128)

    const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
            colorInner: {
                value: new THREE.Color(config.earthAtmosphereInnerColor ?? 0x9fd8ff),
            },
            colorOuter: {
                value: new THREE.Color(config.earthAtmosphereOuterColor ?? 0x2f7cff),
            },
            intensity: {
                value: config.earthAtmosphereIntensity ?? 0.42,
            },
            power: {
                value: config.earthAtmospherePower ?? 2.4,
            },
            falloff: {
                value: config.earthAtmosphereFalloff ?? 0.08,
            },
            sunDirection: {
                value: new THREE.Vector3(1, 0.15, 0.35).normalize(),
            },
        },
        vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
            vNormal = normalize(normalMatrix * normal);

            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;

            vWorldNormal = normalize(mat3(modelMatrix) * normal);

            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
        fragmentShader: `
        uniform vec3 colorInner;
        uniform vec3 colorOuter;
        uniform float intensity;
        uniform float power;
        uniform float falloff;
        uniform vec3 sunDirection;

        varying vec3 vNormal;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            vec3 normal = normalize(vWorldNormal);
            vec3 sunDir = normalize(sunDirection);

            float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);

            // borda suave, sem corte duro
            float glow = smoothstep(falloff, 1.0, fresnel);
            glow = pow(glow, power);

            // iluminação solar: some na sombra
            float sunLight = dot(normal, sunDir);
            float lightFactor = smoothstep(-0.22, 0.55, sunLight);

            // terminador azulado suave, não corte seco
            float terminatorGlow = smoothstep(-0.35, 0.15, sunLight) * 0.25;

            float finalAlpha = glow * intensity * max(lightFactor, terminatorGlow);

            vec3 atmosphereColor = mix(colorInner, colorOuter, glow);

            gl_FragColor = vec4(atmosphereColor, finalAlpha);
        }
    `,
        side: THREE.FrontSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
    })

    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    atmosphereMesh.name = "Earth_Atmosphere"
    group.add(atmosphereMesh)

    group.position.set(position[0], position[1], position[2])

    return {
        root: group,
        surface: earthMesh,
        clouds: cloudMesh,
        atmosphere: atmosphereMesh,
    }
}
