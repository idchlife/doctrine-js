const DoctrineJS = require('./dist/doctrine');

const SuperagentRequestService = require('./dist/request-service');

DoctrineJS.setDefaultRequestService(SuperagentRequestService);

module.exports = DoctrineJS;