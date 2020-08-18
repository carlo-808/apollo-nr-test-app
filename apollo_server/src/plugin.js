'use strict'

const xPlugin = (options) => {
  const nr = options.newrelic
  return {
      requestDidStart(requestContext) {
      const timerStart = Date.now()
      let operation

      return {
        didResolveOperation (requestContext) {
          operation = requestContext.operationName
        },
        willSendResponse (context) {
          console.log(context.response)
          const timerStop = Date.now()
          const timing = timerStop - timerStart
          nr.addCustomSpanAttributes({
            'graphql operation': operation,
            'graphql duration': timing
          })
          console.log(
            `Operation: ${operation}\nDuration: ${timing} ms`
          )
        }
      }
    }
  }
}

module.exports = xPlugin
