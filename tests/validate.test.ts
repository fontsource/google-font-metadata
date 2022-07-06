import mock from "mock-fs";
import * as fs from "node:fs/promises"
import { join } from "pathe";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { validateCLI } from "../src/validate"

describe("Validate", () => {
    describe("Successful validation", () => {
        mock({
            data: {
                "google-fonts-v1.json": '{}',
                "google-fonts-v2.json": mock.load(join(process.cwd(), "./tests/fixtures/google-fonts-v2.json")),
                "variable.json": mock.load(join(process.cwd(), "./tests/fixtures/variable.json")),
            },
        });

        it("Successfully validates APIv1", () => {
            expect(() => validateCLI("v1")).not.toThrow();
        })

        it("Successfully validates APIv2", () => {
            expect(() => validateCLI("v2")).not.toThrow();
        })

        it("Successfully validates APIVariable", () => {
            expect(() => validateCLI("variable")).not.toThrow();
        })

        mock.restore();
    })

    describe("Invalid objects", () => {
        it("Throws for empty object", () => {
            mock({
                data: {
                    "api-response.json": `{}`,
                    "google-fonts-v1.json": '{}',
                    "google-fonts-v2.json": "{}",
                    "variable.json": "{}",
                },
            });

            expect(() => validateCLI("v1")).not.toThrow();
            expect(() => validateCLI("v2")).not.toThrow();
            expect(() => validateCLI("variable")).not.toThrow();
        })

        mock.restore();
    })
})