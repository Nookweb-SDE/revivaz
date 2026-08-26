import { describe, it, expect } from "vitest";
import { emptyFormReceita, isFormReceitaValido, type FormReceita } from "./receitaForm";

const completo = (): FormReceita => ({
  medicamento: "Sertralina",
  dosagem: "50mg",
  posologia: "1 comprimido pela manhã",
  observacoes: "",
  validade: "2026-12-01",
});

describe("isFormReceitaValido — portão da emissão de receita", () => {
  it("formulário vazio não emite", () => {
    expect(isFormReceitaValido(emptyFormReceita())).toBe(false);
  });

  it("completo emite", () => {
    expect(isFormReceitaValido(completo())).toBe(true);
  });

  it("observação é opcional: receita sem observação continua válida", () => {
    expect(isFormReceitaValido({ ...completo(), observacoes: "" })).toBe(true);
  });

  it("falta de medicamento, dose, posologia ou validade barra a emissão", () => {
    for (const campo of ["medicamento", "dosagem", "posologia", "validade"] as const) {
      expect(isFormReceitaValido({ ...completo(), [campo]: "" }), campo).toBe(false);
    }
  });

  it("campo só com espaço não vale como preenchido", () => {
    for (const campo of ["medicamento", "dosagem", "posologia"] as const) {
      expect(isFormReceitaValido({ ...completo(), [campo]: "   " }), campo).toBe(false);
    }
  });
});
