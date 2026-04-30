import { useEffect, useState } from "react"

export default function EntryConsent({ onAccept, onSkip, onRequestFullscreen }) {
    const [isFullscreen, setIsFullscreen] = useState(
        Boolean(document.fullscreenElement)
    )

    useEffect(() => {
        const updateFullscreen = () => {
            setIsFullscreen(Boolean(document.fullscreenElement))
        }

        document.addEventListener("fullscreenchange", updateFullscreen)
        return () =>
            document.removeEventListener("fullscreenchange", updateFullscreen)
    }, [])

    return (
        <main className="entry-consent" aria-label="Entrada do planetario">
            <section className="glass-panel entry-consent__panel">
                <h1 className="entry-consent__title">
                    <span className="entry-consent__brand">Planetário</span>
                    <span className="entry-consent__divider">/</span>
                    <span>Configurações</span>
                </h1>

                <p>
                    Para melhorar sua experiência, podemos guardar texturas e
                    modelos no cache do navegador para acelerar as próximas
                    visitas. Não salvamos dados pessoais.
                </p>
                <p>
                    Também recomendamos que você explore o ambiente em tela
                    cheia e viaje com o áudio ligado, para melhor aproveitar.
                </p>

                <div className="entry-consent__actions">
                    <button
                        type="button"
                        className="glass-button entry-consent__button"
                        onClick={onRequestFullscreen}
                    >
                        {isFullscreen ? "Tela cheia ativa" : "Tela cheia"}
                    </button>
                    <button
                        type="button"
                        className="glass-button entry-consent__button"
                        onClick={onAccept}
                    >
                        Aceitar dados
                    </button>
                </div>

                <button
                    type="button"
                    className="entry-consent__skip"
                    onClick={onSkip}
                >
                    Continuar sem baixar os dados
                </button>
            </section>
        </main>
    )
}
