export default function EntryConsent({ onAccept, onSkip }) {
    return (
        <main style={rootStyle}>
            <section style={panelStyle} aria-label="Entrada do planetario">
                <p style={eyebrowStyle}>Planetario 3D</p>
                <h1 style={titleStyle}>Preparar assets locais?</h1>
                <p style={bodyStyle}>
                    Podemos guardar texturas e modelos no cache do navegador para
                    acelerar as proximas visitas. Nao salvamos dados pessoais.
                </p>
                <div style={actionsStyle}>
                    <button type="button" style={primaryButtonStyle} onClick={onAccept}>
                        Aceitar e entrar
                    </button>
                    <button type="button" style={secondaryButtonStyle} onClick={onSkip}>
                        Entrar sem cache avancado
                    </button>
                </div>
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
    overflow: "hidden",
    background:
        "radial-gradient(circle at 50% 42%, rgba(226, 133, 73, 0.2), transparent 28%), #020204",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
}

const panelStyle = {
    width: "min(520px, calc(100vw - 32px))",
    padding: "32px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(4, 5, 9, 0.78)",
    backdropFilter: "blur(14px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
}

const eyebrowStyle = {
    margin: "0 0 12px",
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.62)",
}

const titleStyle = {
    margin: "0 0 14px",
    fontFamily: "'Denton Text', Georgia, serif",
    fontSize: "clamp(32px, 6vw, 56px)",
    fontWeight: 700,
    lineHeight: 0.95,
}

const bodyStyle = {
    margin: "0 0 26px",
    maxWidth: 450,
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 1.55,
}

const actionsStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
}

const buttonBaseStyle = {
    minHeight: 44,
    padding: "0 18px",
    borderRadius: 0,
    cursor: "pointer",
    fontWeight: 800,
}

const primaryButtonStyle = {
    ...buttonBaseStyle,
    border: "1px solid rgba(255,255,255,0.92)",
    background: "#fff",
    color: "#07070a",
}

const secondaryButtonStyle = {
    ...buttonBaseStyle,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
}
