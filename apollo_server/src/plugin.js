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
          // console.log(' >>>>>>>>>>>>>>>>>>> ', requestContext)
          console.log(' REquest operatoin ////// ')
          console.log(requestContext.operation.selectionSet[0])
          nr.addCustomSpanAttribute('Graphql Resolved', 'Operation')
        },
        willSendResponse (context) {
          const extensions = context.response.extensions
          console.log(' Context: ', extensions.tracing)
          console.log(' resolvers: ', extensions.tracing.execution.resolvers)
          console.log(' metrics ', context.metrics)
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
