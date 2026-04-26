import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Superficie antiga",
        content:
            "Calisto e um dos terrenos mais antigos e craterados do Sistema Solar. Sua superficie registra bilhoes de anos de impactos quase sem renovacao intensa.",
    },
    {
        title: "Gelo e rocha",
        content:
            "A lua e composta por uma mistura de gelo, rocha e materiais escuros. Essa composicao cria um visual frio, manchado e muito marcado por cicatrizes.",
    },
    {
        title: "Mundo preservado",
        content:
            "Por estar mais distante de Jupiter que Io e Europa, Calisto sofre menos aquecimento de mare. Isso ajuda a preservar sua aparencia antiga.",
    },
]

export default function CallistoHUD() {
    return (
        <InfoHUD
            title="CALISTO"
            subtitle="Kallisto · Jupiter IV"
            accordionItems={accordionItems}
            intro={
                "Calisto e a lua galileana mais externa de Jupiter. Ela parece silenciosa e antiga: um mundo escuro, gelado e coberto por crateras que preservam a memoria de impactos desde o inicio do Sistema Solar.\n\nAo contrario de luas mais ativas, Calisto mostra pouca remodelacao recente. Isso transforma sua superficie em um arquivo visual da historia orbital ao redor de Jupiter."
            }
        />
    )
}
