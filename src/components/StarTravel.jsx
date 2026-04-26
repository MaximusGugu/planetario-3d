import { useEffect, useRef } from "react"

export default function StarTravel({
    starColor = "#FFFFFF",
    starCount = 300,
    starSize = 2,
    intensity = 100,
    baseSpeed = 0.2,
    hueVariation = 0,
    mouseInfluence = 0.08,
}) {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const stars = useRef([])
    const velocity = useRef(baseSpeed)
    const targetVelocity = useRef(baseSpeed)
    const pointer = useRef({ x: 0, y: 0 })

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext("2d")
        let animationFrameId
        let w = 0
        let h = 0

        const setup = () => {
            w = container.offsetWidth || window.innerWidth
            h = container.offsetHeight || window.innerHeight
            canvas.width = w
            canvas.height = h

            stars.current = Array.from({ length: starCount }, () => ({
                x: Math.random() * w * 2 - w,
                y: Math.random() * h * 2 - h,
                z: Math.random() * w,
                hue: Math.random() * hueVariation,
            }))
        }

        const draw = () => {
            ctx.clearRect(0, 0, w, h)

            velocity.current += (targetVelocity.current - velocity.current) * 0.05
            targetVelocity.current += (baseSpeed - targetVelocity.current) * 0.01

            const centerX = w / 2 + pointer.current.x * w * mouseInfluence
            const centerY = h / 2 + pointer.current.y * h * mouseInfluence

            stars.current.forEach((star) => {
                star.z -= velocity.current

                if (star.z <= 1) {
                    star.z = w
                    star.x = Math.random() * w * 2 - w
                    star.y = Math.random() * h * 2 - h
                    star.hue = Math.random() * hueVariation
                }

                if (star.z > w) star.z = 1

                const sx = (star.x / star.z) * w + centerX
                const sy = (star.y / star.z) * h + centerY
                const size = Math.max(0.1, (1 - star.z / w) * starSize)
                const opacity = (1 - star.z / w) * (intensity / 100)

                if (sx > 0 && sx < w && sy > 0 && sy < h) {
                    ctx.beginPath()
                    ctx.fillStyle =
                        hueVariation > 0
                            ? `hsla(${star.hue}, 100%, 85%, ${opacity})`
                            : starColor
                    ctx.globalAlpha = hueVariation > 0 ? 1 : opacity
                    ctx.arc(sx, sy, size, 0, Math.PI * 2)
                    ctx.fill()
                }
            })

            ctx.globalAlpha = 1
            animationFrameId = requestAnimationFrame(draw)
        }

        const handleWheel = (event) => {
            targetVelocity.current += event.deltaY * 0.02
        }

        const handleMouseMove = (event) => {
            pointer.current.x = event.clientX / window.innerWidth - 0.5
            pointer.current.y = event.clientY / window.innerHeight - 0.5
        }

        setup()
        draw()

        window.addEventListener("wheel", handleWheel, { passive: true })
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("resize", setup)

        return () => {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener("wheel", handleWheel)
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("resize", setup)
        }
    }, [
        starColor,
        starCount,
        starSize,
        intensity,
        baseSpeed,
        hueVariation,
        mouseInfluence,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                width: "100%",
                height: "100%",
                background: "transparent",
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                }}
            />
        </div>
    )
}
