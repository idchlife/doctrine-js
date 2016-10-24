const DoctrineJS = require('../dist/doctrine');

const testUtils = require('../dist/test-utils');

const MockRequestService = testUtils.MockRequestService;

const assert = require('assert');

const djs = new DoctrineJS('/');

// Mocking request service so it wont send requests but pretend to do so
d.setRequestService(new MockRequestService());

describe('testing creating entity', () => {
  it('should be entity when creating it via DoctrineJS', () => {
    const entity = djs.createEntity('Product');

    expect(entity).to.haveOwnProperty('_entityName', '_entityName property is not in entity after creating it!');
  });
});