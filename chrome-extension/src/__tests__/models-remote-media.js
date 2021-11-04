import { RemoteMedia } from "putio/models";

describe("models.RemoteMedia", () => {
  describe("constructor", () => {
    it("should accept all basic properties", () => {
      const params = {
        url: "foo",
      };

      const item = new RemoteMedia(params);

      expect(item).toHaveProperty("url", "foo");
    });
  });
});
