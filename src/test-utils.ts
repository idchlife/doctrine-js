import {
  HttpRequestServiceInterface,
  RequestResult,
  PersistResult,
  RemoveResult,
  SearchResult,
  Entity
} from "./doctrine";

export const testDataToFind = {
  id: 2,
  name: "My own forst product",
  price: 5.32,

  _entityName: "Product"
};

export const testDataWithInnerEntitiesToFind = {
  id: 3,
  name: "Product 3",
  _entityName: "Product",
  innerProducts: [{id: 5, _entityName: "Product"}]
};

const toolsSearchResult = [
  {id: 1, weight: 1},
  {id: 2, weight: 2},
  {id: 3, weight: 3}
];

export class MockRequestService implements HttpRequestServiceInterface {
  entityManagerRequest(command: string, data: Entity[] | Entity): Promise<RequestResult> {
    return new Promise<RequestResult>(resolve => {
      if (command === "persist") {
        // Imitating that we got raw data from server, also that we applying all the changeset
        resolve(
          new PersistResult(
            Object.assign(
              {},
              (data as Entity)._getEntityData(),
              (data as Entity)._getChangeSet()
            )
          )
        );
      } else if (command = "remove") {
        resolve(new RemoveResult(true));
      }
    });
  }

  repositoryRequest(entityName: string, command: string, ...args: Array<any>): Promise<SearchResult> {
    return new Promise<SearchResult>((resolve, reject) => {
      if (entityName === "Product" && command === "find") {
        const id: number = args[0];
        if (id === 2) {
          resolve(new SearchResult(testDataToFind));
        } else if (id === 3) {
          resolve(new SearchResult(testDataWithInnerEntitiesToFind));
        } else {
          resolve(new SearchResult(null));
        }
      } else if (entityName === "Tool") {
        resolve(new SearchResult(toolsSearchResult));
      } else {
        reject();
      }
    });
  }

  public setEntryUrl(url: string) {}
}