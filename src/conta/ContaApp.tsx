import { T } from "./ui";
import {
  usuario,
  consultas,
  receitas,
  sessoesIA,
  humorSemana,
} from "./sampleData";
import Header from "./sections/Header";
import ProximaConsulta from "./sections/ProximaConsulta";
import Atalhos from "./sections/Atalhos";
import ListaConsultas from "./sections/ListaConsultas";
import Receitas from "./sections/Receitas";
import ContinuarConversa from "./sections/ContinuarConversa";
import RegistroHumor from "./sections/RegistroHumor";
import AvaliarNPS from "./sections/AvaliarNPS";
import Perfil from "./sections/Perfil";
import CriseBar from "./CriseBar";

const proximaConsulta = consultas.find((c) => c.status === "agendada");
const consultaNPS = consultas.find(
  (c) => c.status === "realizada" && !c.avaliada
);

export default function ContaApp() {
  return (
    <div
      style={{
        background: T.gray050,
        minHeight: "100vh",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 80,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Header nome={usuario.nome} />
        <ProximaConsulta consulta={proximaConsulta} />
        <Atalhos />
        <ListaConsultas consultas={consultas} />
        <Receitas receitas={receitas} />
        <ContinuarConversa sessoes={sessoesIA} />
        <RegistroHumor semana={humorSemana} />
        <AvaliarNPS consulta={consultaNPS} />
        <Perfil usuario={usuario} />
      </div>
      <CriseBar />
    </div>
  );
}
