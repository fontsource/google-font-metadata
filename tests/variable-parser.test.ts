import { describe, expect, it, vi } from "vitest";

import * as index from "../src/index";
import { dataFixture } from './utils/helpers';


vi.mock("../src/index");

describe("Variable Parser", () => {
    it("Converts variable response data to CSS links", () => {
        vi.spyOn(index, "APIVariableDirect", "get").mockReturnValue(dataFixture("variable-response"));

    })
})