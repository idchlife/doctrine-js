import {
  HttpRequestServiceInterface,
  RequestResult,
  PersistResult,
  RemoveResult, SearchResult
} from "./doctrine";

export const entityDataToFind = {
  id: 2,
  name: "My own forst product",
  price: 5.32,

  _entityName: "Product"
};

export class MockRequestService implements HttpRequestServiceInterface {
  entityManagerRequest(command: string, data: any): Promise<RequestResult> {
    return new Promise<RequestResult>(resolve => {
      if (command === "persist") {
        resolve(new PersistResult(data));
      } else if (command = "remove") {
        resolve(new RemoveResult(true));
      }
    });
  }

  repositoryRequest(command: string, params: any): Promise<RequestResult> {
    return new Promise<RequestResult>(resolve => {
      if (params.id === 2) {
        resolve(new SearchResult(entityDataToFind));
      } else {
        resolve(new SearchResult(null));
      }
    });
  }

  public setEntryUrl(url: string) {}
}