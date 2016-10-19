import {
  HttpRequestServiceInterface,
  HttpPostRequestParams,
  RequestResult
} from "./doctrine";
import * as request from "superagent";

export class MockRequestService implements HttpRequestServiceInterface {
  post(url: string, params: HttpPostRequestParams): Promise<RequestResult> {
    
  }
}