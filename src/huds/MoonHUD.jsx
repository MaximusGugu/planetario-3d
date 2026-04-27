import { useState } from "react"
import { HelmetHUD, hudTitleStyle } from "./HelmetHUD.jsx"
import TextType from "../components/TextType.jsx"

const moonFeatures = [
    {
        id: "moon-maria",
        label: "MARES",
        title: "Planícies basálticas",
        value: "lava antiga",
        description:
            "Os mares lunares são regiões escuras formadas por antigos fluxos de lava. Eles funcionam como manchas visuais que revelam a história vulcânica da Lua.",
    },
    {
        id: "moon-craters",
        label: "CRATERAS",
        title: "Arquivo de impactos",
        value: "bilhões de anos",
        description:
            "Sem atmosfera significativa ou erosão como na Terra, a Lua preserva crateras antigas como um registro quase intacto da história do Sistema Solar interno.",
    },
    {
        id: "moon-artemis",
        label: "ARTEMIS II",
        title: "Retorno humano ao entorno lunar",
        value: "Orion · SLS",
        description:
            "A Artemis II levou uma tripulação ao redor da Lua a bordo da Orion, testando sistemas essenciais para futuras missões lunares do programa Artemis.",
    },
    {
        id: "moon-south-pole",
        label: "POLO SUL",
        title: "Região estratégica",
        value: "gelo em sombra",
        description:
            "O polo sul lunar é uma das regiões mais importantes para exploração futura, pois áreas permanentemente sombreadas podem preservar gelo de água.",
    },
]

const accordionItems = [
    {
        title: "Mares lunares",
        feature: "moon-maria",
        content:
            "As regiões escuras da Lua são planícies basálticas criadas por antigos fluxos de lava. Elas contrastam com as terras altas mais claras e crateradas.",
    },
    {
        title: "Crateras e memória geológica",
        feature: "moon-craters",
        content:
            "A Lua preserva crateras por bilhões de anos. Sem atmosfera densa, chuva ou tectônica ativa como a Terra, sua superfície funciona como um arquivo de impactos.",
    },
    {
        title: "Artemis II",
        feature: "moon-artemis",
        content:
            "A Artemis II marcou o retorno de astronautas ao entorno lunar no programa Artemis. A missão usou o foguete SLS e a espaçonave Orion para testar sistemas em voo tripulado ao redor da Lua.",
    },
    {
        title: "Polo sul lunar",
        feature: "moon-south-pole",
        content:
            "O polo sul lunar é uma região-chave para exploração futura. Crateras permanentemente sombreadas podem guardar gelo, útil para ciência, suporte de vida e produção de recursos.",
    },
]

const moonTitleStyle = {
    ...hudTitleStyle,
    margin: 0,
    lineHeight: 1.05,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
}

const moonTitleMetaStyle = {
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

const featureGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    maxWidth: 380,
}

const featureButtonStyle = {
    display: "grid",
    gap: 4,
    padding: "9px 10px",
    textAlign: "left",
    border: "1px solid rgba(255,255,255,0.16)",
    borderLeft: "2px solid rgba(210,220,230,0.72)",
    background: "rgba(8,10,14,0.34)",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontFamily: "'General Sans', sans-serif",
}

const featureButtonActiveStyle = {
    borderColor: "rgba(210,220,230,0.72)",
    background: "rgba(180,200,220,0.14)",
    boxShadow: "0 0 18px rgba(210,220,230,0.12)",
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
        "linear-gradient(90deg, rgba(210,220,230,0.15), rgba(6,8,12,0.02))",
}

const overlayCodeStyle = {
    marginBottom: 8,
    fontSize: 9,
    letterSpacing: "0.18em",
    color: "rgba(220,230,240,0.94)",
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

const artemisWireframeShellStyle = {
    position: "absolute",
    right: "6vw",
    bottom: "8vh",
    width: 250,
    height: 250,
    pointerEvents: "none",
    fontFamily: "'General Sans', sans-serif",
}

const artemisOrbitStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 210,
    height: 210,
    transform: "translate(-50%, -50%) rotate(-22deg)",
    border: "1px solid rgba(220,230,240,0.22)",
    borderRadius: "50%",
    boxShadow:
        "0 0 24px rgba(210,220,230,0.08), inset 0 0 30px rgba(210,220,230,0.04)",
}

const artemisMoonStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 74,
    height: 74,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    border: "1px solid rgba(220,230,240,0.5)",
    background:
        "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18), rgba(170,170,170,0.12) 38%, rgba(60,60,65,0.16) 100%)",
    boxShadow:
        "0 0 18px rgba(220,230,240,0.08), inset -8px -8px 18px rgba(0,0,0,0.22)",
}

const artemisTrajectoryStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 234,
    height: 92,
    transform: "translate(-50%, -50%) rotate(-18deg)",
    border: "1px dashed rgba(120,190,255,0.52)",
    borderRadius: "50%",
}

const orionStyle = {
    position: "absolute",
    left: "75%",
    top: "34%",
    width: 18,
    height: 18,
    transform: "rotate(-28deg)",
    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
    border: "1px solid rgba(255,255,255,0.8)",
    background: "rgba(120,190,255,0.28)",
    boxShadow: "0 0 16px rgba(120,190,255,0.45)",
}

const artemisLabelStyle = {
    position: "absolute",
    left: 0,
    bottom: 0,
    fontSize: 9,
    letterSpacing: "0.16em",
    color: "rgba(255,255,255,0.58)",
    textTransform: "uppercase",
}

const craterReticleStyle = {
    position: "absolute",
    right: "10vw",
    bottom: "16vh",
    width: 118,
    height: 118,
    border: "1px solid rgba(220,230,240,0.42)",
    borderRadius: "50%",
    boxShadow:
        "0 0 18px rgba(220,230,240,0.12), inset 0 0 18px rgba(220,230,240,0.06)",
    pointerEvents: "none",
}

const craterReticleCrossStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 150,
    height: 1,
    transform: "translate(-50%, -50%)",
    background:
        "linear-gradient(90deg, transparent, rgba(220,230,240,0.7), transparent)",
}

const MoonTitle = ({ activeFeature, onSelectFeature }) => (
    <div style={titleShellStyle}>
        <h1 style={moonTitleStyle}>
            LUA
            <span style={moonTitleMetaStyle}>Selene · Moon</span>
        </h1>

        <div style={featureGridStyle} aria-label="Features interativas da Lua">
            {moonFeatures.map((feature) => {
                const active = activeFeature === feature.id

                return (
                    <button
                        key={feature.id}
                        type="button"
                        style={{
                            ...featureButtonStyle,
                            ...(active ? featureButtonActiveStyle : null),
                        }}
                        onClick={() => onSelectFeature(feature.id)}
                    >
                        <span style={featureLabelStyle}>{feature.label}</span>
                        <span style={featureTitleStyle}>{feature.title}</span>
                        <span style={featureValueStyle}>{feature.value}</span>
                    </button>
                )
            })}
        </div>
    </div>
)

const MoonBriefing = () => (
    <div style={briefingStyle}>
        <TextType
            text={
                "A Lua é mais que um satélite natural: ela é um arquivo exposto da história do Sistema Solar interno e o primeiro território fora da Terra alcançado por humanos.\n\nNeste módulo, a Lua é tratada como mapa de exploração: mares escuros, crateras preservadas, polos estratégicos e novas rotas humanas abertas pelo programa Artemis."
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

        <div style={telemetryStyle} aria-label="Dados enciclopédicos da Lua">
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Tipo</span>
                <span style={telemetryValueStyle}>Satélite natural rochoso</span>
            </div>
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Diâmetro</span>
                <span style={telemetryValueStyle}>3.474 km</span>
            </div>
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Gravidade</span>
                <span style={telemetryValueStyle}>≈16,5% da gravidade terrestre</span>
            </div>
            <div style={telemetryRowStyle}>
                <span style={telemetryLabelStyle}>Exploração</span>
                <span style={telemetryValueStyle}>
                    Apollo · orbitadores · robôs · Artemis
                </span>
            </div>
        </div>
    </div>
)

const ArtemisWireframe = () => (
    <div style={artemisWireframeShellStyle} aria-hidden="true">
        <span style={artemisOrbitStyle} />
        <span style={artemisTrajectoryStyle} />
        <span style={artemisMoonStyle} />
        <span style={orionStyle} />
        <span style={artemisLabelStyle}>ARTEMIS II · LUNAR FLYBY</span>
    </div>
)

const MoonFeatureOverlay = ({ feature }) => {
    const selected = moonFeatures.find((item) => item.id === feature)
    if (!selected) return null

    return (
        <>
            <div style={overlayShellStyle} aria-hidden="true">
                <div style={overlayPanelStyle}>
                    <div style={overlayCodeStyle}>
                        {feature === "moon-artemis"
                            ? "MISSION TRAJECTORY"
                            : "LUNAR SURFACE SCAN"}
                    </div>
                    <h2 style={overlayTitleStyle}>{selected.title}</h2>
                    <p style={overlayMetricStyle}>{selected.value}</p>
                    <p style={overlayBodyStyle}>{selected.description}</p>
                </div>
            </div>

            {feature === "moon-artemis" && <ArtemisWireframe />}

            {feature === "moon-craters" && (
                <div style={craterReticleStyle} aria-hidden="true">
                    <span style={craterReticleCrossStyle} />
                    <span
                        style={{
                            ...craterReticleCrossStyle,
                            transform:
                                "translate(-50%, -50%) rotate(90deg)",
                        }}
                    />
                </div>
            )}

            {feature === "moon-south-pole" && (
                <div
                    style={{
                        ...craterReticleStyle,
                        right: "7vw",
                        bottom: "9vh",
                        width: 90,
                        height: 90,
                        borderRadius: "12px",
                        transform: "rotate(45deg)",
                    }}
                    aria-hidden="true"
                >
                    <span style={craterReticleCrossStyle} />
                    <span
                        style={{
                            ...craterReticleCrossStyle,
                            transform:
                                "translate(-50%, -50%) rotate(90deg)",
                        }}
                    />
                </div>
            )}
        </>
    )
}

export default function MoonHUD({ onFeatureFocus, onZoomDelta }) {
    const [activeFeature, setActiveFeature] = useState("moon-artemis")

    const handleFeatureChange = (feature) => {
        setActiveFeature(feature)
        onFeatureFocus?.(feature)
    }

    return (
        <HelmetHUD
            title="Lua"
            accordionItems={accordionItems}
            titleComponent={
                <MoonTitle
                    activeFeature={activeFeature}
                    onSelectFeature={handleFeatureChange}
                />
            }
            overlayComponent={<MoonFeatureOverlay feature={activeFeature} />}
            onZoomDelta={onZoomDelta}
            onAccordionChange={(item) => {
                const nextFeature = item?.feature ?? null
                if (!nextFeature) return

                setActiveFeature(nextFeature)
                onFeatureFocus?.(nextFeature)
            }}
        >
            <MoonBriefing />
        </HelmetHUD>
    )
}