'use strict'

const xPlugin = (options) => {
  const nr = options.newrelic
  return {
      requestDidStart(context) {
      const timerStart = Date.now()
      let operation
      console.log(context.request.query)
      const segment = nr.agent.tracer.getSegment()
      segment.name = segment.name + ' graphql request start'
      nr.addCustomSpanAttributes({
        'graphql request started': true
      })

      return {
        didResolveOperation (requestContext) {
          operation = requestContext.operationName
          nr.addCustomSpanAttribute('Graphql Resolved', 'Operation')
        },
        willSendResponse (context) {
          console.log(context.operation.selectionSet.selections)
          const timerStop = Date.now()
          const timing = timerStop - timerStart
          const segment = nr.agent.tracer.getSegment()
          segment.name = operation
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
