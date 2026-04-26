import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Planeta vermelho",
        content:
            "A cor avermelhada vem de minerais ricos em ferro oxidados na poeira e nas rochas da superficie. Ventos espalham essa poeira pelo planeta inteiro.",
    },
    {
        title: "Agua antiga",
        content:
            "Vales, deltas e minerais hidratados indicam que Marte teve agua liquida no passado. Hoje, grande parte dela esta presa como gelo ou em minerais.",
    },
    {
        title: "Montanhas e canions",
        content:
            "Marte abriga o Olympus Mons, um vulcao gigantesco, e Valles Marineris, um sistema de canions enorme que atravessa parte do planeta.",
    },
]

export default function MarsHUD() {
    return (
        <InfoHUD
            title="MARTE"
            subtitle="Ares · Mars"
            accordionItems={accordionItems}
            intro={
                "Marte e um planeta rochoso frio, seco e coberto por poeira rica em ferro. A aproximacao visual destaca um mundo de desertos, crateras, vulcoes extintos e sinais de agua antiga.\n\nEle e um dos principais alvos para estudar se ambientes habitaveis ja existiram fora da Terra."
            }
        />
    )
}
