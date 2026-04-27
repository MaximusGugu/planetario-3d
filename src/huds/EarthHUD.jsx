import { useState } from "react"
import { HelmetHUD, hudTitleStyle } from "./HelmetHUD.jsx"
import TextType from "../components/TextType.jsx"

const earthLayers = [
    {
        id: "earth-oceans",
        label: "HIDROSFERA",
        title: "Planeta oceano",
        value: "≈71% da superfície",
        description:
            "A Terra é lida primeiro pela água. Oceanos absorvem calor, movem correntes, regulam o clima e tornam o planeta visualmente azul quando visto do espaço.",
    },
    {
        id: "earth-atmosphere",
        label: "ATMOSFERA",
        title: "Filtro vivo",
        value: "N₂ + O₂ + vapor",
        description:
            "A atmosfera espalha a luz, protege contra radiação, distribui calor e sustenta ciclos climáticos. Nuvens revelam o planeta em movimento constante.",
    },
    {
        id: "earth-biosphere",
        label: "BIOSFERA",
        title: "Assinatura da vida",
        value: "única conhecida",
        description:
            "A vida altera a química do ar, dos oceanos e da superfície. A presença de oxigênio, vegetação e ciclos biológicos transforma a Terra em um planeta detectavelmente vivo.",
    },
    {
        id: "earth-night",
        label: "NOITE",
        title: "Civilização visível",
        value: "luzes artificiais",
        description:
            "No lado noturno, cidades e redes humanas aparecem como constelações artificiais. É uma camada recente da história planetária: tecnologia desenhada sobre geografia.",
    },
    {
        id: "earth-tectonics",
        label: "TECTÔNICA",
        title: "Superfície em reforma",
        value: "placas móveis",
        description:
            "A crosta terrestre é reciclada por placas tectônicas. Montanhas, vulcões, terremotos e oceanos são parte de um mecanismo interno que renova a superfície.",
    },
]

const accordionItems = [
    {
        title: "Hidrosfera",
        feature: "earth-oceans",
        content:
            "A água líquida cobre a maior parte da Terra e regula temperatura, clima e circulação global. Oceanos também funcionam como arquivo químico e térmico do planeta.",
    },
    {
        title: "Atmosfera ativa",
        feature: "earth-atmosphere",
        content:
            "A atmosfera terrestre não é apenas uma camada de gás: ela filtra radiação, forma nuvens, distribui calor e cria os padrões climáticos vistos do espaço.",
    },
    {
        title: "Biosfera",
        feature: "earth-biosphere",
        content:
            "A Terra é o único planeta conhecido com vida. A biosfera interfere na composição da atmosfera, na cor da superfície e nos ciclos químicos globais.",
    },
    {
        title: "Planeta humano",
        feature: "earth-night",
        content:
            "As luzes noturnas revelam uma camada artificial sobre o planeta. Cidades, rotas e redes elétricas tornam a civilização visível em escala orbital.",
    },
    {
        title: "Tectônica de placas",
        feature: "earth-tectonics",
        content:
            "A superfície da Terra está em transformação contínua. Placas tectônicas reciclam crosta, erguem montanhas, abrem oceanos e alimentam vulcões.",
    },
]

const earthTitleStyle = {
    ...hudTitleStyle,
    margin: 0,
    lineHeight: 1.05,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
}

const earthTitleMetaStyle = {
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

const planetBadgeStyle = {
    display: "inline-grid",
    width: 118,
    height: 118,
    placeItems: "center",
    borderRadius: "50%",
    border: "1px solid rgba(120,190,255,0.55)",
    background:
        "radial-gradient(circle at 36% 30%, rgba(255,255,255,0.24), rgba(65,150,220,0.24) 28%, rgba(30,84,130,0.2) 54%, rgba(4,12,22,0.12) 100%)",
    boxShadow:
        "0 0 26px rgba(90,170,255,0.18), inset 0 0 28px rgba(255,255,255,0.08)",
    fontFamily: "'General Sans', sans-serif",
    fontSize: 10,
    letterSpacing: "0.18em",
    color: "rgba(255,255,255,0.78)",
    textTransform: "uppercase",
}

const layerGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    maxWidth: 380,
}

const layerButtonStyle = {
    display: "grid",
    gap: 4,
    padding: "9px 10px",
    textAlign: "left",
    border: "1px solid rgba(255,255,255,0.16)",
    borderLeft: "2px solid rgba(120,190,255,0.72)",
    background: "rgba(8,12,18,0.34)",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontFamily: "'General Sans', sans-serif",
}

const layerButtonActiveStyle = {
    borderColor: "rgba(120,190,255,0.72)",
    background: "rgba(70,140,210,0.18)",
    boxShadow: "0 0 18px rgba(90,170,255,0.12)",
}

const layerLabelStyle = {
    fontSize: 9,
    letterSpacing: "0.16em",
    color: "rgba(255,255,255,0.46)",
}

const layerTitleStyle = {
    fontSize: "clamp(11px, 0.78vw, 13px)",
    fontWeight: 760,
    lineHeight: 1.1,
}

const layerValueStyle = {
    fontSize: 10,
    color: "rgba(255,255,255,0.58)",
}

const briefingStyle = {
    display: "grid",
    gap: 16,
    maxWidth: 460,
}

const introStyle = {
    display: "block",
    maxWidth: 440,
}

const telemetryStyle = {
    display: "grid",
    gap: 7,
    marginTop: 2,
    fontFamily: "'General Sans', sans-serif",
}

const telemetryRowStyle = {
    display: "grid",
    gridTemplateColumns: "118px minmax(0, 1fr)",
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
    top: "10vh",
    width: "min(380px, 28vw)",
    minWidth: 290,
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
        "linear-gradient(90deg, rgba(90,170,255,0.16), rgba(6,8,12,0.02))",
}

const overlayCodeStyle = {
    marginBottom: 8,
    fontSize: 9,
    letterSpacing: "0.18em",
    color: "rgba(120,190,255,0.94)",
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
    maxWidth: 340,
    fontSize: "clamp(11px, 0.72vw, 13px)",
    lineHeight: 1.42,
}

const orbitalMapStyle = {
    position: "absolute",
    right: "7vw",
    bottom: "10vh",
    width: 210,
    height: 210,
    borderRadius: "50%",
    border: "1px solid rgba(120,190,255,0.24)",
    boxShadow:
        "0 0 24px rgba(90,170,255,0.08), inset 0 0 30px rgba(90,170,255,0.04)",
    pointerEvents: "none",
}

const orbitalLineStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 270,
    height: 1,
    transform: "translate(-50%, -50%) rotate(-24deg)",
    background:
        "linear-gradient(90deg, transparent, rgba(120,190,255,0.56), transparent)",
}

const orbitalDotStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 10,
    height: 10,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: "rgba(160,210,255,0.92)",
    boxShadow: "0 0 18px rgba(120,190,255,0.55)",
}

const EarthTitle = ({ activeFeature, onSelectLayer }) => (
    <div style={titleShellStyle}>
        <h1 style={earthTitleStyle}>
            TERRA
            <span style={earthTitleMetaStyle}>Gaia · Earth</span>
        </h1>

        <div style={planetBadgeStyle} aria-hidden="true">
            LIVING WORLD
        </div>

        <div style={layerGridStyle} aria-label="Camadas interativas da Terra">
            {earthLayers.map((layer) => {
                const active = activeFeature === layer.id

                return (
                    <button
                        key={layer.id}
                        type="button"
                        style={{
                            ...layerButtonStyle,
                            ...(active ? layerButtonActiveStyle : null),
                        }}
                        onClick={() => onSelectLayer(layer.id)}
                    >
                        <span style={layerLabelStyle}>{layer.label}</span>
                        <span style={layerTitleStyle}>{layer.title}</span>
                        <span style={layerValueStyle}>{layer.value}</span>
                    </button>
                )
            })}
        </div>
    </div>
)

const EarthBriefing = () => (
    <div style={briefingStyle}>
        <TextType
            text={
                "A Terra não é apenas o terceiro planeta do Sistema Solar: é um sistema integrado. Oceanos, atmosfera, rochas, gelo, vida e atividade humana formam camadas que se influenciam o tempo todo.\n\nNesta leitura, o planeta é tratado como uma máquina viva: um mundo rochoso com água líquida estável, clima ativo, superfície reciclada e uma assinatura biológica observável do espaço."
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

        <div style={telemetryStyle} aria-label="Dados enciclopédicos da Terra">
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Tipo</span>
                <span style={telemetryValueStyle}>Planeta rochoso habitável</span>
            </div>
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Distância</span>
                <span style={telemetryValueStyle}>1 UA do Sol</span>
            </div>
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Diâmetro</span>
                <span style={telemetryValueStyle}>12.742 km</span>
            </div>
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Assinatura</span>
                <span style={telemetryValueStyle}>
                    água líquida, oxigênio, nuvens, vegetação e luzes urbanas
                </span>
            </div>
        </div>
    </div>
)

const EarthFeatureOverlay = ({ feature }) => {
    const layer = earthLayers.find((item) => item.id === feature)
    if (!layer) return null

    return (
        <>
            <div style={overlayShellStyle} aria-hidden="true">
                <div style={overlayPanelStyle}>
                    <div style={overlayCodeStyle}>EARTH LAYER SCAN</div>
                    <h2 style={overlayTitleStyle}>{layer.title}</h2>
                    <p style={overlayMetricStyle}>{layer.value}</p>
                    <p style={overlayBodyStyle}>{layer.description}</p>
                </div>
            </div>

            <div style={orbitalMapStyle} aria-hidden="true">
                <span style={orbitalLineStyle} />
                <span style={orbitalDotStyle} />
            </div>
        </>
    )
}

export default function EarthHUD({ onFeatureFocus, onZoomDelta }) {
    const [activeFeature, setActiveFeature] = useState("earth-oceans")

    const handleFeatureChange = (feature) => {
        setActiveFeature(feature)
        onFeatureFocus?.(feature)
    }

    return (
        <HelmetHUD
            title="Terra"
            accordionItems={accordionItems}
            titleComponent={
                <EarthTitle
                    activeFeature={activeFeature}
                    onSelectLayer={handleFeatureChange}
                />
            }
            overlayComponent={<EarthFeatureOverlay feature={activeFeature} />}
            onZoomDelta={onZoomDelta}
            onAccordionChange={(item) => {
                const nextFeature = item?.feature ?? null
                if (!nextFeature) return

                setActiveFeature(nextFeature)
                onFeatureFocus?.(nextFeature)
            }}
        >
            <EarthBriefing />
        </HelmetHUD>
    )
}