import * as request from "superagent";
import {
  HttpRequestServiceInterface,
  RequestResult,
  HttpPostRequestParams, PersistResult, Entity
} from "./doctrine";

export class SuperagentRequestService implements HttpRequestServiceInterface {
  private entryUrl: string;

  public constructor(entryUrl: string) {
    this.entryUrl = entryUrl;
  }

  public setEntryUrl(url: string) {
    this.entryUrl = url;
  }

  entityManagerRequest(command: string, data: Entity[] | Entity): Promise<RequestResult> {
    return this.post(this.entryUrl + "/entity-manager", {
      command,
      data
    });
  }

  repositoryRequest(entityName: string, command: string, ...args: Array<any>): Promise<RequestResult> {
    return this.post(this.entryUrl + "/repository", { entityName, command, args });
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