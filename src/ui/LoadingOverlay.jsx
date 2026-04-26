export default function LoadingOverlay({ progress }) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 99999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                background: "rgba(0,0,0,0.92)",
                color: "white",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
            }}
        >
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
                Viajando 0,000086348 ano-luz
            </div>

            <div
                style={{
                    width: 180,
                    height: 2,
                    background: "rgba(255,255,255,0.15)",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: "white",
                        transition: "width 0.25s ease",
                    }}
                />
            </div>

            <div style={{ fontSize: 10, opacity: 0.5, marginTop: 10 }}>
                {progress}%
            </div>
        </div>
    )
}
