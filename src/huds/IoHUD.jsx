import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Vulcanismo extremo",
        content:
            "Io e o corpo mais vulcanicamente ativo do Sistema Solar. Erupcoes e plumas lancam enxofre e outros materiais a grandes altitudes.",
    },
    {
        title: "Aquecimento de mare",
        content:
            "A gravidade de Jupiter e a interacao com Europa e Ganimedes deformam Io continuamente. Essa flexao gera calor interno e alimenta o vulcanismo.",
    },
    {
        title: "Cores de enxofre",
        content:
            "Sua superficie amarela, laranja, preta e branca vem de compostos de enxofre, lava resfriada e depositos vulcanicos espalhados pelo terreno.",
    },
]

export default function IoHUD() {
    return (
        <InfoHUD
            title="IO"
            subtitle="Io · Jupiter I"
            accordionItems={accordionItems}
            intro={
                "Io e a lua galileana mais interna de Jupiter e um dos mundos mais intensos do Sistema Solar. A cena apresenta uma superficie viva, colorida por enxofre e remodelada por vulcoes ativos.\n\nSeu calor nao vem do Sol, mas da gravidade: Jupiter puxa e flexiona Io sem parar, transformando energia orbital em atividade geologica extrema."
            }
        />
    )
}
