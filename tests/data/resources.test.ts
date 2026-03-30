import { describe, it, expect } from "vitest";
import {
  getResourceIdsConsumedInRecipes,
  resources,
} from "../../assets/js/data/resources";

describe("resources dataset", () => {
  const entries = Object.entries(resources);

  it("contains at least one resource", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it("getResourceIdsConsumedInRecipes only references known ids", () => {
    const consumed = getResourceIdsConsumedInRecipes();
    expect(consumed.size).toBeGreaterThan(0);
    for (const id of consumed) {
      expect(resources[id]).toBeDefined();
    }
  });

  it.each(entries)("%s has a valid label", (_id, resource) => {
    expect(typeof resource.label).toBe("string");
    expect(resource.label.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s has a valid unit", (_id, resource) => {
    expect(typeof resource.unit).toBe("string");
    expect(resource.unit.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s has a wikiUrl", (_id, resource) => {
    expect(typeof resource.wikiUrl).toBe("string");
    expect(resource.wikiUrl).toMatch(/^https:\/\/wiki\.coigame\.com\//);
  });

  it.each(entries)("%s has an imageUrl string", (_id, resource) => {
    expect(typeof resource.imageUrl).toBe("string");
    if (resource.imageUrl.length > 0) {
      expect(resource.imageUrl).toMatch(/^https:\/\/wiki\.coigame\.com\//);
    }
  });

  it.each(entries)("%s has a recipes array", (_id, resource) => {
    expect(Array.isArray(resource.recipes)).toBe(true);
  });

  describe("recipe shape", () => {
    for (const [id, resource] of entries) {
      for (let i = 0; i < resource.recipes.length; i++) {
        const recipe = resource.recipes[i]!;

        describe(`${id} recipe[${i}]`, () => {
          it("has a name string", () => {
            expect(typeof recipe.name).toBe("string");
            expect(recipe.name.length).toBeGreaterThan(0);
          });

          it("has building and durationSec", () => {
            expect(typeof recipe.building).toBe("string");
            expect(recipe.building.length).toBeGreaterThan(0);
            expect(typeof recipe.durationSec).toBe("number");
            expect(recipe.durationSec).toBeGreaterThan(0);
          });

          it("lists this resource in outputs with a positive amount", () => {
            expect(typeof recipe.outputs).toBe("object");
            expect(recipe.outputs).not.toBeNull();
            const out = recipe.outputs[id];
            expect(typeof out).toBe("number");
            expect(out).toBeGreaterThan(0);
          });

          it("has an inputs object with positive values (or empty for source-less recipes)", () => {
            expect(typeof recipe.inputs).toBe("object");
            expect(recipe.inputs).not.toBeNull();

            for (const [, amount] of Object.entries(recipe.inputs)) {
              expect(typeof amount).toBe("number");
              expect(amount).toBeGreaterThan(0);
            }
          });
        });
      }
    }
  });
});
