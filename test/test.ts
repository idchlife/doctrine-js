import DoctrineJS from "../src/doctrine";
import { RequestResult } from "../src/doctrine";
import { MockRequestService } from "../src/test-utils";
import { RemoveResult } from "../src/doctrine";
import { PersistResult } from "../src/doctrine";
import { SearchResult } from "../src/doctrine";
import {Entity} from "../src/doctrine";
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const djs = new DoctrineJS("/");

// Mocking request service so it wont send requests but pretend to do so
djs.setRequestService(new MockRequestService());

describe("testing creating entity", () => {
  const entity = djs.createEntity("Product");

  it("should be entity when creating it via DoctrineJS", () => {
    expect(entity).to.have.property("_entityName", "Product", "_entityName property is not in entity after creating it!");
  });

  it("should be removed in entityManager and manager should return true", () => {
    djs.getEntityManager().remove(entity).then(result => {
      assert.instanceOf(result, RemoveResult);

      assert.isTrue(result.getData());
    });
  });

  it("should be persisted and return the same entity except the field will be with new value", () => {
    entity.set("price", 4.5);

    assert.isTrue(entity.hasChangesFor("price"));

    assert.equal(entity.get("price"), 4.5);

    // Check if we're not refreshing original - it should still have changes for field
    djs.getEntityManager().persist(entity, false).then(result => {
      assert.equal(entity.get("price"), 4.5);

      // After persisting entity - it won't have changes for this field
      assert.isTrue(entity.hasChangesFor("price"));

      assert.instanceOf(result, PersistResult);
    });

    // Opposite, we change original and it don't have changes because it was refreshed with
    // new data
    djs.getEntityManager().persist(entity).then(result => {
      // After persisting entity - original will not have changes, since it was refreshe
      // automatically after persisting
      assert.isFalse(entity.hasChangesFor("price"));

      assert.instanceOf(result, PersistResult);
    });
  });

  it("should find simple entity and entity with inner entities to test recursive entity creation", () => {
    djs.createRepository("Product").request("find", 2).then(result => {
      assert.instanceOf(result, SearchResult);

      // Checking that result is entity
      const entity = result.getData();

      assert.instanceOf(entity, Entity);
    });

    djs.createRepository("Product").request("find", 3).then(result => {
      const entity = result.getData();

      assert.instanceOf(entity, Entity);

      assert.isTrue(entity.hasProperty("innerProducts"));

      const innerEntities = entity.get("innerProducts");

      assert.instanceOf(innerEntities[0], Entity);
    });
  });
});