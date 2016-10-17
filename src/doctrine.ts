import * as request from "superagent";

/**
 * Created by igorandreev on 17/10/16.
 */
export class DoctrineJS {
  /**
   * entryUrl is required for doctrine-js entry point. it works with
   * doctrine-js-bundle for symfony framework
   *
   * @param entryUrl
   */
  public constructor(entryUrl: string) {
    
  }

  em(): EntityManager {
    return 2;
  }

  entity(): Entity {
    return "s";
  }
  
  persist() {

  }
}

class Entity {
}

class EntityManager {
  public constructor() {

  }
}