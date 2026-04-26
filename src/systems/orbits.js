import * as THREE from "three"

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
