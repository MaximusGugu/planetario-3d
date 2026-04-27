import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Planeta vermelho",
        content:
            "A cor avermelhada vem de minerais ricos em ferro oxidados na poeira e nas rochas da superfície. Ventos espalham essa poeira pelo planeta inteiro.",
    },
    {
        title: "Água antiga",
        content:
            "Vales, deltas e minerais hidratados indicam que Marte teve água líquida no passado. Hoje, grande parte dela está presa como gelo ou em minerais.",
    },
    {
        title: "Montanhas e cânions",
        content:
            "Marte abriga o Olympus Mons, um vulcão gigantesco, e Valles Marineris, um sistema de cânions enorme que atravessa parte do planeta.",
    },
]

export default function MarsHUD() {
    return (
        <InfoHUD
            title="MARTE"
            subtitle="Ares · Mars"
            accordionItems={accordionItems}
            intro={
                "Marte é um planeta rochoso frio, seco e coberto por poeira rica em ferro. A aproximação visual destaca um mundo de desertos, crateras, vulcões extintos e sinais de água antiga.\n\nEle é um dos principais alvos para estudar se ambientes habitáveis já existiram fora da Terra."
            }
        />
    )
}