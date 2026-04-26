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
    inset: "4vh 3vw",
    backgroundImage: "url('/textures/SVG/hud.svg')",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "100% 100%",
    filter: "drop-shadow(0 0 18px rgba(255,255,255,0.28))",
    opacity: 0.96,
}

const contentStyle = {
    position: "absolute",
    inset: 0,
    display: "grid",
    gridTemplateColumns: "minmax(280px, 42vw) minmax(240px, 30vw)",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 40,
    padding: "16vh 6vw 18vh",
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
    maxWidth: 560,
    fontSize: "clamp(13px, 1vw, 16px)",
    lineHeight: 1.58,
    fontWeight: 700,
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
}

const accordionPanelStyle = {
    pointerEvents: "auto",
    alignSelf: "end",
    justifySelf: "end",
    width: "min(420px, 30vw)",
    minWidth: 280,
    paddingBottom: "5vh",
}

const accordionButtonStyle = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.72)",
    padding: "10px 0",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 800,
    textAlign: "left",
}

const accordionTextStyle = {
    margin: "0 0 12px",
    fontSize: "clamp(13px, 1vw, 16px)",
    lineHeight: 1.55,
    fontWeight: 650,
    color: "rgba(255,255,255,0.92)",
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
}

const cornerTicksStyle = {
    position: "absolute",
    right: "4vw",
    top: "30vh",
    width: 42,
    height: "34vh",
    opacity: 0.75,
    background:
        "repeating-linear-gradient(to bottom, transparent 0 13px, rgba(255,255,255,0.8) 14px 15px, transparent 16px 25px)",
    filter: "drop-shadow(0 0 10px rgba(255,255,255,0.6))",
}

export function HelmetHUD({
    title,
    children,
    accordionItems = [],
    content = true,
}) {
    const [openItem, setOpenItem] = useState(0)

    return (
        <section style={hudRootStyle} aria-label={`${title || "Planet"} HUD`}>
            <div style={frameStyle} />
            <div style={cornerTicksStyle} />

            {content && (
                <div style={contentStyle}>
                    <article>
                        <h1 style={titleStyle}>{title}</h1>
                        <div style={bodyStyle}>{children}</div>
                    </article>

                    <aside style={accordionPanelStyle}>
                        {accordionItems.map((item, index) => {
                            const isOpen = openItem === index

                            return (
                                <div key={item.title}>
                                    <button
                                        type="button"
                                        style={accordionButtonStyle}
                                        onClick={() =>
                                            setOpenItem(isOpen ? -1 : index)
                                        }
                                    >
                                        <span>{item.title}</span>
                                        <span>{isOpen ? "×" : "+"}</span>
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
        </section>
    )
}

export function EmptyHelmetHUD({ title }) {
    return <HelmetHUD title={title} content={false} />
}
