import * as request from "superagent";
import {
  HttpRequestServiceInterface,
  RequestResult,
  HttpPostRequestParams, PersistResult
} from "./doctrine";

export class SuperagentRequestService implements HttpRequestServiceInterface {
  private entryUrl: string;

  public constructor(entryUrl: string) {
    this.entryUrl = entryUrl;
  }

  public setEntryUrl(url: string) {
    this.entryUrl = url;
  }

  entityManagerRequest(command: string, data: any): Promise<RequestResult> {
    return this.post(this.entryUrl + "/entity-manager", {
      command,
      data
    });
  }

  repositoryRequest(command: string, data: any): Promise<RequestResult> {
    return this.post(this.entryUrl + "/repository", { command, data });
  }

  post(url: string, params: HttpPostRequestParams): Promise<RequestResult> {
    return new Promise<PersistResult>((resolve: Function) => {
      request
        .get(url)
        .send()
        .then(
          (response: request.Response) => resolve(new PersistResult(response))
        );
    });
  }
}