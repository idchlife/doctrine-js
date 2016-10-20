import {
  HttpRequestServiceInterface,
  HttpPostRequestParams,
  RequestResult,
  PersistResult,
  RemoveResult
} from "./doctrine";

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

    });
  }

  public setEntryUrl(url: string) {}
}