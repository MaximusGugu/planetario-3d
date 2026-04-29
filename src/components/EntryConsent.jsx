import { useEffect, useState } from "react"

export default function EntryConsent({ onAccept, onSkip, onRequestFullscreen }) {
    const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))

    useEffect(() => {
        const updateFullscreen = () => {
            setIsFullscreen(Boolean(document.fullscreenElement))
        }

        document.addEventListener("fullscreenchange", updateFullscreen)
        return () => document.removeEventListener("fullscreenchange", updateFullscreen)
    }, [])

    return (
        <main style={rootStyle}>
            <section style={panelStyle} aria-label="Entrada do planetario">
                <h1 style={titleStyle}>
                    <span style={brandStyle}>Planetário</span>
                    <span style={dividerStyle}>/</span>
                    <span style={sectionTitleStyle}>Configurações</span>
                </h1>
                <p style={bodyStyle}>
                    Para melhorar sua experiência, podemos guardar texturas e
                    modelos no cache do navegador para acelerar as próximas
                    visitas. Não salvamos dados pessoais.
                </p>
                <p style={bodyStyle}>
                    Também recomendamos que você explore o ambiente em tela
                    cheia, para melhor aproveitar.
                </p>
                <div style={actionsStyle}>
                    <button
                        type="button"
                        style={{
                            ...actionButtonStyle,
                            opacity: isFullscreen ? 0.58 : 1,
                        }}
                        onClick={onRequestFullscreen}
                    >
                        {isFullscreen ? "Tela cheia ativa" : "Tela cheia"}
                    </button>
                    <button type="button" style={actionButtonStyle} onClick={onAccept}>
                        Aceitar dados
                    </button>
                </div>
                <button type="button" style={skipButtonStyle} onClick={onSkip}>
                    Continuar sem baixar os dados
                </button>
            </section>
        </main>
    )
}

const rootStyle = {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    overflow: "hidden",
    background: "#000",
    color: "#fff",
    fontFamily: "'General Sans', Inter, system-ui, sans-serif",
}

const panelStyle = {
    width: "min(760px, calc(100vw - 48px))",
    minHeight: "min(548px, calc(100vh - 48px))",
    padding: "clamp(34px, 8vw, 78px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    border: "4px solid rgba(255,255,255,0.18)",
    borderRadius: "clamp(36px, 7vw, 64px)",
    background: "rgba(0,0,0,0.48)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
}

const titleStyle = {
    margin: "0 0 34px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: "0.28em",
    fontSize: "clamp(24px, 4.2vw, 30px)",
    lineHeight: 1.05,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
}

const brandStyle = {
    fontFamily: "'Denton Text', Georgia, serif",
    fontStyle: "italic",
    fontWeight: 700,
}

const dividerStyle = {
    fontFamily: "Georgia, serif",
    fontWeight: 400,
}

const sectionTitleStyle = {
    fontFamily: "Georgia, serif",
    fontWeight: 500,
}

const bodyStyle = {
    margin: "0 0 28px",
    maxWidth: 560,
    color: "rgba(255,255,255,0.86)",
    fontSize: "clamp(18px, 2.5vw, 21px)",
    lineHeight: 1.36,
}

const actionsStyle = {
    display: "flex",
    flexWrap: "wrap",
    alignSelf: "center",
    justifyContent: "center",
    gap: 16,
    width: "100%",
    marginTop: 4,
}

const actionButtonStyle = {
    minWidth: 255,
    minHeight: 66,
    padding: "0 34px",
    border: "4px solid rgba(255,255,255,0.22)",
    borderRadius: 999,
    background: "rgba(0,0,0,0.22)",
    color: "#fff",
    cursor: "pointer",
    font: "700 20px/1 'General Sans', Inter, system-ui, sans-serif",
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    transition: "opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease",
}

const skipButtonStyle = {
    alignSelf: "center",
    margin: "36px 0 0",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    font: "400 16px/1.2 'General Sans', Inter, system-ui, sans-serif",
    textDecoration: "underline",
    textUnderlineOffset: 2,
}
