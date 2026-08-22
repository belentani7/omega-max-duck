import { describe, expect, it } from "vitest";
import { clientInput, projectInput } from "./studio";

describe("contratos CRM y proyectos", () => {
  it("acepta un cliente con información mínima válida y rechaza un correo inválido", () => {
    expect(clientInput.safeParse({ name: "Artista real", email: "artist@example.com", tags: ["vocal"] }).success).toBe(true);
    expect(clientInput.safeParse({ name: "Artista real", email: "no-es-email", tags: [] }).success).toBe(false);
  });

  it("exige un proyecto ligado a un cliente y un importe numérico", () => {
    expect(projectInput.safeParse({ clientId: 1, name: "Single principal", service: "music_production", price: "1200.00", currency: "EUR" }).success).toBe(true);
    expect(projectInput.safeParse({ clientId: 0, name: "x", service: "mix", price: "sin importe", currency: "EU" }).success).toBe(false);
  });
});
