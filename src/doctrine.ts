import * as request from "superagent";

interface Repositories {
  [repositoryName: string]: Function;
}

export interface HttpPostRequestParams {
  [name: string]: any;
}

export interface HttpRequestServiceInterface {
  setEntryUrl(url: string);

  entityManagerRequest(command: string, data: any): Promise<RequestResult>;

  repositoryRequest(command: string, params: any): Promise<RequestResult>;
}

class SuperagentRequestService implements HttpRequestServiceInterface {
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

/**
 * Created by igorandreev on 17/10/16.
 */
export class DoctrineJS {
  private entryUrl: string;

  private repositories: Repositories = {};

  private entityManager: EntityManager | undefined;

  private requestService: HttpRequestServiceInterface;

  /**
   * entryUrl is required for doctrine-js entry point. it works with
   * doctrine-js-bundle for symfony framework
   *
   * @param entryUrl
   */
  public constructor(entryUrl: string) {
    this.entryUrl = entryUrl;
  }

  public createEntity(): Entity {
    return new Entity();
  }

  public createRepository(): Function {
    return Repository;
  }

  public getEntityManager(): EntityManager {
    if (this.entityManager === undefined) {
      this.entityManager = new EntityManager(this.entryUrl, this.requestService);
    }

    return this.entityManager;
  }
}

function Repository(method: string, ...args) {

}

class EntityManager {
  private entryUrl: string;
  private requestService: HttpRequestServiceInterface;

  public constructor(entryUrl: string, requestService: HttpRequestServiceInterface) {
    this.entryUrl = entryUrl;
    this.requestService = requestService;
  }

  public persist(data: Array<Entity> | Entity): Promise<PersistResult> {
    return this.requestService.entityManagerRequest("persist", data);
  }

  public remove(data: Entity[] | Entity) {
    return this.requestService.entityManagerRequest("remove", data);
  }
}

function isSuperagentResponse(arg): arg is request.Response {
  return "body" in arg && "ok" in arg && "status" in arg;
}

export class RequestResult {
  protected data: any | undefined;
  private response: request.Response | undefined;

  // We don't have here strong type for response because we can be using another
  // way of accessing data
  public constructor(arg: request.Response | any) {
    if (isSuperagentResponse(arg)) {
      if (arg.ok) {
        this.data = arg.body;
      }

      this.response = arg;
    } else {
      this.data = arg;
    }
  }

  public setData(data: any) {
    this.data = data;
  }

  public getData(): any {
    return this.data;
  }

  public wasThereAnError(): boolean {
    if (this.response) {
      return !this.response.ok;
    }

    return false;
  }
}

export class PersistResult extends RequestResult {
  protected data: Entity[] | Entity;

  public setData(data: Entity[] | Entity) {
    this.data = data;
  }
}

export class RemoveResult extends RequestResult {
  public successfull(): boolean {
    return this.data;
  }
}

/**
 * Since persist and search returns entities
 */
export class SearchResult extends PersistResult {}

class Entity {
  private entityName: string;
  private repositoryName: string;

  public static createFromData(data: Object): Entity {
    return new Entity();
  }
}

function convertDataToEntities(data: Object[] | Object): Entity[] | Entity {
  let convertedData: Entity[] | Entity;

  if (data instanceof Array) {
    convertedData = [];

    data.forEach((o: Object) => {
      (convertedData as Entity[]).push(convertDataToEntities(o) as Entity);
    });
  } else {
    const entity: Entity = Entity.createFromData(data);

    convertedData = entity;
  }

  return convertedData;
}