'use strict'

const shimPlugin = (options) => {
  const nr = options.newrelic
  return {
      requestDidStart() {
        const shim = nr.shim

        return {
          executionDidStart: () => ({
            willResolveField({source, info}) {
              let segment = null

              if (isQueryOrMutation(info.parentType)) {
                segment = shim.createSegment(info.fieldName)
                segment.start()
              }

              return () => {
                if (segment) {
                  segment.end()
                }
              }
            }
          }),
          willSendResponse (context) {
            const segment = nr.agent.tracer.getSegment()
            segment.name = `Operation: ${context.operationName}`
          }
        }
    }
  }
}

const isQueryOrMutation = (type) => {
  return type + '' === 'Query' || type + '' === 'Mutation' 
}

module.exports = shimPlugin
