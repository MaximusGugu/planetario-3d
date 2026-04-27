import { useEffect, useRef, useState } from "react"
import { Frame } from "./HelmetHUD.jsx"
import { bottomHUDBarStyle } from "../ui/bottomNavigation.jsx" // ajuste o path

export const GALILEAN_OBSERVATIONS = [
    {
        label: "7 Jan 1610",
        moons: [
            { name: "IO", x: -6 },
            { name: "Europa", x: -6 },
            { name: "Ganymede", x: 10 },
            { name: "Callisto", x: 22 },
        ],
    },
    {
        label: "8 Jan 1610",
        moons: [
            { name: "IO", x: -8 },
            { name: "Europa", x: -3 },
            { name: "Ganymede", x: 12 },
            { name: "Callisto", x: 26 },
        ],
    },
    {
        label: "10 Jan 1610",
        moons: [
            { name: "IO", x: 2 },
            { name: "Europa", x: -10 },
            { name: "Ganymede", x: 14 },
            { name: "Callisto", x: 24 },
        ],
    },
    {
        label: "12 Jan 1610",
        moons: [
            { name: "IO", x: 6 },
            { name: "Europa", x: -6 },
            { name: "Ganymede", x: -16 },
            { name: "Callisto", x: 25 },
        ],
    },
    {
        label: "15 Jan 1610",
        moons: [
            { name: "IO", x: -4 },
            { name: "Europa", x: 8 },
            { name: "Ganymede", x: 16 },
            { name: "Callisto", x: -24 },
        ],
    },
    {
        label: "17 Jan 1610",
        moons: [
            { name: "IO", x: 4 },
            { name: "Europa", x: -9 },
            { name: "Ganymede", x: 15 },
            { name: "Callisto", x: 26 },
        ],
    },
]

const MOON_OBJECT_NAMES = {
    IO: "IO",
    Europa: "Europa",
    Ganymede: "Ganymede",
    Callisto: "Callisto",
}

const MOON_SCALES = {
    IO: 6,
    Europa: 5.5,
    Ganymede: 7.5,
    Callisto: 7,
}

const buildGalileanScene = (observation, index, scene = {}) => ({
    id: `galilean-${index + 1}`,
    type: "featureScene",
    name: observation.label,
    background: {
        starTravel: false,
        hudGrid: false,
    },
    hideStarTravel: true,
    hideNavigation: true,
    hideLabels: true,
    camera: scene.camera || {
        position: [0, 5, 36],
        target: [0, 0, 0],
        distance: 25,
    },
    objects: [
        {
            objectName: scene.planetObjectName || "Jupiter",
            enabled: true,
            x: 0,
            y: 0,
            z: 0,
            scale: 1,
            rotX: 0,
            rotY: 0,
            rotZ: 0,
            includeChildren: false,
            materialColor: 0xffffff,
        },
        ...observation.moons.map((moon) => ({
            objectName:
                scene.moonObjectNames?.[moon.name] ||
                MOON_OBJECT_NAMES[moon.name] ||
                moon.name,
            enabled: true,
            x: moon.x,
            y: 0,
            z: 0,
            scale: scene.moonScales?.[moon.name] || MOON_SCALES[moon.name] || 6,
            materialColor: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.12,
            includeChildren: false,
        })),
    ],
})

const shellStyle = {
    position: "absolute",
    inset: 0,
    zIndex: 9500,
    pointerEvents: "auto",
    color: "white",
    fontFamily: "'General Sans', Inter, system-ui, sans-serif",
    overflow: "hidden",
}

const vignetteStyle = {
    position: "absolute",
    inset: 0,
    background:
        "radial-gradient(circle at 50% 44%, transparent 0%, rgba(0,0,0,0.16) 45%, rgba(0,0,0,0.78) 100%)",
    pointerEvents: "none",
}

const infoStyle = {
    position: "absolute",
    left: "5.6vw",
    bottom: "12vh",
    width: "min(330px, 26vw)",
    textShadow: "0 2px 14px rgba(0,0,0,0.95)",
}

const eyebrowStyle = {
    display: "block",
    marginBottom: 8,
    fontSize: 8,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(223,136,69,0.9)",
}

const titleStyle = {
    margin: "0 0 10px",
    fontFamily: "'Denton Text', serif",
    fontStyle: "italic",
    fontSize: "clamp(24px, 2.6vw, 42px)",
    lineHeight: 0.95,
    color: "#df8845",
}

const bodyStyle = {
    margin: 0,
    maxWidth: 315,
    fontSize: "clamp(10px, 0.72vw, 12px)",
    lineHeight: 1.45,
    fontWeight: 700,
}

const observationLabelStyle = {
    position: "absolute",
    left: "50%",
    top: "15vh",
    transform: "translateX(-50%)",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.72)",
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
}

const controlsStyle = {
    position: "absolute",
    left: "50%",
    bottom: 40,
    transform: "translateX(-50%)",
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "10px 18px",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 999,
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 0 18px rgba(255,255,255,0.06)",
}

const roundButtonStyle = {
    minWidth: 92,
    height: 44,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.88)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    cursor: "pointer",
    backdropFilter: "blur(12px)",
    boxShadow: "0 0 18px rgba(255,255,255,0.07)",
    fontFamily: "'General Sans', Inter, system-ui, sans-serif",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
}

const closeButtonStyle = {
    position: "absolute",
    right: "5vw",
    top: "7.6vh",
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.88)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    backdropFilter: "blur(12px)",
    boxShadow: "0 0 18px rgba(255,255,255,0.07)",
    fontSize: 12,
}

const indexStyle = {
    minWidth: 52,
    textAlign: "center",
    fontSize: 9,
    fontWeight: 850,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.62)",
}

const ArrowIcon = ({ direction = 1 }) => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: direction < 0 ? "scaleX(-1)" : undefined }}
        aria-hidden="true"
    >
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 4v6h-6" />
    </svg>
)

export default function GalileanMoons({
    observations = GALILEAN_OBSERVATIONS,
    scene = {},
    onClose,
    onStartFeatureScene,
    onUpdateFeatureScene,
    onStopFeatureScene,
}) {
    const [observationIndex, setObservationIndex] = useState(0)
    const hasStartedSceneRef = useRef(false)
    const callbacksRef = useRef({
        onStartFeatureScene,
        onUpdateFeatureScene,
        onStopFeatureScene,
        onClose,
    })
    const observation = observations[observationIndex]

    useEffect(() => {
        callbacksRef.current = {
            onStartFeatureScene,
            onUpdateFeatureScene,
            onStopFeatureScene,
            onClose,
        }
    })

    useEffect(() => {
        if (!observation) return

        const sceneConfig = buildGalileanScene(
            observation,
            observationIndex,
            scene
        )
        const callbacks = callbacksRef.current

        if (!hasStartedSceneRef.current) {
            callbacks.onStartFeatureScene?.(sceneConfig)
            hasStartedSceneRef.current = true
        } else {
            callbacks.onUpdateFeatureScene?.(sceneConfig)
        }
    }, [observation, observationIndex, scene])

    const goToObservation = (direction) => {
        setObservationIndex((current) => {
            const next =
                (current + direction + observations.length) %
                observations.length
            return next
        })
    }

    const close = () => {
        const callbacks = callbacksRef.current

        callbacks.onStopFeatureScene?.("Jupiter")
        callbacks.onClose?.()
    }

    return (
        <section style={shellStyle} aria-label="Simulacao das luas galileanas">
            <Frame showGrid={false} />
            <div style={vignetteStyle} />
            <button
                type="button"
                style={closeButtonStyle}
                aria-label="Voltar para o HUD de Jupiter"
                onClick={close}
            >
                x
            </button>

            <span style={observationLabelStyle}>{observation.label}</span>

            <div style={infoStyle}>
                <span style={eyebrowStyle}>Observacoes de Galileu</span>
                <h2 style={titleStyle}>Luas galileanas</h2>
                <p style={bodyStyle}>
                    Galileu observou pequenos pontos luminosos mudando de
                    posicao ao redor de Jupiter. Ao comparar noites diferentes,
                    percebeu que aqueles pontos nao eram estrelas fixas: eram
                    luas orbitando o planeta.
                </p>
            </div>

            <div style={bottomHUDBarStyle} aria-label="Alternar observacoes">
                <button
                    type="button"
                    style={roundButtonStyle}
                    aria-label="Observacao anterior"
                    onClick={() => goToObservation(-1)}
                >
                    <ArrowIcon direction={-1} />
                    Anterior
                </button>
                <button
                    type="button"
                    style={roundButtonStyle}
                    aria-label="Voltar para Jupiter"
                    onClick={close}
                >
                    Voltar
                </button>
                <span style={indexStyle}>
                    {observationIndex + 1}/{observations.length}
                </span>
                <button
                    type="button"
                    style={roundButtonStyle}
                    aria-label="Proxima observacao"
                    onClick={() => goToObservation(1)}
                >
                    Proxima
                    <ArrowIcon />
                </button>
            </div>
        </section>
    )
}
