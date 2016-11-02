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

  entityManagerRequest(command: string, data: Entity | Entity[]): Promise<RequestResult>;

  repositoryRequest(entityName: string, command: string, ...args: Array<any>): Promise<RequestResult>;
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

  public createEntity(entityName: string, data: Object = {}): Entity {
    return new Entity(Object.assign({_entityName: entityName}, data));
  }

  public createRepository(entityName: string): Repository {
    return new Repository(entityName, this.requestService);
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

  public request(method: string, ...args: Array<any>): Promise<SearchResult> {
    return this.requestService.repositoryRequest(this.entityName, method, ...args);
  }
}

class EntityManager {
  private entryUrl: string;
  private requestService: HttpRequestServiceInterface;

  private refreshOriginalAfterPersisting: boolean = true;

  public constructor(entryUrl: string, requestService: HttpRequestServiceInterface) {
    this.entryUrl = entryUrl;
    this.requestService = requestService;
  }

  public setRefreshOriginalAfterPersisting(refresh: boolean) {
    this.refreshOriginalAfterPersisting = refresh;
  }

  /**
   * Method persist entity and if everything is ok
   *
   * @param data
   * @param refreshOriginal if no value specified, takes default value from this.refreshOriginalAfterPersisting
   * @returns {Promise<RequestResult>}
   */
  public persist(data: Array<Entity> | Entity, refreshOriginal: boolean | undefined = undefined): Promise<PersistResult> {
    return new Promise<PersistResult>(resolve => {
      this.requestService.entityManagerRequest("persist", data).then(result => {
        if ((result as PersistResult).success()) {
          if (refreshOriginal === true || (refreshOriginal !== false && this.refreshOriginalAfterPersisting === true)) {
            this.applyChangesFromServerToEntity(data, result.getData());
          }
        }

        resolve(result as PersistResult);
      });
    });
  }

  public remove(data: Entity[] | Entity) {
    return this.requestService.entityManagerRequest("remove", data);
  }

  private applyChangesFromServerToEntity(oldData: Entity[] | Entity, newData: Array<Entity> | Entity) {
    if (oldData instanceof Array) {
      if (!(newData instanceof Array)) {
        throw new Error(
          `[DoctrineJS]: Persisted array of entities ${oldData[0].getEntityName()} but got in return not an array!`
        );
      }

      if (oldData.length !== newData.length) {
        throw new Error(
          `[DoctrineJS]: Persisted array of entities ${oldData[0].getEntityName()} but got in return not array with the same size!`
        );
      }

      oldData.forEach((e: Entity) => {
        const newEntity = newData.find((o) => o.get("id") === e.get("id"));

        if (!newEntity) {
          throw new Error(
            `[DoctrineJS]: Tried to refresh data that came from server for entity 
              ${e.getEntityName()}, but did not find data for this entity in server data`
          );
        }

        e._refreshWithEntityAndClearChanges(newEntity);
      });
    } else {
      oldData._refreshWithEntityAndClearChanges(newData as Entity);
    }
  }
}

function isSuperagentResponse(arg): arg is Response {
  if (arg === null || typeof arg !== "object") {
    return false;
  }

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
        this.setData(arg.body);
      }

      this.response = arg;
    } else {
      this.setData(arg);
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
  if (!data || typeof data !== "object") {
    return false;
  }

  if (data instanceof Entity) {
    return false;
  }

  return "_entityName" in data;
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

export class PersistResult extends SearchResult {
  protected data: Entity[] | Entity;

  // Checking, if persis was successfull, because
  public success(): boolean {
    return !!this.data;
  }
}

export class RemoveResult extends RequestResult {
  public success(): boolean {
    return this.data === true;
  }
}

interface EntityCompatibleData {
  _entityName: string;
  [fieldName: string]: any;
}

interface EntityData {
  [fieldName: string]: any;
}

export class Entity {
  private readonly _entityName: string;

  private entityData: EntityData = {};

  private changeSet: EntityData = {};

  public constructor(data: EntityCompatibleData) {
    if (!isEntityCompatibleData(data)) {
      throw new Error(
        `[DoctrineJS]: Tried to create entity with incompatible data! Required properties are missing`
      );
    }

    this._entityName = data._entityName;

    this.entityData = data;
  }

  public getEntityName(): string {
    return this._entityName;
  }

  public set(fieldName: string, value: any) {
    this.changeSet[fieldName] = value;
  }

  public get(fieldName: string): any {
    return this.hasChangesFor(fieldName) ? this.changeSet[fieldName] : this.entityData[fieldName];
  }

  public add(fieldName: string, value: any) {
    if (!this.hasProperty(fieldName)) {
      throw new Error(
        `[DoctrineJS]: Entity ${this._entityName} does not have field ${fieldName} to add something to it!`
      );
    }

    if (!(this.entityData[fieldName] instanceof Array)) {
      throw new Error(
        `[DoctrineJS]: Entity's  property ${this._entityName} is not an array to add something to it!`
      );
    }

    this.entityData[fieldName].push(value);
  }

  public hasProperty(fieldName: string): boolean {
    return this.entityData.hasOwnProperty(fieldName);
  }

  public hasChangesFor(fieldName: string) {
    return this.changeSet.hasOwnProperty(fieldName);
  }

  /**
   * Not for public usage. Uses entity manager
   */
  public _refreshWithEntityAndClearChanges(entity: Entity) {
    Object.assign(this.entityData, entity._getEntityData());

    this.changeSet = {};
  }

  public _getEntityData(): EntityData {
    return this.entityData;
  }

  public _getChangeSet(): EntityData {
    return this.changeSet;
  }
}

function convertDataToEntities(data: EntityCompatibleData[] | EntityCompatibleData): Entity[] | Entity {
  if (data instanceof Entity) {
    const id: any | undefined = data.get("id");

    throw new Error(
      `[DoctrineJS]: Cannot convert Entity to Entity!
      Tried to convert ${data.getEntityName()}. ${id ? `Entity has id: ${id}` : "It was new entity."}`
    );
  }

  let convertedData: Entity[] | Entity;

  // We have an array of datas, so we should iterate over them and create array of entities in return
  if (data instanceof Array) {
    convertedData = [];

    data.forEach((o: EntityCompatibleData) => {
      (convertedData as Entity[]).push(convertDataToEntities(o) as Entity);
    });
  } else {
    // We check if there are data inside entity that is another entity, so creating those
    // entities inside before everything
    for (let field in data) {
      if (isEntityCompatibleData(data[field]) || (data[field] instanceof Array && isEntityCompatibleData(data[field][0]))) {
        data[field] = convertDataToEntities(data[field]);
      }
    }

    convertedData = new Entity(data);
  }

  return convertedData;
}