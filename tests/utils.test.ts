import { describe, expect, it } from "vitest";

import { FontObject } from "../src";
import { orderObject, weightListGen } from "../src/utils";

describe("Utils", () => {
  it("Orders object keys alphabetically", () => {
    const object = {
      c: 3,
      a: 1,
      d: 4,
      b: 2,
    } as unknown as FontObject;

    const ordered = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    } as unknown as FontObject;

    expect(orderObject(object)).toEqual(ordered);
  });

  describe("Weight list gen", () => {
    it("Successfully converts APIResponse.variants to weights", () => {
      const variants = ["400", "500", "600"];
      expect(weightListGen(variants)).toEqual([400, 500, 600]);
    });

    it("Handles regular and italic properly", () => {
      const variants = ["regular", "italic"];
      expect(weightListGen(variants)).toEqual([400]);
    });

    it("Resolves italic variants", () => {
      const variants = ["500", "500italic", "700italic"];
      expect(weightListGen(variants)).toEqual([500, 700]);
    });

    it("Throws for unexpected values", () => {
      expect(() => weightListGen(["500i"])).toThrow("Invalid value: 500i");
      expect(() => weightListGen(["badvalue"])).toThrow(
        "Invalid value: badvalue"
      );
    });
  });
});
