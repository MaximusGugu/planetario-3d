import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Atmosfera densa",
        content:
            "Vênus é envolto por uma atmosfera pesada de dióxido de carbono, com nuvens de ácido sulfúrico que escondem a superfície da observação direta.",
    },
    {
        title: "Efeito estufa extremo",
        content:
            "A pressão e o calor fazem de Vênus o planeta mais quente do Sistema Solar, mesmo Mercúrio estando mais perto do Sol.",
    },
    {
        title: "Rotação incomum",
        content:
            "Vênus gira muito devagar e em sentido retrógrado. Um dia venusiano dura mais que seu ano, criando uma dinâmica orbital singular.",
    },
]

export default function VenusHUD() {
    return (
        <InfoHUD
            title="VÊNUS"
            subtitle="Afrodite · Venus"
            accordionItems={accordionItems}
            intro={
                "Vênus é quase do tamanho da Terra, mas evoluiu para um ambiente radicalmente diferente. Sua atmosfera espessa transforma o planeta em uma esfera brilhante e opaca, onde a superfície fica escondida sob nuvens corrosivas.\n\nO planeta é uma referência essencial para entender clima, efeito estufa e os limites de habitabilidade em mundos rochosos."
            }
        />
    )
}