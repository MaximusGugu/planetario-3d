import { HelmetHUD } from "./HelmetHUD.jsx"

const accordionItems = [
    {
        title: "Explorando por dentro",
        content:
            "Ao entrar em Jupiter, voce passa por camadas densas de nuvens carregadas com ammonia, agua e vapor. O ambiente parece vivo e em constante movimento.",
    },
    {
        title: "Ventos e tempestades",
        content:
            "Os ventos dentro de Jupiter podem atingir centenas de km/h. A Grande Mancha Vermelha e apenas o sinal mais visivel de um sistema atmosferico poderoso e turbulento.",
    },
    {
        title: "Laboratorio magnetico",
        content:
            "Dentro do gigante gasoso, campos magneticos e particulas carregadas criam auroras e fenomenos eletromagneticos que nao existem em planetas rochosos.",
    },
]

export default function JupiterInteriorHUD() {
    return (
        <HelmetHUD title="Jupiter Interior" accordionItems={accordionItems}>
            <p>
                Voce esta navegando pela atmosfera interna de Jupiter. Aqui, camadas de nuvens, tempestades e luz dançante criam um espaco dramatico e imersivo.
            </p>
            <p>
                Este HUD interno e projetado para marcar a transicao do exterior do planeta para uma regiao mais profunda, onde os ventos e a energia magnetica dominam a experiencia.
            </p>
        </HelmetHUD>
    )
}
