import InfoHUD from "./InfoHUD.jsx"

const accordionItems = [
    {
        title: "Ventos extremos",
        content:
            "Netuno tem alguns dos ventos mais rapidos medidos no Sistema Solar. Mesmo recebendo pouca luz, sua atmosfera e muito ativa.",
    },
    {
        title: "Metano e cor",
        content:
            "O metano contribui para a coloracao azul, mas outros componentes atmosfericos tambem influenciam o tom profundo observado.",
    },
    {
        title: "Tritao",
        content:
            "Sua maior lua, Tritao, orbita em sentido retrogrado e pode ter sido capturada do Cinturao de Kuiper. Ela possui geologia gelada ativa.",
    },
]

export default function NeptuneHUD() {
    return (
        <InfoHUD
            title="NETUNO"
            subtitle="Poseidon · Neptune"
            accordionItems={accordionItems}
            intro={
                "Netuno e o planeta mais distante entre os oito principais. Sua aparencia azul intensa contrasta com a pouca luz que chega ate la, criando a sensacao de um mundo frio, remoto e ainda assim dinamico.\n\nA atmosfera exibe tempestades, nuvens brilhantes e ventos violentos, mostrando que distancia do Sol nao significa imobilidade."
            }
        />
    )
}
