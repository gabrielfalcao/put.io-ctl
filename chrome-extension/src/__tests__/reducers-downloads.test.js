import downloads from "putio/reducers/downloads";

describe("downloads reducers", () => {
  describe("INITIAL_STATE", () => {
    it("should handle null as state", () => {
      const initialState = downloads(null, {});

      /* expect(initialState).toHaveProperty("by_id");
       * expect(initialState).toHaveProperty("by_url");
       * expect(initialState).toHaveProperty("all");
       * expect(initialState).toHaveProperty("resumable"); */
    });
  });
  describe("SET_DOWNLOADS", () => {
    it("should return the old state if the action payload has an empty list of downloads", () => {
      /* const initialState = downloads(null, {}); */
    });
  });
});
