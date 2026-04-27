import { HelmetHUD } from "./HelmetHUD.jsx"

const accordionItems = [
    {
        title: "Explorando por dentro",
        content:
            "Ao entrar em Júpiter, você passa por camadas densas de nuvens carregadas com amônia, água e vapor. O ambiente parece vivo e em constante movimento.",
    },
    {
        title: "Ventos e tempestades",
        content:
            "Os ventos dentro de Júpiter podem atingir centenas de km/h. A Grande Mancha Vermelha é apenas o sinal mais visível de um sistema atmosférico poderoso e turbulento.",
    },
    {
        title: "Laboratório magnético",
        content:
            "Dentro do gigante gasoso, campos magnéticos e partículas carregadas criam auroras e fenômenos eletromagnéticos que não existem em planetas rochosos.",
    },
]

export default function JupiterInteriorHUD() {
    return (
        <HelmetHUD title="Júpiter Interior" accordionItems={accordionItems}>
            <p>
                Você está navegando pela atmosfera interna de Júpiter. Aqui, camadas de nuvens, tempestades e luz dançante criam um espaço dramático e imersivo.
            </p>
            <p>
                Este HUD interno é projetado para marcar a transição do exterior do planeta para uma região mais profunda, onde os ventos e a energia magnética dominam a experiência.
            </p>
        </HelmetHUD>
    )
}