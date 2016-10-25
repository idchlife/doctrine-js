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
	exports.entityDataToFind = {
	    id: 2,
	    name: "My own forst product",
	    price: 5.32,
	    _entityName: "Product"
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
	    MockRequestService.prototype.repositoryRequest = function (command, params) {
	        return new Promise(function (resolve) {
	            if (params.id === 2) {
	                resolve(new doctrine_1.SearchResult(exports.entityDataToFind));
	            }
	            else {
	                resolve(new doctrine_1.SearchResult(null));
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
	    DoctrineJS.prototype.createEntity = function (entityName) {
	        return new Entity({ _entityName: entityName });
	    };
	    DoctrineJS.prototype.createRepository = function () {
	        return Repository;
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
	    Repository.prototype.request = function (method, params) {
	        return this.requestService.repositoryRequest(method, params);
	    };
	    return Repository;
	}());
	var EntityManager = (function () {
	    function EntityManager(entryUrl, requestService) {
	        this.entryUrl = entryUrl;
	        this.requestService = requestService;
	    }
	    EntityManager.prototype.persist = function (data) {
	        return this.requestService.entityManagerRequest("persist", data);
	    };
	    EntityManager.prototype.remove = function (data) {
	        return this.requestService.entityManagerRequest("remove", data);
	    };
	    return EntityManager;
	}());
	function isSuperagentResponse(arg) {
	    return "body" in arg && "ok" in arg && "status" in arg;
	}
	var RequestResult = (function () {
	    // We don't have here strong type for response because we can be using another
	    // way of accessing data
	    function RequestResult(arg) {
	        if (isSuperagentResponse(arg)) {
	            if (arg.ok) {
	                this.data = arg.body;
	            }
	            this.response = arg;
	        }
	        else {
	            this.data = arg;
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
	    return "_entityName" in data;
	}
	var PersistResult = (function (_super) {
	    __extends(PersistResult, _super);
	    function PersistResult() {
	        _super.apply(this, arguments);
	    }
	    // Checking, if persis was successfull, because
	    PersistResult.prototype.success = function () {
	        return !!this.data;
	    };
	    PersistResult.prototype.setData = function (data) {
	        this.data = data;
	    };
	    return PersistResult;
	}(RequestResult));
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
	var Entity = (function () {
	    function Entity(data) {
	        Object.assign(this, data);
	    }
	    Entity.prototype.getEntityName = function () {
	        return this._entityName;
	    };
	    return Entity;
	}());
	function convertDataToEntities(data) {
	    var convertedData;
	    if (data instanceof Array) {
	        convertedData = [];
	        data.forEach(function (o) {
	            convertedData.push(convertDataToEntities(o));
	        });
	    }
	    else {
	        var entity = new Entity(data);
	        convertedData = entity;
	    }
	    return convertedData;
	}


/***/ }
/******/ ]);