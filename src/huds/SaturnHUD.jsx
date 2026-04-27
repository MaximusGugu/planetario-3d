import { useEffect, useState } from "react"
import { HelmetHUD, hudTitleStyle } from "./HelmetHUD.jsx"
import TextType from "../components/TextType.jsx"

const factChips = [
    ["TIPO", "Gigante gasoso"],
    ["DIST.", "9.5 UA"],
    ["RAIO", "58.232 km"],
    ["DIA", "10h 33m"],
    ["LUAS", "140+"],
]

const briefingRows = [
    ["Massa", "95 Terras"],
    ["Composição", "H2 + He"],
    ["Sistema de anéis", "o mais extenso e brilhante do sistema"],
]

const featurePanels = {
    atmosphere: {
        code: "ATMOSPHERIC FLOW",
        title: "Atmosfera dourada",
        metric: "ventos rápidos e camadas de nuvens",
        body: "Saturno possui faixas atmosféricas mais suaves que as de Júpiter, mas sua rotação rápida e seus ventos intensos criam uma dinâmica profunda sob o tom dourado visível.",
    },
    titan: {
        code: "MOON LOCK",
        title: "Titã",
        metric: "atmosfera densa e lagos de hidrocarbonetos",
        body: "Titã é uma das luas mais intrigantes do Sistema Solar. Sua atmosfera espessa e seus lagos de metano e etano fazem dela um mundo quase planetário, com clima, superfície e química próprios.",
    },
}

const accordionItems = [
    {
        title: "Sistema de anéis",
        feature: "rings",
        content:
            "Os anéis de Saturno são formados por gelo, poeira e fragmentos rochosos. Ao abrir este módulo, a leitura visual destaca a estrutura orbital que transforma Saturno em uma das silhuetas mais reconhecíveis do Sistema Solar.",
    },
    {
        title: "Atmosfera e rotação",
        feature: "atmosphere",
        content:
            "Saturno é formado principalmente por hidrogênio e hélio. Sua rotação rápida achata levemente o planeta nos polos e movimenta camadas atmosféricas em tons dourados, creme e amarelados.",
    },
    {
        title: "Titã e luas complexas",
        feature: "titan",
        content:
            "Titã possui atmosfera densa, clima ativo e lagos de hidrocarbonetos. Outras luas, como Encélado, também chamam atenção por jatos de gelo que sugerem a presença de um oceano subterrâneo.",
    },
]

const saturnInteractions = {
    rings: {
        id: "saturn-rings",
        type: "focus",
        trigger: "accordion",
        bodyName: "Saturn",
        overlay: "rings",
        target: {
            body: "Saturn",
            frame: "bodyPivot",
            offset: {
                right: 1.75,
                up: 0.05,
                radial: 0,
            },
        },
        camera: {
            body: "Saturn",
            frame: "bodyPivot",
            viewportHeight: 2.1,
            offset: {
                radial: 2,
                right: 0.58,
                up: 0.08,
            },
            lockPosition: true,
            allowLookAround: true,
            allowZoom: true,
            allowPan: false,
        },
    },
}

const saturnTitleStyle = {
    ...hudTitleStyle,
    margin: 0,
    lineHeight: 1.05,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
}

const saturnTitleMetaStyle = {
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

const chipGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    maxWidth: 360,
}

const chipStyle = {
    border: "1px solid rgba(255,255,255,0.2)",
    borderLeft: "2px solid rgba(236,196,120,0.72)",
    background: "rgba(8,10,14,0.34)",
    boxShadow: "0 0 18px rgba(236,196,120,0.08)",
    padding: "7px 9px",
    fontFamily: "'General Sans', sans-serif",
}

const chipLabelStyle = {
    display: "block",
    marginBottom: 3,
    fontSize: 9,
    lineHeight: 1,
    letterSpacing: "0.16em",
    color: "rgba(255,255,255,0.48)",
}

const chipValueStyle = {
    display: "block",
    fontSize: "clamp(10px, 0.72vw, 12px)",
    lineHeight: 1.15,
    fontWeight: 750,
    color: "rgba(255,255,255,0.94)",
}

const briefingStyle = {
    display: "grid",
    gap: 14,
    maxWidth: 440,
}

const introStyle = {
    display: "block",
    maxWidth: 430,
}

const rowGridStyle = {
    display: "grid",
    gap: 5,
    marginTop: 2,
}

const rowStyle = {
    display: "grid",
    gridTemplateColumns: "110px minmax(0, 1fr)",
    gap: 12,
    alignItems: "baseline",
    paddingTop: 6,
    borderTop: "1px solid rgba(255,255,255,0.14)",
    fontFamily: "'General Sans', sans-serif",
}

const rowLabelStyle = {
    fontSize: 9,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.52)",
}

const rowValueStyle = {
    fontSize: "clamp(11px, 0.8vw, 13px)",
    color: "rgba(255,255,255,0.9)",
}

const overlayShellStyle = {
    position: "absolute",
    left: "47%",
    top: "12%",
    width: "min(360px, 25vw)",
    minWidth: 280,
    pointerEvents: "none",
    fontFamily: "'General Sans', sans-serif",
    color: "rgba(255,255,255,0.92)",
    textShadow: "0 2px 14px rgba(0,0,0,0.9)",
}

const overlayPanelStyle = {
    borderTop: "1px solid rgba(255,255,255,0.5)",
    borderBottom: "1px solid rgba(255,255,255,0.18)",
    padding: "12px 0 14px",
    background:
        "linear-gradient(90deg, rgba(236,196,120,0.14), rgba(6,8,12,0.02))",
}

const overlayCodeStyle = {
    marginBottom: 8,
    fontSize: 9,
    letterSpacing: "0.18em",
    color: "rgba(236,196,120,0.94)",
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
    maxWidth: 320,
    fontSize: "clamp(11px, 0.72vw, 13px)",
    lineHeight: 1.42,
}

const ringReticleShellStyle = {
    position: "absolute",
    right: "5vw",
    top: "8vh",
    width: 260,
    height: 150,
    pointerEvents: "none",
    transform: "rotate(-14deg)",
}

const saturnCoreStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 52,
    height: 52,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "1px solid rgba(236,196,120,0.9)",
    background:
        "radial-gradient(circle at 35% 35%, rgba(255,230,180,0.22), rgba(236,196,120,0.08) 45%, rgba(0,0,0,0.12) 100%)",
    boxShadow:
        "0 0 18px rgba(236,196,120,0.16), inset 0 0 12px rgba(236,196,120,0.08)",
}

const ringBandOuterStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 220,
    height: 78,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "1px solid rgba(236,196,120,0.80)",
    boxShadow: "0 0 18px rgba(236,196,120,0.18)",
}

const ringBandMidStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 182,
    height: 60,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "1px solid rgba(236,196,120,0.58)",
}

const ringBandInnerStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 145,
    height: 46,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "1px solid rgba(236,196,120,0.38)",
}

const ringGapStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 198,
    height: 68,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "1px dashed rgba(255,255,255,0.16)",
    opacity: 0.45,
}

const ringScanLineStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 250,
    height: 1,
    transform: "translate(-50%, -50%)",
    background:
        "linear-gradient(90deg, transparent, rgba(236,196,120,0.85), transparent)",
    opacity: 0.7,
}

const SaturnTitle = () => (
    <div style={titleShellStyle}>
        <h1 style={saturnTitleStyle}>
            SATURNO
            <span style={saturnTitleMetaStyle}>Cronos · Saturn</span>
        </h1>
        <div style={chipGridStyle} aria-label="Dados rápidos de Saturno">
            {factChips.map(([label, value]) => (
                <span key={label} style={chipStyle}>
                    <span style={chipLabelStyle}>{label}</span>
                    <span style={chipValueStyle}>{value}</span>
                </span>
            ))}
        </div>
    </div>
)

const SaturnBriefing = () => (
    <div style={briefingStyle}>
        <TextType
            text={
                "Saturno é o gigante dos anéis: um planeta de atmosfera dourada, rotação rápida e presença visual inconfundível. Sua escala é definida não apenas pelo corpo gasoso, mas pelo enorme sistema de partículas que orbita ao seu redor.\n\nSem superfície sólida visível, Saturno é lido por camadas: nuvens suaves, ventos profundos, luas complexas e anéis que funcionam como uma arquitetura orbital em movimento."
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
        <div style={rowGridStyle} aria-label="Leituras de Saturno">
            {briefingRows.map(([label, value]) => (
                <div key={label} style={rowStyle}>
                    <span style={rowLabelStyle}>{label}</span>
                    <span style={rowValueStyle}>{value}</span>
                </div>
            ))}
        </div>
    </div>
)

const SaturnFeatureOverlay = ({ feature }) => {
    const panel = featurePanels[feature]
    if (!panel) return null

    return (
        <>
            {feature === "rings" && (
    <div style={ringReticleShellStyle} aria-hidden="true">
        <span style={ringBandOuterStyle} />
        <span style={ringGapStyle} />
        <span style={ringBandMidStyle} />
        <span style={ringBandInnerStyle} />
        <span style={ringScanLineStyle} />
        <span style={saturnCoreStyle} />
    </div>
)}
            <div style={overlayShellStyle} aria-hidden="true">
                <div style={overlayPanelStyle}>
                    <div style={overlayCodeStyle}>{panel.code}</div>
                    <h2 style={overlayTitleStyle}>{panel.title}</h2>
                    <p style={overlayMetricStyle}>{panel.metric}</p>
                    <p style={overlayBodyStyle}>{panel.body}</p>
                </div>
            </div>
        </>
    )
}

export default function SaturnHUD({
    onInteraction,
    onFeatureFocus,
    onZoomDelta,
    accordionResetKey,
}) {
    const [activeFeature, setActiveFeature] = useState(null)

    useEffect(() => {
        setActiveFeature(null)
    }, [accordionResetKey])

    return (
        <HelmetHUD
            title="Saturno"
            accordionItems={accordionItems}
            accordionResetKey={accordionResetKey}
            titleComponent={<SaturnTitle />}
            overlayComponent={<SaturnFeatureOverlay feature={activeFeature} />}
            onZoomDelta={onZoomDelta}
            onAccordionChange={(item) => {
                const nextFeature = item?.feature ?? null
                setActiveFeature(nextFeature)
                const interaction =
                    nextFeature === "rings"
                        ? saturnInteractions.rings
                        : null
                if (onInteraction) {
                    onInteraction(interaction)
                } else {
                    onFeatureFocus?.(interaction ?? null)
                }
            }}
        >
            <SaturnBriefing />
        </HelmetHUD>
    )
}

//saturno og
