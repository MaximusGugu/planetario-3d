import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"

export const createPostProcessing = ({
    renderer,
    scene,
    camera,
    container,
    config,
    grainShader,
}) => {
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(container.offsetWidth, container.offsetHeight),
        config.bloomStrength ?? 0.55,
        config.bloomRadius ?? 0.65,
        config.bloomThreshold ?? 0.04
    )
    bloomPass.renderToScreen = false
    composer.addPass(bloomPass)

    const grainPass = new ShaderPass(grainShader)
    composer.addPass(grainPass)
    composer.addPass(new OutputPass())

    return { composer, bloomPass, grainPass }
}
