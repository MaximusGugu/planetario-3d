import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Atmosfera densa",
        content:
            "Venus e envolto por uma atmosfera pesada de dioxido de carbono, com nuvens de acido sulfurico que escondem a superficie da observacao direta.",
    },
    {
        title: "Efeito estufa extremo",
        content:
            "A pressao e o calor fazem de Venus o planeta mais quente do Sistema Solar, mesmo Mercurio estando mais perto do Sol.",
    },
    {
        title: "Rotacao incomum",
        content:
            "Venus gira muito devagar e em sentido retrogrado. Um dia venusiano dura mais que seu ano, criando uma dinamica orbital singular.",
    },
]

export default function VenusHUD() {
    return (
        <InfoHUD
            title="VENUS"
            subtitle="Afrodite · Venus"
            accordionItems={accordionItems}
            intro={
                "Venus e quase do tamanho da Terra, mas evoluiu para um ambiente radicalmente diferente. Sua atmosfera espessa transforma o planeta em uma esfera brilhante e opaca, onde a superficie fica escondida sob nuvens corrosivas.\n\nO planeta e uma referencia essencial para entender clima, efeito estufa e os limites de habitabilidade em mundos rochosos."
            }
        />
    )
}
