import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Inclinação extrema",
        content:
            "Urano gira praticamente de lado, com eixo inclinado cerca de 98 graus. Isso cria estacoes muito longas e incomuns.",
    },
    {
        title: "Gigante gelado",
        content:
            "Diferente de Jupiter e Saturno, Urano contem mais agua, amonia e metano em forma de gelos e fluidos profundos sob a atmosfera.",
    },
    {
        title: "Cor azul-esverdeada",
        content:
            "O metano absorve luz vermelha e deixa a luz azul-esverdeada se destacar, dando ao planeta sua aparencia fria e suave.",
    },
]

export default function UranusHUD() {
    return (
        <InfoHUD
            title="URANO"
            subtitle="Ouranos · Uranus"
            accordionItems={accordionItems}
            intro={
                "Urano e um gigante gelado de tom azul-esverdeado, distante e discreto. Sua caracteristica mais marcante e a inclinacao extrema do eixo, que faz o planeta parecer rolar ao redor do Sol.\n\nNo planetario, Urano funciona como transicao para os mundos frios do Sistema Solar externo, onde a luz solar e fraca e a atmosfera esconde interiores profundos."
            }
        />
    )
}
