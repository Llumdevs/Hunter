import { describe, expect, it } from "vitest";
import { isSlideComplete, slideProgress } from "./slide";

const TRACK = 300;
const KNOB = 50; // recorrido útil: 250 px

describe("slideProgress", () => {
  it("es 0 al empezar", () => expect(slideProgress(0, TRACK, KNOB)).toBe(0));
  it("es proporcional al recorrido útil", () => expect(slideProgress(125, TRACK, KNOB)).toBe(0.5));
  it("no baja de 0 si se arrastra hacia atrás", () => expect(slideProgress(-40, TRACK, KNOB)).toBe(0));
  it("no pasa de 1 si se arrastra de más", () => expect(slideProgress(400, TRACK, KNOB)).toBe(1));
  it("es 0 si la pista no deja recorrido", () => expect(slideProgress(10, 40, KNOB)).toBe(0));
  it("es 0 si la pista mide justo lo que el botón (sin dividir entre 0)", () => expect(slideProgress(10, KNOB, KNOB)).toBe(0));
  it("es 0 al arrastrar hacia atrás sin recorrido", () => expect(slideProgress(-10, 40, KNOB)).toBe(0));
});

describe("isSlideComplete", () => {
  it("confirma al llegar al 90 %", () => expect(isSlideComplete(0.9)).toBe(true));
  it("no confirma justo por debajo", () => expect(isSlideComplete(0.89)).toBe(false));
});
