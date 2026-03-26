import { describe, it, expect } from "vitest";
import { resources } from "../../assets/js/data/resources.js";

describe("resources dataset", () => {
  const entries = Object.entries(resources);

  it("contains at least one resource", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s has a valid label", (_id, resource) => {
    expect(typeof resource.label).toBe("string");
    expect(resource.label.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s has a valid unit", (_id, resource) => {
    expect(typeof resource.unit).toBe("string");
    expect(resource.unit.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s has a recipes array", (_id, resource) => {
    expect(Array.isArray(resource.recipes)).toBe(true);
  });

  describe("recipe shape", () => {
    for (const [id, resource] of entries) {
      for (let i = 0; i < resource.recipes.length; i++) {
        const recipe = resource.recipes[i];

        describe(`${id} recipe[${i}]`, () => {
          it("has a name string", () => {
            expect(typeof recipe.name).toBe("string");
            expect(recipe.name.length).toBeGreaterThan(0);
          });

          it("has a positive numeric output", () => {
            expect(typeof recipe.output).toBe("number");
            expect(recipe.output).toBeGreaterThan(0);
          });

          it("has an inputs object with positive values", () => {
            expect(typeof recipe.inputs).toBe("object");
            expect(recipe.inputs).not.toBeNull();

            for (const [inputId, amount] of Object.entries(recipe.inputs)) {
              expect(typeof amount).toBe("number");
              expect(amount).toBeGreaterThan(0);
              expect(resources).toHaveProperty(inputId);
            }
          });
        });
      }
    }
  });
});
