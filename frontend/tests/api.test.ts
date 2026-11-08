import { describe, expect, it } from "vitest";
import { ApiError, NETWORK_ERROR_MESSAGE, detailToMessage, errorMessage } from "@/lib/api";
import { safeNextPath } from "@/lib/safe-next";

describe("detailToMessage", () => {
  it("reads string details", () => {
    expect(detailToMessage({ detail: "Identifiants invalides." }, "x")).toBe(
      "Identifiants invalides.",
    );
  });

  it("joins validation issues", () => {
    expect(
      detailToMessage(
        {
          detail: [
            { loc: ["body", "password"], msg: "Trop court.", type: "value_error" },
            { msg: "Email invalide." },
          ],
        },
        "x",
      ),
    ).toBe("Trop court. Email invalide.");
  });

  it("falls back when the body is empty", () => {
    expect(detailToMessage(null, "Erreur")).toBe("Erreur");
    expect(detailToMessage({}, "Erreur")).toBe("Erreur");
  });
});

describe("errorMessage", () => {
  it("uses the ApiError message and names network failures", () => {
    expect(errorMessage(new ApiError(409, { detail: "Déjà réservé." }, "Déjà réservé."))).toBe(
      "Déjà réservé.",
    );
    expect(errorMessage(new TypeError("fetch failed"))).toBe(NETWORK_ERROR_MESSAGE);
    expect(errorMessage("???", "Repli")).toBe("Repli");
  });
});

describe("safeNextPath", () => {
  it("accepts relative paths only", () => {
    expect(safeNextPath("/l/noel")).toBe("/l/noel");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});
