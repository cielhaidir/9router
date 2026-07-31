import { describe, expect, it } from "vitest";
import { filterModelsForApiKey } from "@/app/api/v1/models/route.js";

describe("managed API key model catalog filtering", () => {
  const catalog = [
    { id: "combo-a", owned_by: "combo" },
    { id: "provider/model-a", owned_by: "provider" },
    { id: "provider/model-b", owned_by: "provider" },
  ];

  it("returns only allowed combos when direct models are not allowed", () => {
    expect(filterModelsForApiKey(catalog, {
      allowedModels: [],
      allowedCombos: ["combo-a"],
    })).toEqual([{ id: "combo-a", owned_by: "combo" }]);
  });

  it("keeps an empty policy unrestricted", () => {
    expect(filterModelsForApiKey(catalog, { allowedModels: [], allowedCombos: [] })).toEqual(catalog);
  });
});
