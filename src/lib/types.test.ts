import { describe, it, expect } from "vitest";
import type { StatusConsulta, Role } from "./types";

describe("types", () => {
  it("status e role como esperado", () => {
    const s: StatusConsulta[] = ["solicitada", "agendada", "realizada", "cancelada"];
    const r: Role[] = ["paciente", "profissional", "admin"];
    expect(s.length).toBe(4);
    expect(r.length).toBe(3);
  });
});
