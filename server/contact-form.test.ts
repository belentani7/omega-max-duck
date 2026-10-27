import { describe, expect, it } from "vitest";
import { readContactPayload } from "../client/src/lib/contactForm";

describe("public contact form payload", () => {
  it("trims text fields and omits an empty optional service", () => {
    const data = new FormData();
    data.set("name", "  Ana García  ");
    data.set("email", " ana@example.invalid ");
    data.set("service", "   ");
    data.set("message", "  Necesito revisar una mezcla.  ");
    expect(readContactPayload(data)).toEqual({
      name: "Ana García",
      email: "ana@example.invalid",
      service: undefined,
      message: "Necesito revisar una mezcla.",
    });
  });

  it("preserves Unicode text and an explicitly provided service", () => {
    const data = new FormData();
    data.set("name", "João");
    data.set("email", "joao@example.invalid");
    data.set("service", "Produção musical");
    data.set("message", "Quero uma revisão da canção 🎵");
    expect(readContactPayload(data)).toEqual({
      name: "João",
      email: "joao@example.invalid",
      service: "Produção musical",
      message: "Quero uma revisão da canção 🎵",
    });
  });

  it("does not stringify missing fields or non-text values", () => {
    const data = new FormData();
    data.set("name", new Blob(["secret"]), "file.txt");
    expect(readContactPayload(data)).toEqual({
      name: "",
      email: "",
      service: undefined,
      message: "",
    });
  });
});
