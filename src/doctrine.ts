import { Response } from "superagent";

interface Repositories {
  [repositoryName: string]: Function;
}

export interface HttpPostRequestParams {
  [name: string]: any;
}

function isHttpRequestServiceInterface(service): service is HttpRequestServiceInterface {
  return "setEntryUrl" in service
    && "entityManagerRequest" in service
    && "repositoryRequest" in service;
}

export interface HttpRequestServiceInterface {
  setEntryUrl(url: string);

  entityManagerRequest(command: string, data: any): Promise<RequestResult>;

  repositoryRequest(command: string, params: any): Promise<RequestResult>;
}

let defaultRequestService: HttpRequestServiceInterface | undefined;

export function setDefaultRequestService(service: HttpRequestServiceInterface) {
  // TODO: throw exception with more information
  if (!isHttpRequestServiceInterface(service)) {
    throw Error("Service must be compatible with HttpRequestServiceInterface!");
  }

  defaultRequestService = service;
}

/**
 * Created by igorandreev on 17/10/16.
 */
export default class DoctrineJS {
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

    // Predefined default request service, so library will be functional
    if (defaultRequestService !== undefined) {
      this.requestService = defaultRequestService;
    }
  }

  public setRequestService(service: HttpRequestServiceInterface) {
    this.requestService = service;
  }

  public createEntity(entityName: string): Entity {
    return new Entity({_entityName: entityName});
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

class Repository {
  private requestService: HttpRequestServiceInterface;
  private entityName: string;

  public constructor(entityName: string, requestService: HttpRequestServiceInterface) {
    this.requestService = requestService;
    this.entityName = entityName;
  }

  public request(method: string, params: Array<any>): Promise<SearchResult> {
    return this.requestService.repositoryRequest(method, params);
  }
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

function isSuperagentResponse(arg): arg is Response {
  return "body" in arg && "ok" in arg && "status" in arg;
}

export class RequestResult {
  protected data: any | undefined;
  private response: Response | undefined;

  // We don't have here strong type for response because we can be using another
  // way of accessing data
  public constructor(arg: Response | any) {
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

    // If there is no response - think of it if there is noe
    // error. If there will be another class extending this - it
    // will provide way for itself to detect an error and override this method.
    return false;
  }
}

function isEntityCompatibleData(data): data is Entity {
  return "_entityName" in data;
}

export class PersistResult extends RequestResult {
  protected data: Entity[] | Entity;

  // Checking, if persis was successfull, because
  public success(): boolean {
    return !!this.data;
  }

  public setData(data: any) {
    this.data = data;
  }
}

export class RemoveResult extends RequestResult {
  public success(): boolean {
    return this.data === true;
  }
}

/**
 * Since persist and search returns entities
 */
export class SearchResult extends RequestResult {
  public setData(data: any) {
    if (!data) {
      this.data = data;

      return;
    }

    if ((data instanceof Array && isEntityCompatibleData(data[0])) || isEntityCompatibleData(data)) {
      this.data = convertDataToEntities(data as EntityCompatibleData[] | EntityCompatibleData);
    }
  }

  // Helper method to find out that search result returned empty response
  public resultIsEmpty(): boolean {
    return this.data === null || (this.data instanceof Array && !this.data.length);
  }
}

interface EntityCompatibleData {
  _entityName: string;
}

class Entity {
  private _entityName: string;

  public constructor(data: EntityCompatibleData) {
    Object.assign(this, data);
  }

  public getEntityName(): string {
    return this._entityName;
  }
}

function convertDataToEntities(data: EntityCompatibleData[] | EntityCompatibleData): Entity[] | Entity {
  let convertedData: Entity[] | Entity;

  if (data instanceof Array) {
    convertedData = [];

    data.forEach((o: EntityCompatibleData) => {
      (convertedData as Entity[]).push(convertDataToEntities(o) as Entity);
    });
  } else {
    const entity: Entity = new Entity(data);

    convertedData = entity;
  }

  return convertedData;
}