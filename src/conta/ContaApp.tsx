import { usuario } from "./sampleData";

export default function ContaApp() {
  return (
    <div style={{ fontFamily: "'Nunito',sans-serif" }}>
      <h1>Olá, {usuario.nome}</h1>
    </div>
  );
}
