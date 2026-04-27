import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Inclinação extrema",
        content:
            "Urano gira praticamente de lado, com eixo inclinado cerca de 98 graus. Isso cria estações muito longas e incomuns.",
    },
    {
        title: "Gigante gelado",
        content:
            "Diferente de Júpiter e Saturno, Urano contém mais água, amônia e metano em forma de gelos e fluidos profundos sob a atmosfera.",
    },
    {
        title: "Cor azul-esverdeada",
        content:
            "O metano absorve luz vermelha e deixa a luz azul-esverdeada se destacar, dando ao planeta sua aparência fria e suave.",
    },
]

export default function UranusHUD() {
    return (
        <InfoHUD
            title="URANO"
            subtitle="Ouranos · Uranus"
            accordionItems={accordionItems}
            intro={
                "Urano é um gigante gelado de tom azul-esverdeado, distante e discreto. Sua característica mais marcante é a inclinação extrema do eixo, que faz o planeta parecer rolar ao redor do Sol.\n\nNo planetário, Urano funciona como transição para os mundos frios do Sistema Solar externo, onde a luz solar é fraca e a atmosfera esconde interiores profundos."
            }
        />
    )
}