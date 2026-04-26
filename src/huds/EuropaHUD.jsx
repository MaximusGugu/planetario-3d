import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Casca de gelo",
        content:
            "A superficie de Europa e uma crosta de gelo cruzada por linhas, fraturas e regioes jovens. Poucas crateras indicam renovacao geologica.",
    },
    {
        title: "Oceano subterraneo",
        content:
            "Evidencias sugerem um oceano global sob o gelo. Esse ambiente pode ter agua liquida, sais e energia quimica.",
    },
    {
        title: "Forcas de mare",
        content:
            "A gravidade de Jupiter e das outras luas flexiona Europa, gerando calor interno que pode ajudar a manter agua liquida abaixo da superficie.",
    },
]

export default function EuropaHUD() {
    return (
        <InfoHUD
            title="EUROPA"
            subtitle="Europa · Jupiter II"
            accordionItems={accordionItems}
            intro={
                "Europa e uma das luas galileanas de Jupiter e um dos mundos mais promissores para estudar ambientes potencialmente habitaveis. Vista de perto, ela parece lisa, gelada e marcada por cicatrizes lineares.\n\nSeu interesse cientifico vem do que pode existir abaixo: um oceano escondido sob quilometros de gelo."
            }
        />
    )
}
