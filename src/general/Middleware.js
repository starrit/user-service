/**
 * Adds Middleware to each of the methods in our API.
 * @param api api containing all functions to wrap.
 * @returns {{}}
 */
function addMiddleware(api, logger, logResponseBody) {

  // Map middleware to be run for every function on our API.
  getAllFuncs(api).map(func => {
    api[func.name] = function() {
      func.apply(this, runWithMiddleware(arguments, logger, logResponseBody));
    }
  });
  return api;
}

/**
 * Gets all functions defined in our API file.
 * Does this by obtaining all functions except for the 'constructor'.
 * @param api an instance of our API Class.
 * @returns {Array} functions with the exception of the constructor on given object.
 */
function getAllFuncs(api) {
  const proto = Object.getPrototypeOf(api);
  const props = Object.getOwnPropertyNames(proto);
  return props.filter((e) => {
    return e.indexOf('constructor') != 0;
  }).map(funcName => {
    return api[funcName];
  });
}

/**
 * Adds Request timing and Request ID to all API Calls.
 * @param args existing arguments to method call.
 * @param logger logger used to write log messages.
 * @param logResponseBody true if response body should be logged.
 * @returns {*}
 */
function runWithMiddleware(args, logger, logResponseBody) {
  //Grab start time of Request.
  const startTime = new Date();

  //If RequestId already exists, grab it.
  //If not, generate one.
  let requestId;
  if (args[0].request && args[0].request.requestId) {
    requestId = args[0].request.requestId;
  } else {
    requestId = Math.random().toString(16).substr(2, 8);
  }

  const callback = args[args.length - 1];
  args[args.length - 1] = (err, resp) => {
    const endTime = new Date();

    //Created logged statement.
    const detailsMap = {
      action: "CallComplete",
      duration: endTime - startTime,
      requestId
    };

    if (logResponseBody) {
      detailsMap.response = resp;
    }

    //Log it at debug level
    logger.info(detailsMap, "Request Completed");
    callback(err, resp);
  };
  return args;
}

module.exports = addMiddleware;
