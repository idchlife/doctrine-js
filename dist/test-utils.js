/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var doctrine_1 = __webpack_require__(1);
	exports.testDataToFind = {
	    id: 2,
	    name: "My own forst product",
	    price: 5.32,
	    _entityName: "Product"
	};
	exports.testDataWithInnerEntitiesToFind = {
	    id: 3,
	    name: "Product 3",
	    _entityName: "Product",
	    innerProducts: [{ id: 5, _entityName: "Product" }]
	};
	var MockRequestService = (function () {
	    function MockRequestService() {
	    }
	    MockRequestService.prototype.entityManagerRequest = function (command, data) {
	        return new Promise(function (resolve) {
	            if (command === "persist") {
	                resolve(new doctrine_1.PersistResult(data));
	            }
	            else if (command = "remove") {
	                resolve(new doctrine_1.RemoveResult(true));
	            }
	        });
	    };
	    MockRequestService.prototype.repositoryRequest = function (entityName, command) {
	        var args = [];
	        for (var _i = 2; _i < arguments.length; _i++) {
	            args[_i - 2] = arguments[_i];
	        }
	        return new Promise(function (resolve) {
	            if (entityName === "Product" && command === "find") {
	                var id = args[0];
	                if (id === 2) {
	                    resolve(new doctrine_1.SearchResult(exports.testDataToFind));
	                }
	                else if (id === 3) {
	                    resolve(new doctrine_1.SearchResult(exports.testDataWithInnerEntitiesToFind));
	                }
	                else {
	                    resolve(new doctrine_1.SearchResult(null));
	                }
	            }
	        });
	    };
	    MockRequestService.prototype.setEntryUrl = function (url) { };
	    return MockRequestService;
	}());
	exports.MockRequestService = MockRequestService;


/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	function isHttpRequestServiceInterface(service) {
	    return "setEntryUrl" in service
	        && "entityManagerRequest" in service
	        && "repositoryRequest" in service;
	}
	var defaultRequestService;
	function setDefaultRequestService(service) {
	    // TODO: throw exception with more information
	    if (!isHttpRequestServiceInterface(service)) {
	        throw Error("Service must be compatible with HttpRequestServiceInterface!");
	    }
	    defaultRequestService = service;
	}
	exports.setDefaultRequestService = setDefaultRequestService;
	/**
	 * Created by igorandreev on 17/10/16.
	 */
	var DoctrineJS = (function () {
	    /**
	     * entryUrl is required for doctrine-js entry point. it works with
	     * doctrine-js-bundle for symfony framework
	     *
	     * @param entryUrl
	     */
	    function DoctrineJS(entryUrl) {
	        this.repositories = {};
	        this.entryUrl = entryUrl;
	        // Predefined default request service, so library will be functional
	        if (defaultRequestService !== undefined) {
	            this.requestService = defaultRequestService;
	        }
	    }
	    DoctrineJS.prototype.setRequestService = function (service) {
	        this.requestService = service;
	    };
	    DoctrineJS.prototype.createEntity = function (entityName, data) {
	        if (data === void 0) { data = {}; }
	        return new Entity(Object.assign({ _entityName: entityName }, data));
	    };
	    DoctrineJS.prototype.createRepository = function (entityName) {
	        return new Repository(entityName, this.requestService);
	    };
	    DoctrineJS.prototype.getEntityManager = function () {
	        if (this.entityManager === undefined) {
	            this.entityManager = new EntityManager(this.entryUrl, this.requestService);
	        }
	        return this.entityManager;
	    };
	    return DoctrineJS;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = DoctrineJS;
	var Repository = (function () {
	    function Repository(entityName, requestService) {
	        this.requestService = requestService;
	        this.entityName = entityName;
	    }
	    Repository.prototype.request = function (method) {
	        var args = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            args[_i - 1] = arguments[_i];
	        }
	        return (_a = this.requestService).repositoryRequest.apply(_a, [this.entityName, method].concat(args));
	        var _a;
	    };
	    return Repository;
	}());
	var EntityManager = (function () {
	    function EntityManager(entryUrl, requestService) {
	        this.refreshOriginalAfterPersisting = true;
	        this.entryUrl = entryUrl;
	        this.requestService = requestService;
	    }
	    EntityManager.prototype.setRefreshOriginalAfterPersisting = function (refresh) {
	        this.refreshOriginalAfterPersisting = refresh;
	    };
	    /**
	     * Method persist entity and if everything is ok
	     *
	     * @param data
	     * @param refreshOriginal
	     * @returns {Promise<RequestResult>}
	     */
	    EntityManager.prototype.persist = function (data, refreshOriginal) {
	        var _this = this;
	        if (refreshOriginal === void 0) { refreshOriginal = undefined; }
	        return new Promise(function (resolve) {
	            _this.requestService.entityManagerRequest("persist", data).then(function (result) {
	                if (result.success()) {
	                    if (refreshOriginal === true || (refreshOriginal !== false && _this.refreshOriginalAfterPersisting === true)) {
	                        _this.applyChangesFromServerToEntity(data, result.getData());
	                    }
	                }
	                resolve(result);
	            });
	        });
	    };
	    EntityManager.prototype.remove = function (data) {
	        return this.requestService.entityManagerRequest("remove", data);
	    };
	    EntityManager.prototype.applyChangesFromServerToEntity = function (oldData, newData) {
	        if (oldData instanceof Array) {
	            if (!(newData instanceof Array)) {
	                throw new Error("[DoctrineJS]: Persisted array of entities " + oldData[0].getEntityName() + " but got in return not an array!");
	            }
	            if (oldData.length !== newData.length) {
	                throw new Error("[DoctrineJS]: Persisted array of entities " + oldData[0].getEntityName() + " but got in return not array with the same size!");
	            }
	            oldData.forEach(function (e) {
	                var newEntity = newData.find(function (o) { return o.get("id") === e.get("id"); });
	                if (!newEntity) {
	                    throw new Error("[DoctrineJS]: Tried to refresh data that came from server for entity \n              " + e.getEntityName() + ", but did not find data for this entity in server data");
	                }
	                e._refreshWithEntityAndClearChanges(newEntity);
	            });
	        }
	        else {
	            oldData._refreshWithEntityAndClearChanges(newData);
	        }
	    };
	    return EntityManager;
	}());
	function isSuperagentResponse(arg) {
	    if (arg === null || typeof arg !== "object") {
	        return false;
	    }
	    return "body" in arg && "ok" in arg && "status" in arg;
	}
	var RequestResult = (function () {
	    // We don't have here strong type for response because we can be using another
	    // way of accessing data
	    function RequestResult(arg) {
	        if (isSuperagentResponse(arg)) {
	            if (arg.ok) {
	                this.setData(arg.body);
	            }
	            this.response = arg;
	        }
	        else {
	            this.setData(arg);
	        }
	    }
	    RequestResult.prototype.setData = function (data) {
	        this.data = data;
	    };
	    RequestResult.prototype.getData = function () {
	        return this.data;
	    };
	    RequestResult.prototype.wasThereAnError = function () {
	        if (this.response) {
	            return !this.response.ok;
	        }
	        // If there is no response - think of it if there is noe
	        // error. If there will be another class extending this - it
	        // will provide way for itself to detect an error and override this method.
	        return false;
	    };
	    return RequestResult;
	}());
	exports.RequestResult = RequestResult;
	function isEntityCompatibleData(data) {
	    if (!data || typeof data !== "object") {
	        return false;
	    }
	    return "_entityName" in data;
	}
	/**
	 * Since persist and search returns entities
	 */
	var SearchResult = (function (_super) {
	    __extends(SearchResult, _super);
	    function SearchResult() {
	        _super.apply(this, arguments);
	    }
	    SearchResult.prototype.setData = function (data) {
	        if (!data) {
	            this.data = data;
	            return;
	        }
	        if ((data instanceof Array && isEntityCompatibleData(data[0])) || isEntityCompatibleData(data)) {
	            this.data = convertDataToEntities(data);
	        }
	    };
	    // Helper method to find out that search result returned empty response
	    SearchResult.prototype.resultIsEmpty = function () {
	        return this.data === null || (this.data instanceof Array && !this.data.length);
	    };
	    return SearchResult;
	}(RequestResult));
	exports.SearchResult = SearchResult;
	var PersistResult = (function (_super) {
	    __extends(PersistResult, _super);
	    function PersistResult() {
	        _super.apply(this, arguments);
	    }
	    // Checking, if persis was successfull, because
	    PersistResult.prototype.success = function () {
	        return !!this.data;
	    };
	    return PersistResult;
	}(SearchResult));
	exports.PersistResult = PersistResult;
	var RemoveResult = (function (_super) {
	    __extends(RemoveResult, _super);
	    function RemoveResult() {
	        _super.apply(this, arguments);
	    }
	    RemoveResult.prototype.success = function () {
	        return this.data === true;
	    };
	    return RemoveResult;
	}(RequestResult));
	exports.RemoveResult = RemoveResult;
	var Entity = (function () {
	    function Entity(data) {
	        this.entityData = {};
	        this.changeSet = {};
	        if (!isEntityCompatibleData(data)) {
	            throw new Error("[DoctrineJS]: Tried to create entity with incompatible data! Required properties are missing");
	        }
	        this._entityName = data._entityName;
	        this.entityData = data;
	    }
	    Entity.prototype.getEntityName = function () {
	        return this._entityName;
	    };
	    Entity.prototype.set = function (fieldName, value) {
	        this.changeSet[fieldName] = value;
	    };
	    Entity.prototype.get = function (fieldName) {
	        return this.hasChangesFor(fieldName) ? this.changeSet[fieldName] : this.entityData[fieldName];
	    };
	    Entity.prototype.add = function (fieldName, value) {
	        if (!this.hasProperty(fieldName)) {
	            throw new Error("[DoctrineJS]: Entity " + this._entityName + " does not have field " + fieldName + " to add something to it!");
	        }
	        if (!(this.entityData[fieldName] instanceof Array)) {
	            throw new Error("[DoctrineJS]: Entity's  property " + this._entityName + " is not an array to add something to it!");
	        }
	        this.entityData[fieldName].push(value);
	    };
	    Entity.prototype.hasProperty = function (fieldName) {
	        return this.entityData.hasOwnProperty(fieldName);
	    };
	    Entity.prototype.hasChangesFor = function (fieldName) {
	        return this.changeSet.hasOwnProperty(fieldName);
	    };
	    /**
	     * Not for public usage. Uses entity manager
	     */
	    Entity.prototype._refreshWithEntityAndClearChanges = function (entity) {
	        Object.assign(this.entityData, entity._getEntityData());
	        this.changeSet = {};
	    };
	    Entity.prototype._getEntityData = function () {
	        return this.entityData;
	    };
	    return Entity;
	}());
	exports.Entity = Entity;
	function convertDataToEntities(data) {
	    var convertedData;
	    if (data instanceof Array) {
	        convertedData = [];
	        data.forEach(function (o) {
	            convertedData.push(convertDataToEntities(o));
	        });
	    }
	    else {
	        // We check if there are data inside entity that is another entity, so creating those
	        // entities inside before everything
	        for (var field in data) {
	            if (isEntityCompatibleData(data[field]) || (data[field] instanceof Array && isEntityCompatibleData(data[field][0]))) {
	                data[field] = convertDataToEntities(data[field]);
	            }
	        }
	        convertedData = new Entity(data);
	    }
	    return convertedData;
	}


/***/ }
/******/ ]);