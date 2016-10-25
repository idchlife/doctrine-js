import DoctrineJS from "../src/doctrine";
import { MockRequestService } from "../src/test-utils";
import { expect } from "chai";

const djs = new DoctrineJS("/");

// Mocking request service so it wont send requests but pretend to do so
djs.setRequestService(new MockRequestService());

describe("testing creating entity", () => {
  const entity = djs.createEntity("Product");

  it("should be entity when creating it via DoctrineJS", () => {
    expect(entity).to.have.property("_entityName", "Product", "_entityName property is not in entity after creating it!");
  });
});