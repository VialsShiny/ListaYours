import { afterEach, describe, expect, it, vi } from "vitest";
import { voice } from "@/content/voice";
import {
  ApiError,
  NETWORK_ERROR_MESSAGE,
  apiFetch,
  detailToMessage,
  errorMessage,
  parseError,
} from "@/lib/api";
import { importGifts } from "@/lib/api-owner";
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

  it("hides raw validator output behind a generic message on 422", () => {
    const issues = { detail: [{ loc: ["body", "email"], msg: "value is not a valid email" }] };
    expect(detailToMessage(issues, "x", 422)).toBe(voice.errors.invalid);
    expect(detailToMessage({ detail: "Adresse e-mail invalide." }, "x", 422)).toBe(
      "Adresse e-mail invalide.",
    );
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

describe("parseError", () => {
  it("builds an ApiError from the JSON body or the fallback", async () => {
    const error = await parseError(
      new Response(JSON.stringify({ detail: "Liste introuvable." }), {
        status: 404,
      }),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe("Liste introuvable.");
    const empty = await parseError(new Response("oops", { status: 500 }), "Repli");
    expect(empty.message).toBe("Repli");
    expect(empty.body).toBeNull();
  });
});

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends an empty body on bodyless writes so the proxy sees Content-Length: 0", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("/api/x", { method: "DELETE" });
    await apiFetch("/api/x");
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls[0][1].body).toBe("");
    expect(calls[1][1].body).toBeUndefined();
  });
});

describe("importGifts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const result = {
    dry_run: false,
    total_rows: 2,
    valid_rows: 1,
    errors: [{ row: 2, field: "prix", message: "« abc » n'est pas un prix valide." }],
    categories_to_create: [],
    created_gifts: 0,
    created_categories: 0,
  };

  it("resolves with the result when a 422 carries row errors", async () => {
    const fetchMock = vi.fn(async () => Response.json(result, { status: 422 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(importGifts("nom;prix\nBonnet;abc\n", false)).resolves.toEqual(result);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      content: "nom;prix\nBonnet;abc\n",
      dry_run: false,
    });
  });

  it("throws the French detail of a file-level 422", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ detail: "Le fichier est vide." }, { status: 422 })),
    );
    await expect(importGifts("", true)).rejects.toThrow("Le fichier est vide.");
  });

  it("throws on other statuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({}, { status: 429 })),
    );
    await expect(importGifts("nom\n", true)).rejects.toMatchObject({ status: 429 });
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
