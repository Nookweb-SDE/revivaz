/**
 * Formulário da receita: tipo, estado vazio e a regra do que é uma receita
 * preenchida. É um portão clínico — receita sem medicamento, sem dose, sem
 * posologia ou sem validade não pode ser emitida —, então mora fora do
 * componente e tem teste.
 */
export type FormReceita = {
  medicamento: string;
  dosagem: string;
  posologia: string;
  observacoes: string;
  validade: string;
};

export const emptyFormReceita = (): FormReceita => ({
  medicamento: "",
  dosagem: "",
  posologia: "",
  observacoes: "",
  validade: "",
});

export function isFormReceitaValido(f: FormReceita): boolean {
  return (
    f.medicamento.trim().length > 0 &&
    f.dosagem.trim().length > 0 &&
    f.posologia.trim().length > 0 &&
    f.validade.length > 0
  );
}
