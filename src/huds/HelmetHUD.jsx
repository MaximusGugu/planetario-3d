import { useState } from "react"

const hudRootStyle = {
    width: "100vw",
    height: "100vh",
    position: "relative",
    overflow: "hidden",
    pointerEvents: "none",
    color: "#f5f5f5",
    fontFamily: "Inter, system-ui, sans-serif",
}

const frameStyle = {
    position: "absolute",
    inset: "5.5vh 2.8vw 4vh",
    filter: "drop-shadow(0 0 18px rgba(255,255,255,0.28))",
    opacity: 0.96,
}

const frameLineStyle = {
    position: "absolute",
    background: "rgba(255,255,255,0.84)",
    boxShadow:
        "0 0 8px rgba(255,255,255,0.8), 0 0 22px rgba(255,255,255,0.26)",
    animation: "hudFramePulse 4.5s ease-in-out infinite",
}

const contentStyle = {
    position: "absolute",
    inset: 0,
    display: "grid",
    gridTemplateColumns: "minmax(280px, 42vw) minmax(240px, 30vw)",
    alignItems: "end",
    justifyContent: "space-between",
    gap: 40,
    padding: "22vh 7vw 17vh",
}

const titleStyle = {
    margin: "0 0 24px",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontStyle: "italic",
    fontSize: "clamp(64px, 8vw, 128px)",
    lineHeight: 0.82,
    color: "#df8845",
    textShadow: "0 0 24px rgba(223,136,69,0.22)",
}

const bodyStyle = {
    maxWidth: 620,
    fontSize: "clamp(13px, 1vw, 16px)",
    lineHeight: 1.58,
    fontWeight: 700,
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
}

const accordionPanelStyle = {
    pointerEvents: "auto",
    alignSelf: "end",
    justifySelf: "end",
    width: "min(520px, 34vw)",
    minWidth: 320,
    padding: "22px 34px 6vh 28px",
}

const accordionButtonStyle = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.72)",
    padding: "18px 0 14px",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 800,
    textAlign: "left",
}

const accordionTextStyle = {
    margin: "0 0 16px",
    fontSize: "clamp(13px, 1vw, 16px)",
    lineHeight: 1.55,
    fontWeight: 650,
    color: "rgba(255,255,255,0.92)",
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
}

const cornerTicksStyle = {
    position: "absolute",
    right: "4.1vw",
    bottom: "28vh",
    width: 78,
    height: "34vh",
    opacity: 0.75,
    background:
        "repeating-linear-gradient(to bottom, transparent 0 13px, rgba(255,255,255,0.8) 14px 15px, transparent 16px 25px)",
    filter: "drop-shadow(0 0 10px rgba(255,255,255,0.6))",
}

const longTicksStyle = {
    position: "absolute",
    right: "5.3vw",
    bottom: "30vh",
    width: 92,
    height: "28vh",
    opacity: 0.42,
    background:
        "repeating-linear-gradient(to bottom, transparent 0 31px, rgba(255,255,255,0.84) 32px 34px, transparent 35px 52px)",
    filter: "drop-shadow(0 0 12px rgba(255,255,255,0.42))",
}

const Frame = () => (
    <div style={frameStyle} aria-hidden="true">
        <div
            style={{ //LINHA SUPERIOR ESQUERDA
                ...frameLineStyle,
                top: 5,
                left: "2.8vw",
                width: "43vw",
                height: 1,
            }}
        />
        <div
            style={{ //LINHA SUPERIOR DIREITA
                ...frameLineStyle,
                top: 5,
                right: "6vw",
                width: "40vw",
                height: 1,
            }}
        />
        <div
            style={{ //DIAMANTE CENTRO SUPERIOR
                ...frameLineStyle,
                top: -2,
                left: "50%",
                width: 14,
                height: 14,
                borderRight: "2px solid rgba(255,255,255,0.86)",
                borderBottom: "2px solid rgba(255,255,255,0.86)",
                background: "transparent",
                transform: "translateX(-50%) rotate(45deg)",
            }}
        />
        <div
            style={{ //LINHA LATERAL ESQUERDA 
                ...frameLineStyle,
                left: 0,
                top: "6.56vh",
                bottom: "6.56vh",
                width: 1,
            }}
        />
        <div
            style={{ //LINHA DIAGONAO TOP
                ...frameLineStyle,
                left: 0,
                top: 60,
                width: "4vw",
                height: 1,
                transform: "rotate(-45deg)",
                transformOrigin: "left center",
            }}
        />
        <div
            style={{ // DIAGONAL ESQUERDA
                ...frameLineStyle,
                left: 0,
                bottom: 60,
                width: "4vw",
                height: 1,
                transform: "rotate(45deg)",
                transformOrigin: "left center",
            }}
        />
        <div
            style={{ //LINHA INTFERIOR ESQUERDA
                ...frameLineStyle,
                bottom: 5,
                left: "2.8vw",
                width: "32vw",
                height: 1,
            }}
        />
        <div
            style={{ //LINHA INFERIOR DIREITA
                ...frameLineStyle,
                bottom: 5,
                right: "6vw",
                width: "28vw",
                height: 1,
            }}
        />
        <div
            style={{ // DETALHE INFERIOR ESQUERDO
                ...frameLineStyle,
                left: "33vw",
                bottom: 4,
                width: 42,
                height: 4,
            }}
        />
        <div
            style={{ // DETALHE INFERIOR DIREITO1
                ...frameLineStyle,
                right: "33vw",
                bottom: 4,
                width: 42,
                height: 4,
            }}
        />
        <div
            style={{ // DETALHE INFERIOR DIREITO2
                ...frameLineStyle,
                right: "6vw",
                bottom: 5,
                width: 42,
                height: 4,
            }}
        />
    </div>
)

export function HelmetHUD({
    title,
    children,
    accordionItems = [],
    content = true,
    onAccordionChange,
}) {
    const [openItem, setOpenItem] = useState(0)

    return (
        <section style={hudRootStyle} aria-label={`${title || "Planet"} HUD`}>
            <Frame />
            <div style={cornerTicksStyle} />
            <div style={longTicksStyle} />

            {content && (
                <div style={contentStyle}>
                    <article>
                        <h1 style={titleStyle}>{title}</h1>
                        <div style={bodyStyle}>{children}</div>
                    </article>

                    <aside
                        style={accordionPanelStyle}
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        {accordionItems.map((item, index) => {
                            const isOpen = openItem === index

                            return (
                                <div key={item.title}>
                                    <button
                                        type="button"
                                        style={accordionButtonStyle}
                                        onClick={() => {
                                            const nextIndex = isOpen
                                                ? -1
                                                : index
                                            setOpenItem(nextIndex)
                                            onAccordionChange?.(
                                                nextIndex === -1
                                                    ? null
                                                    : item
                                            )
                                        }}
                                    >
                                        <span>{item.title}</span>
                                        <span>{isOpen ? "x" : "+"}</span>
                                    </button>
                                    {isOpen && (
                                        <p style={accordionTextStyle}>
                                            {item.content}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </aside>
                </div>
            )}
            <style>{`
                @keyframes hudFramePulse {
                    0%, 100% { opacity: 0.72; }
                    50% { opacity: 1; }
                }
            `}</style>
        </section>
    )
}

export function EmptyHelmetHUD({ title }) {
    return <HelmetHUD title={title} content={false} />
}
