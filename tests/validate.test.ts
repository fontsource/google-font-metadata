import { describe, expect, it, vi } from "vitest";

import * as index from "../src";
import { validate, validateCLI } from "../src/validate";
import { clone, dataFixture } from "./utils/helpers";

vi.mock("../src/index");

describe("Validate", () => {
  describe("Successful validation", () => {
    vi.spyOn(index, "APIv1", "get").mockReturnValue(dataFixture("v1"));
    it("Successfully validates APIv1", () => {
      expect(() => validateCLI("v1")).not.toThrow();
    });

    vi.spyOn(index, "APIv2", "get").mockReturnValue(dataFixture("v2"));
    it("Successfully validates APIv2", () => {
      expect(() => validateCLI("v2")).not.toThrow();
    });

    vi.spyOn(index, "APIVariable", "get").mockReturnValue(
      dataFixture("variable")
    );
    it("Successfully validates APIVariable", () => {
      expect(() => validateCLI("variable")).not.toThrow();
    });
  });

  describe.concurrent("Failed validation", () => {
    describe("APIv1", () => {
      const validV1Obj = dataFixture("v1");

      it("Catches empty objects", () => {
        expect(() => validate("v1", {})).toThrow("Empty APIv1 Object");
        // Missing record
        const obj = clone(validV1Obj);
        obj.fontId = "tests";
        expect(() => validate("v1", obj)).toThrow(
          "Expected object, received string"
        );
        obj.fontId = {};
        expect(() => validate("v1", obj)).toThrow("undefined");
      });

      it("Catches incorrect variants", () => {
        const noVariants = clone(validV1Obj);
        noVariants.abel.variants = "test";
        expect(() => validate("v1", noVariants)).toThrow(
          "Expected object, received string"
        );
        noVariants.abel.variants = {};
        expect(() => validate("v1", noVariants)).toThrow(
          "No weight variants found"
        );
      });

      it("Catches incorrect weights", () => {
        const weightObj = clone(validV1Obj);
        weightObj.abel.variants["400"] = "test";
        expect(() => validate("v1", weightObj)).toThrow(
          "Expected object, received string"
        );
        weightObj.abel.variants["400"] = {};
        expect(() => validate("v1", weightObj)).toThrow(
          'No styles for weight "400" variants found for Abel'
        );
        const invalidWeightObj = clone(validV1Obj);
        invalidWeightObj.abel.variants["400i"] =
          invalidWeightObj.abel.variants["400"];
        expect(() => validate("v1", invalidWeightObj)).toThrow(
          "Weight 400i is not a number"
        );
      });

      it("Catches incorrect styles", () => {
        const styleObj = clone(validV1Obj);
        styleObj.abel.variants["400"].normal = "test";
        expect(() => validate("v1", styleObj)).toThrow(
          "Expected object, received string"
        );
        styleObj.abel.variants["400"].normal = {};
        expect(() => validate("v1", styleObj)).toThrow(
          "No subsets for style normal variants found for Abel"
        );
        const invalidStyleObj = clone(validV1Obj);
        invalidStyleObj.abel.variants["400"].notstyle =
          invalidStyleObj.abel.variants["400"].normal; // Add invalid style
        expect(() => validate("v1", invalidStyleObj)).toThrow(
          "Style notstyle is not a valid style"
        );
      });

      it("Catches missing subsets", () => {
        const subsetObj = clone(validV1Obj);
        subsetObj.abel.variants["400"].normal.latin = "test";
        expect(() => validate("v1", subsetObj)).toThrow(
          "Expected object, received string"
        );
        subsetObj.abel.variants["400"].normal.latin = {};
        expect(() => validate("v1", subsetObj)).toThrow("undefined");
        subsetObj.abel.variants["400"].normal.latin = { noturl: "test" };
        expect(() => validate("v1", subsetObj)).toThrow(
          "Unrecognized key(s) in object: 'noturl'"
        );
      });

      it("Catches incorrect urls", () => {
        const urlObj = clone(validV1Obj);
        urlObj.abel.variants["400"].normal.latin.url = "test";
        expect(() => validate("v1", urlObj)).toThrow(
          "Expected object, received string"
        );
        urlObj.abel.variants["400"].normal.latin.url = {};
        expect(() => validate("v1", urlObj)).toThrow("undefined");

        const urlObj2 = clone(validV1Obj);
        urlObj2.abel.variants["400"].normal.latin.url.woff3 =
          "https://example.com/test.woff2?test=test";
        expect(() => validate("v1", urlObj2)).toThrow(
          "Unrecognized key(s) in object: 'woff3'"
        );

        const urlObj3 = clone(validV1Obj);
        urlObj3.abel.variants["400"].normal.latin.url.woff2 = "badurl";
        expect(() => validate("v1", urlObj3)).toThrow("Invalid url");
      });
    });

    describe("APIv2", () => {
      const validV2Obj = dataFixture("v2");

      it("Catches empty objects", () => {
        expect(() => validate("v2", {})).toThrow("Empty APIv2 Object");
        // Missing record
        const obj = clone(validV2Obj);
        obj.fontId = "tests";
        expect(() => validate("v2", obj)).toThrow(
          "Expected object, received string"
        );
        obj.fontId = {};
        expect(() => validate("v2", obj)).toThrow("undefined");
      });

      it("Catches incorrect variants", () => {
        const noVariants = clone(validV2Obj);
        noVariants.abel.variants = "test";
        expect(() => validate("v2", noVariants)).toThrow(
          "Expected object, received string"
        );
        noVariants.abel.variants = {};
        expect(() => validate("v2", noVariants)).toThrow(
          "No weight variants found"
        );
      });

      it("Catches incorrect weights", () => {
        const weightObj = clone(validV2Obj);
        weightObj.abel.variants["400"] = "test";
        expect(() => validate("v2", weightObj)).toThrow(
          "Expected object, received string"
        );
        weightObj.abel.variants["400"] = {};
        expect(() => validate("v2", weightObj)).toThrow(
          'No styles for weight "400" variants found for Abel'
        );
        const invalidWeightObj = clone(validV2Obj);
        invalidWeightObj.abel.variants["400i"] =
          invalidWeightObj.abel.variants["400"];
        expect(() => validate("v2", invalidWeightObj)).toThrow(
          "Weight 400i is not a number"
        );
      });

      it("Catches incorrect styles", () => {
        const styleObj = clone(validV2Obj);
        styleObj.abel.variants["400"].normal = "test";
        expect(() => validate("v2", styleObj)).toThrow(
          "Expected object, received string"
        );
        styleObj.abel.variants["400"].normal = {};
        expect(() => validate("v2", styleObj)).toThrow(
          "No subsets for style normal variants found for Abel"
        );
        const invalidStyleObj = clone(validV2Obj);
        invalidStyleObj.abel.variants["400"].notstyle =
          invalidStyleObj.abel.variants["400"].normal; // Add invalid style
        expect(() => validate("v2", invalidStyleObj)).toThrow(
          "Style notstyle is not a valid style"
        );
      });

      it("Catches missing subsets", () => {
        const subsetObj = clone(validV2Obj);
        subsetObj.abel.variants["400"].normal.latin = "test";
        expect(() => validate("v2", subsetObj)).toThrow(
          "Expected object, received string"
        );
        subsetObj.abel.variants["400"].normal.latin = {};
        expect(() => validate("v2", subsetObj)).toThrow("undefined");
        subsetObj.abel.variants["400"].normal.latin = { noturl: "test" };
        expect(() => validate("v2", subsetObj)).toThrow(
          "Unrecognized key(s) in object: 'noturl'"
        );
      });

      it("Catches incorrect urls", () => {
        const urlObj = clone(validV2Obj);
        urlObj.abel.variants["400"].normal.latin.url = "test";
        expect(() => validate("v2", urlObj)).toThrow(
          "Expected object, received string"
        );
        urlObj.abel.variants["400"].normal.latin.url = {};
        expect(() => validate("v2", urlObj)).toThrow("undefined");

        const urlObj2 = clone(validV2Obj);
        urlObj2.abel.variants["400"].normal.latin.url.woff3 =
          "https://example.com/test.woff2?test=test";
        expect(() => validate("v2", urlObj2)).toThrow(
          "Unrecognized key(s) in object: 'woff3'"
        );

        const urlObj3 = clone(validV2Obj);
        urlObj3.abel.variants["400"].normal.latin.url.woff2 = "badurl";
        expect(() => validate("v2", urlObj3)).toThrow("Invalid url");
      });

      it("Catches missing unicode-range", () => {
        const unicodeObj = clone(validV2Obj);
        unicodeObj.abel.unicodeRange = "test";
        expect(() => validate("v2", unicodeObj)).toThrow(
          "Expected object, received string"
        );
        unicodeObj.abel.unicodeRange = {};
        expect(() => validate("v2", unicodeObj)).toThrow(
          "No unicodeRange variants found for Abel"
        );
      });
    });

    describe("APIVariable", () => {
      const validObj = dataFixture("variable");

      it("Catches empty objects", () => {
        expect(() => validate("variable", {})).toThrow(
          "Empty APIVariable Object"
        );
        // Missing record
        const obj = clone(validObj);
        obj.fontId = "tests";
        expect(() => validate("variable", obj)).toThrow(
          "Expected object, received string"
        );
        obj.fontId = {};
        expect(() => validate("variable", obj)).toThrow("undefined");
      });

      it("Catches incorrect variants", () => {
        const noVariants = clone(validObj);
        noVariants.akshar.variants = "test";
        expect(() => validate("variable", noVariants)).toThrow(
          "Expected object, received string"
        );
        noVariants.akshar.variants = {};
        expect(() => validate("variable", noVariants)).toThrow(
          "No type variants found"
        );
      });

      it("Catches incorrect styles", () => {
        const styleObj = clone(validObj);
        styleObj.akshar.variants.wghtOnly.normal = "test";
        expect(() => validate("variable", styleObj)).toThrow(
          "Expected object, received string"
        );
        styleObj.akshar.variants.wghtOnly.normal = {};
        expect(() => validate("variable", styleObj)).toThrow(
          "No subsets for style normal variants found"
        );
        const invalidStyleObj = clone(validObj);
        invalidStyleObj.akshar.variants.wghtOnly.notstyle =
          invalidStyleObj.akshar.variants.wghtOnly.normal; // Add invalid style
        expect(() => validate("variable", invalidStyleObj)).toThrow(
          "Style notstyle is not a valid style"
        );
      });

      it("Catches incorrect urls", () => {
        const urlObj = clone(validObj);
        urlObj.akshar.variants.wghtOnly.normal.latin = "";
        expect(() => validate("variable", urlObj)).toThrow("too_small");
        urlObj.akshar.variants.wghtOnly.normal.latin = "badurl";
        expect(() => validate("variable", urlObj)).toThrow("Invalid url");
      });
    });
  });
});
