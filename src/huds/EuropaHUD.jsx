import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Casca de gelo",
        content:
            "A superfície de Europa é uma crosta de gelo cruzada por linhas, fraturas e regiões jovens. Poucas crateras indicam renovação geológica.",
    },
    {
        title: "Oceano subterrâneo",
        content:
            "Evidências sugerem um oceano global sob o gelo. Esse ambiente pode ter água líquida, sais e energia química.",
    },
    {
        title: "Forças de maré",
        content:
            "A gravidade de Júpiter e das outras luas flexiona Europa, gerando calor interno que pode ajudar a manter água líquida abaixo da superfície.",
    },
]

export default function EuropaHUD() {
    return (
        <InfoHUD
            title="EUROPA"
            subtitle="Europa · Jupiter II"
            accordionItems={accordionItems}
            intro={
                "Europa é uma das luas galileanas de Júpiter e um dos mundos mais promissores para estudar ambientes potencialmente habitáveis. Vista de perto, ela parece lisa, gelada e marcada por cicatrizes lineares.\n\nSeu interesse científico vem do que pode existir abaixo: um oceano escondido sob quilômetros de gelo."
            }
        />
    )
}