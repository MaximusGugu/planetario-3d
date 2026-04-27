import { useEffect, useState } from "react"
import { HelmetHUD, hudTitleStyle } from "./HelmetHUD.jsx"
import GalileanMoons from "./GalileanMoons.jsx"
import TextType from "../components/TextType.jsx"

const jupiterFeatures = [
    {
        id: "jupiter-great-red-spot",
        label: "STORM",
        title: "Grande Mancha Vermelha",
        value: "vórtice colossal",
        code: "STORM LOCK",
        description:
            "A Grande Mancha Vermelha é uma tempestade anticiclônica gigantesca. No HUD, ela funciona como o alvo principal: um ponto de travamento visual para aproximar a câmera e analisar a dinâmica atmosférica.",
    },
    {
        id: "jupiter-bands",
        label: "BANDS",
        title: "Cinturões e zonas",
        value: "jatos opostos",
        code: "ATMOSPHERIC STRIPING",
        description:
            "As faixas de Júpiter são corredores atmosféricos em movimento. Zonas claras e cinturões escuros giram em velocidades diferentes, criando turbulência, redemoinhos e padrões que mudam com o tempo.",
    },
    {
        id: "jupiter-magnetosphere",
        label: "MAGNETO",
        title: "Magnetosfera colossal",
        value: "campo extremo",
        code: "MAGNETIC FIELD ARRAY",
        description:
            "Júpiter possui a maior e mais poderosa magnetosfera planetária do Sistema Solar. Esse campo cria auroras intensas e influencia partículas, luas e regiões muito além do planeta visível.",
    },
    {
        id: "jupiter-galilean-moons",
        label: "MOONS",
        title: "Sistema galileano",
        value: "Io · Europa · Ganimedes · Calisto",
        code: "ORBITAL FAMILY",
        description:
            "As quatro luas galileanas transformam Júpiter em um sistema próprio: Io é vulcânica, Europa pode esconder oceano, Ganimedes tem campo magnético e Calisto preserva uma superfície antiga.",
    },
    {
        id: "jupiter-interior",
        label: "CORE",
        title: "Interior profundo",
        value: "hidrogênio metálico",
        code: "DEEP PRESSURE READ",
        description:
            "Abaixo das nuvens, a pressão cresce até transformar o hidrogênio em um estado exótico. O interior de Júpiter ajuda a explicar sua energia interna, sua rotação e seu campo magnético gigantesco.",
    },
]

const accordionItems = [
    {
        title: "A Grande Mancha Vermelha",
        feature: "jupiter-great-red-spot",
        content:
            "A Grande Mancha Vermelha é o principal marco visual de Júpiter. Ao abrir este módulo, a câmera pode travar a região da tempestade e transformar o planeta em uma leitura atmosférica de escala colossal.",
    },
    {
        title: "Bandas atmosféricas",
        feature: "jupiter-bands",
        content:
            "Júpiter é coberto por zonas claras e cinturões escuros. Essas faixas são correntes de vento em direções opostas, formando uma atmosfera listrada, turbulenta e em constante reorganização.",
    },
    {
        title: "Magnetosfera",
        feature: "jupiter-magnetosphere",
        content:
            "O campo magnético de Júpiter é imenso. Ele prende partículas carregadas, gera auroras poderosas e cria uma região de influência que faz o planeta parecer uma máquina eletromagnética.",
    },
    {
        title: "Luas galileanas",
        feature: "jupiter-galilean-moons",
        content:
            "Io, Europa, Ganimedes e Calisto funcionam como quatro mundos de uma mini enciclopédia orbital: vulcões, oceanos ocultos, gelo, rocha, crateras e campos magnéticos.",
    },
    {
        title: "Interior de pressão extrema",
        feature: "jupiter-interior",
        content:
            "Júpiter não tem superfície sólida definida. A descida atravessaria nuvens, gases comprimidos e camadas de hidrogênio sob pressão extrema, até regiões onde a matéria se comporta de forma incomum.",
    },
]

const jupiterInteractions = {
    greatRedSpot: {
        id: "jupiter-great-red-spot",
        type: "focus",
        trigger: "accordion",
        bodyName: "Jupiter",
        overlay: "jupiter-great-red-spot",
        target: {
            body: "Jupiter",
            frame: "bodyLocal",
            textureU: 0.365,
            textureV: 0.625,
            surfaceOffset: 0.98,
        },
        camera: {
            body: "Jupiter",
            frame: "surfaceNormal",
            viewportHeight: 1.38,
            lockPosition: true,
            allowLookAround: true,
            allowZoom: false,
            allowPan: false,
        },
        motion: {
            rotationY: -124,
            turnSpeed: 0.08,
        },
    },
    galileanMoons: {
        id: "jupiter-galilean-moons",
        type: "featureSceneSet",
        trigger: "hudButton",
        scene: {
            camera: {
                position: [0, 5, 36],
                target: [0, 0, 0],
                distance: 25,
            },
            planetObjectName: "Jupiter",
            moonObjectNames: {
                IO: "IO",
                Europa: "Europa",
                Ganymede: "Ganymede",
                Callisto: "Callisto",
            },
            moonScales: {
                IO: 6,
                Europa: 5.5,
                Ganymede: 7.5,
                Callisto: 7,
            },
        },
        observations: [
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
        ],
    },
}

const factChips = [
    ["TIPO", "Gigante gasoso"],
    ["DIST.", "5.2 UA"],
    ["RAIO", "69.911 km"],
    ["DIA", "9h 56m"],
    ["MASSA", "318 Terras"],
    ["LUAS", "95+"],
]

const jupiterTitleStyle = {
    ...hudTitleStyle,
    margin: 0,
    lineHeight: 1.05,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
}

const jupiterTitleMetaStyle = {
    display: "block",
    marginTop: 8,
    fontSize: "0.56em",
    fontStyle: "italic",
    letterSpacing: "0.04em",
    textTransform: "none",
    opacity: 0.9,
}

const titleShellStyle = {
    display: "grid",
    gap: 16,
}

const jupiterLeftArticleStyle = {
    justifyContent: "flex-start",
    gap: 18,
    alignItems: "flex-start",
    maxWidth: "100%",
    width: "100%",
}

const jupiterBodySlotStyle = {
    maxWidth: "100%",
    width: "100%",
}

const jupiterContentStyle = {
    gridTemplateColumns: "minmax(240px, 40%) minmax(220px, 28vw)",
}

const simulationButtonStyle = {
    pointerEvents: "auto",
    border: "1px solid rgba(223,136,69,0.72)",
    borderLeft: "2px solid rgba(223,136,69,0.9)",
    background:
        "linear-gradient(90deg, rgba(223,136,69,0.18), rgba(255,255,255,0.04))",
    color: "rgba(255,255,255,0.94)",
    padding: "10px 13px",
    margin: "0 0 18px",
    cursor: "pointer",
    fontFamily: "'General Sans', sans-serif",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    boxShadow: "0 0 18px rgba(223,136,69,0.12)",
}

const commandBarStyle = {
    display: "grid",
    gap: 8,
    maxWidth: 520,
    padding: "10px 0",
    borderTop: "1px solid rgba(223,136,69,0.28)",
    borderBottom: "1px solid rgba(223,136,69,0.18)",
    fontFamily: "'General Sans', sans-serif",
}

const commandTopLineStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 9,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(223,136,69,0.9)",
}

const commandBottomLineStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 64px",
    gap: 10,
    alignItems: "center",
}

const signalTrackStyle = {
    height: 4,
    background:
        "linear-gradient(90deg, rgba(223,136,69,0.15), rgba(223,136,69,0.8), rgba(255,220,170,0.3))",
    boxShadow: "0 0 14px rgba(223,136,69,0.22)",
}

const signalValueStyle = {
    fontSize: 10,
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
}

const chipGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    maxWidth: 520,
}

const chipStyle = {
    border: "1px solid rgba(255,255,255,0.18)",
    borderLeft: "2px solid rgba(223,136,69,0.72)",
    background: "rgba(8,10,14,0.34)",
    boxShadow: "0 0 18px rgba(223,136,69,0.08)",
    padding: "7px 9px",
    fontFamily: "'General Sans', sans-serif",
}

const chipLabelStyle = {
    display: "block",
    marginBottom: 3,
    fontSize: 9,
    lineHeight: 1,
    letterSpacing: "0.16em",
    color: "rgba(255,255,255,0.46)",
}

const chipValueStyle = {
    display: "block",
    fontSize: "clamp(10px, 0.72vw, 12px)",
    lineHeight: 1.15,
    fontWeight: 750,
    color: "rgba(255,255,255,0.94)",
}

const featureGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    maxWidth: 520,
}

const featureButtonStyle = {
    display: "grid",
    gap: 4,
    padding: "9px 10px",
    textAlign: "left",
    border: "1px solid rgba(255,255,255,0.16)",
    borderLeft: "2px solid rgba(223,136,69,0.72)",
    background: "rgba(8,10,14,0.34)",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontFamily: "'General Sans', sans-serif",
}

const featureButtonActiveStyle = {
    borderColor: "rgba(223,136,69,0.8)",
    background: "rgba(223,136,69,0.16)",
    boxShadow: "0 0 22px rgba(223,136,69,0.16)",
}

const featureLabelStyle = {
    fontSize: 9,
    letterSpacing: "0.16em",
    color: "rgba(255,255,255,0.46)",
}

const featureTitleStyle = {
    fontSize: "clamp(11px, 0.78vw, 13px)",
    fontWeight: 760,
    lineHeight: 1.1,
}

const featureValueStyle = {
    fontSize: 10,
    color: "rgba(255,255,255,0.58)",
}

const briefingStyle = {
    display: "grid",
    gap: 16,
    width: "100%",
    maxWidth: 760,
}

const introStyle = {
    display: "block",
    maxWidth: 760,
}

const telemetryStyle = {
    display: "grid",
    gap: 7,
    marginTop: 2,
    fontFamily: "'General Sans', sans-serif",
}

const telemetryRowStyle = {
    display: "grid",
    gridTemplateColumns: "128px minmax(0, 1fr)",
    gap: 12,
    alignItems: "baseline",
    paddingTop: 7,
    borderTop: "1px solid rgba(255,255,255,0.14)",
}

const telemetryLabelStyle = {
    fontSize: 9,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
}

const telemetryValueStyle = {
    fontSize: "clamp(11px, 0.8vw, 13px)",
    color: "rgba(255,255,255,0.9)",
}

const overlayShellStyle = {
    position: "absolute",
    right: "5vw",
    top: "9vh",
    width: "min(390px, 28vw)",
    minWidth: 300,
    pointerEvents: "none",
    fontFamily: "'General Sans', sans-serif",
    color: "rgba(255,255,255,0.92)",
    textShadow: "0 2px 14px rgba(0,0,0,0.9)",
}

const overlayPanelStyle = {
    borderTop: "1px solid rgba(255,255,255,0.52)",
    borderBottom: "1px solid rgba(255,255,255,0.18)",
    padding: "12px 0 14px",
    background:
        "linear-gradient(90deg, rgba(223,136,69,0.16), rgba(6,8,12,0.02))",
}

const overlayCodeStyle = {
    marginBottom: 8,
    fontSize: 9,
    letterSpacing: "0.18em",
    color: "rgba(223,136,69,0.94)",
}

const overlayTitleStyle = {
    margin: "0 0 4px",
    fontSize: "clamp(14px, 1vw, 18px)",
    lineHeight: 1.08,
    textTransform: "uppercase",
}

const overlayMetricStyle = {
    margin: "0 0 10px",
    fontSize: "clamp(10px, 0.72vw, 12px)",
    color: "rgba(255,255,255,0.62)",
}

const overlayBodyStyle = {
    margin: 0,
    maxWidth: 350,
    fontSize: "clamp(11px, 0.72vw, 13px)",
    lineHeight: 1.42,
}


const scannerLineStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 280,
    height: 1,
    transform: "translate(-50%, -50%) rotate(-10deg)",
    background:
        "linear-gradient(90deg, transparent, rgba(223,136,69,0.72), transparent)",
    boxShadow: "0 0 14px rgba(223,136,69,0.24)",
    pointerEvents: "none",
}

const magnetosphereShellStyle = {
    position: "absolute",
    right: "7vw",
    bottom: "7vh",
    width: 270,
    height: 220,
    pointerEvents: "none",
    fontFamily: "'General Sans', sans-serif",
}

const magnetosphereOrbitStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 240,
    height: 124,
    transform: "translate(-50%, -50%) rotate(-12deg)",
    border: "1px solid rgba(223,136,69,0.28)",
    borderRadius: "50%",
    boxShadow:
        "0 0 24px rgba(223,136,69,0.08), inset 0 0 22px rgba(223,136,69,0.04)",
}

const magnetosphereOrbitTwoStyle = {
    ...magnetosphereOrbitStyle,
    width: 192,
    height: 92,
    opacity: 0.76,
}

const magnetosphereCoreStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 54,
    height: 54,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "1px solid rgba(223,136,69,0.58)",
    background:
        "radial-gradient(circle at 34% 32%, rgba(255,230,190,0.32), rgba(223,136,69,0.18) 42%, rgba(35,18,10,0.18) 100%)",
    boxShadow:
        "0 0 22px rgba(223,136,69,0.18), inset 0 0 16px rgba(255,255,255,0.08)",
}

const magnetosphereTailStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 260,
    height: 1,
    transform: "translate(-50%, -50%)",
    background:
        "linear-gradient(90deg, rgba(223,136,69,0.58), rgba(223,136,69,0.12), transparent)",
}

const miniLabelStyle = {
    position: "absolute",
    left: 0,
    bottom: 0,
    fontSize: 9,
    letterSpacing: "0.16em",
    color: "rgba(255,255,255,0.58)",
    textTransform: "uppercase",
}

const moonSystemShellStyle = {
    position: "absolute",
    right: "6vw",
    bottom: "8vh",
    width: 280,
    height: 170,
    pointerEvents: "none",
    fontFamily: "'General Sans', sans-serif",
}

const moonOrbitLineStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 250,
    height: 1,
    transform: "translate(-50%, -50%)",
    background:
        "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
}

const moonCoreStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 46,
    height: 46,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "1px solid rgba(223,136,69,0.55)",
    background: "rgba(223,136,69,0.12)",
    boxShadow: "0 0 18px rgba(223,136,69,0.14)",
}

const moonDotBaseStyle = {
    position: "absolute",
    top: "50%",
    width: 9,
    height: 9,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.78)",
    boxShadow: "0 0 12px rgba(255,255,255,0.22)",
}

const pressureCoreShellStyle = {
    position: "absolute",
    right: "8vw",
    bottom: "8vh",
    width: 220,
    height: 220,
    borderRadius: "50%",
    border: "1px solid rgba(223,136,69,0.24)",
    boxShadow:
        "0 0 28px rgba(223,136,69,0.08), inset 0 0 30px rgba(223,136,69,0.04)",
    pointerEvents: "none",
}

const pressureRingStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 160,
    height: 160,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "1px solid rgba(223,136,69,0.25)",
}

const pressureRingTwoStyle = {
    ...pressureRingStyle,
    width: 98,
    height: 98,
    borderColor: "rgba(255,220,170,0.28)",
}

const pressureCoreDotStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 34,
    height: 34,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background:
        "radial-gradient(circle, rgba(255,220,170,0.55), rgba(223,136,69,0.2) 58%, transparent 100%)",
    boxShadow: "0 0 26px rgba(223,136,69,0.35)",
}

const JupiterTitle = () => (
    <div style={titleShellStyle}>
        <h1 style={jupiterTitleStyle}>
            JÚPITER
            <span style={jupiterTitleMetaStyle}>Ζεύς · Jupiter</span>
        </h1>

        <div style={commandBarStyle} aria-label="Comando visual de Júpiter">
            <div style={commandTopLineStyle}>
                <span>JOVIAN PRIME INTERFACE</span>
                <span>STATUS · DOMINANT</span>
            </div>
            <div style={commandBottomLineStyle}>
                <span style={signalTrackStyle} />
                <span style={signalValueStyle}>318M⊕</span>
            </div>
        </div>

        <div style={chipGridStyle} aria-label="Dados rápidos de Júpiter">
            {factChips.map(([label, value]) => (
                <span key={label} style={chipStyle}>
                    <span style={chipLabelStyle}>{label}</span>
                    <span style={chipValueStyle}>{value}</span>
                </span>
            ))}
        </div>
    </div>
)

const JupiterBriefing = () => (
    <div style={briefingStyle}>
        <TextType
            text={
                "Júpiter é o maioral: um planeta tão massivo que parece menos um mundo isolado e mais um sistema inteiro em torno de si. Atmosfera listrada, tempestades gigantes, luas complexas e um campo magnético colossal transformam sua presença em uma arquitetura planetária.\n\nNeste módulo, Júpiter é tratado como uma central de força do Sistema Solar externo: gravidade, magnetismo, rotação extrema e clima profundo operando ao mesmo tempo."
            }
            typingSpeed={20}
            pauseDuration={1500}
            loop={false}
            showCursor={true}
            cursorCharacter="▌"
            deletingSpeed={45}
            className="hud-content-typing"
            style={introStyle}
        />

        <div style={telemetryStyle} aria-label="Leituras de Júpiter">
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Classe</span>
                <span style={telemetryValueStyle}>Gigante gasoso dominante</span>
            </div>
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Composição</span>
                <span style={telemetryValueStyle}>Hidrogênio + hélio</span>
            </div>
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Assinatura</span>
                <span style={telemetryValueStyle}>
                    faixas, vórtices, luas e magnetosfera extrema
                </span>
            </div>
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Leitura visual</span>
                <span style={telemetryValueStyle}>
                    planeta-laboratório do Sistema Solar externo
                </span>
            </div>
        </div>
    </div>
)

const MagnetosphereMini = () => (
    <div style={magnetosphereShellStyle} aria-hidden="true">
        <span style={magnetosphereTailStyle} />
        <span style={magnetosphereOrbitStyle} />
        <span style={magnetosphereOrbitTwoStyle} />
        <span style={magnetosphereCoreStyle} />
        <span style={miniLabelStyle}>MAGNETOSPHERE · FIELD ARRAY</span>
    </div>
)

const MoonSystemMini = () => (
    <div style={moonSystemShellStyle} aria-hidden="true">
        <span style={moonOrbitLineStyle} />
        <span style={moonCoreStyle} />
        <span style={{ ...moonDotBaseStyle, left: "14%" }} />
        <span style={{ ...moonDotBaseStyle, left: "34%", width: 7, height: 7 }} />
        <span style={{ ...moonDotBaseStyle, left: "68%", width: 11, height: 11 }} />
        <span style={{ ...moonDotBaseStyle, left: "88%", width: 8, height: 8 }} />
        <span style={miniLabelStyle}>IO · EUROPA · GANYMEDE · CALLISTO</span>
    </div>
)

const PressureCoreMini = () => (
    <div style={pressureCoreShellStyle} aria-hidden="true">
        <span style={pressureRingStyle} />
        <span style={pressureRingTwoStyle} />
        <span style={pressureCoreDotStyle} />
        <span
            style={{
                ...miniLabelStyle,
                left: 0,
                bottom: -22,
            }}
        >
            DEEP CORE · METALLIC HYDROGEN
        </span>
    </div>
)

const JupiterFeatureOverlay = ({ feature }) => {
    const selected = jupiterFeatures.find((item) => item.id === feature)
    if (!selected) return null

    return (
        <>
            <div style={overlayShellStyle} aria-hidden="true">
                <div style={overlayPanelStyle}>
                    <div style={overlayCodeStyle}>{selected.code}</div>
                    <h2 style={overlayTitleStyle}>{selected.title}</h2>
                    <p style={overlayMetricStyle}>{selected.value}</p>
                    <p style={overlayBodyStyle}>{selected.description}</p>
                </div>
            </div>

           
            {feature === "jupiter-bands" && (
                <span style={scannerLineStyle} aria-hidden="true" />
            )}

            {feature === "jupiter-magnetosphere" && <MagnetosphereMini />}

            {feature === "jupiter-galilean-moons" && <MoonSystemMini />}

            {feature === "jupiter-interior" && <PressureCoreMini />}
        </>
    )
}

export default function JupiterHUD({
    onInteraction,
    onFeatureFocus,
    onZoomDelta,
    onStartFeatureScene,
    onUpdateFeatureScene,
    onStopFeatureScene,
    accordionResetKey,
}) {
    const [activeFeature, setActiveFeature] = useState("jupiter-great-red-spot")
    const [showGalileanMoons, setShowGalileanMoons] = useState(false)

    useEffect(() => {
        setActiveFeature(null)
    }, [accordionResetKey])

    const handleFeatureChange = (feature) => {
        setActiveFeature(feature)
        const interaction =
            feature === "jupiter-great-red-spot"
                ? jupiterInteractions.greatRedSpot
                : null
        if (onInteraction) {
            onInteraction(interaction)
        } else {
            onFeatureFocus?.(interaction ?? null)
        }
    }

    if (showGalileanMoons) {
        return (
            <GalileanMoons
                observations={jupiterInteractions.galileanMoons.observations}
                scene={jupiterInteractions.galileanMoons.scene}
                onClose={() => setShowGalileanMoons(false)}
                onStartFeatureScene={onStartFeatureScene}
                onUpdateFeatureScene={onUpdateFeatureScene}
                onStopFeatureScene={onStopFeatureScene}
            />
        )
    }

    return (
        <HelmetHUD
            title="Júpiter"
            accordionItems={accordionItems}
            accordionResetKey={accordionResetKey}
            titleComponent={<JupiterTitle />}
            overlayComponent={<JupiterFeatureOverlay feature={activeFeature} />}
            onZoomDelta={onZoomDelta}
            contentStyle={jupiterContentStyle}
            leftArticleStyle={jupiterLeftArticleStyle}
            bodyStyle={jupiterBodySlotStyle}
            renderAccordionContent={(item) =>
                item.feature === "jupiter-galilean-moons" ? (
                    <button
                        type="button"
                        style={simulationButtonStyle}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.stopPropagation()
                            setShowGalileanMoons(true)
                        }}
                    >
                        Veja a simulação
                    </button>
                ) : null
            }
            onAccordionChange={(item) => {
                const nextFeature = item?.feature ?? null
                setActiveFeature(nextFeature)
                const interaction =
                    nextFeature === "jupiter-great-red-spot"
                        ? jupiterInteractions.greatRedSpot
                        : null
                if (onInteraction) {
                    onInteraction(interaction)
                } else {
                    onFeatureFocus?.(interaction ?? null)
                }
            }}
        >
            <JupiterBriefing />
        </HelmetHUD>
    )
}

//hud jupiter animações
