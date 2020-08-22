
'use strict'
// basically this:
// https://github.com/apollographql/apollo-server/blob/main/packages/apollo-tracing/src/index.ts

const { responsePathAsArray } = require('graphql')

const NrPlugin = (options) => {
  const nr = options.newrelic

  return {
    requestDidStart() {
      let startWallTime
      let endWallTime
      let startHrTime
      let duration
      const resolverCalls = []

      startWallTime = new Date()
      startHrTime = process.hrtime()

      const shim = nr.shim

      return {
        executionDidStart: () => ({
          executionDidEnd: () => {
            duration = process.hrtime(startHrTime)
            endWallTime = new Date()
          },

          willResolveField({source, info}) {
            let segment = null
            
            if (isQueryOrMutation(info.parentType)) {
              segment = shim.createSegment(info.fieldName)
              segment.start()
            }

            const resolverCall = {
              path: info.path,
              fieldName: info.fieldName,
              parentType: info.parentType,
              returnType: info.returnType,
              startOffset: process.hrtime(startHrTime),
              segment: segment
            }

            resolverCalls.push(resolverCall)

            return () => {
              resolverCall.endOffset = process.hrtime(startHrTime)
              if (resolverCall.segment) {
                segment.end()
              }
            }
          }
        }),

        didResolveSource(context) {
          // console.log(' DID RESOLVE SOURCE ', context)
        },

        willSendResponse(context) {
          if (
            typeof startWallTime === 'undefined' ||
            typeof endWallTime === 'undefined' ||
            typeof duration === 'undefined'
          ) {
            return
          }

          // get the slowest resolved field
          const slowest_field = resolverCalls.filter((call) => {
            return call.parentType + '' !== 'Query' && call.parentType + '' !== 'Mutation'
          }).reduce((prev, curr) => {
            const prev_startOffset = durationHrTimeToNanos(prev.startOffset)
            const curr_startOffset = durationHrTimeToNanos(curr.startOffset)

            const prev_durr = prev.endOffset ? durationHrTimeToNanos(prev.endOffset) - prev_startOffset : 0
            const curr_durr = curr.endOffset ? durationHrTimeToNanos(curr.endOffset) - curr_startOffset : 0

            return (prev_durr > curr_durr) ? prev : curr
          })

          nr.addCustomSpanAttributes({
            'gqlSlowField Name': slowest_field.fieldName,
            'gqlSlowField ReturnType': slowest_field.returnType + '',
            'gqlSlowField ParentType': slowest_field.parentType + '',
            'gqlSlowField Duration ms': nanosToMicros(durationHrTimeToNanos(slowest_field.endOffset) - durationHrTimeToNanos(slowest_field.startOffset))
          })

          // get queries and mutations
          const quemuts = resolverCalls.filter((call) => {
            return call.parentType + '' === 'Query' || call.parentType + '' === 'Mutation'
          })
          quemuts.map((call, idx) => {
            const attrs = {}

            attrs[`gqlQuery${idx} Name`] = call.fieldName
            attrs[`gqlQuery${idx} Return Type`] = call.returnType + ''
            attrs[`gqlQuery${idx} Parent Type`] = call.parentType + ''
            attrs[`gqlQuery${idx} Duration ms`] = 
              nanosToMicros(durationHrTimeToNanos(call.endOffset) - durationHrTimeToNanos(call.startOffset))
            console.log(attrs)
            nr.addCustomSpanAttributes(attrs)
          })

          // overall timings
          const timerStop = Date.now()
          const timing = timerStop - startWallTime
          const segment = nr.agent.tracer.getSegment()
          segment.name = `Operation: ${context.operationName}`
          nr.addCustomSpanAttributes({
            'gql operation name': context.operationName,
            'gql operation duration ms': timing
          })

          // COMMENTED OUT STUFF BELOW to not bloat the response
          // const extensions = response.extensions || (response.extensions = Object.create(null))
          // // Be defensive and make sure nothing else (other plugin, etc.) has
          // // already used the `tracing` property on `extensions`.
          // if (typeof extensions.tracing !== 'undefined') {
          //   throw new Error(PACKAGE_NAME + ": Could not add `tracing` to " +
          //     "`extensions` since `tracing` was unexpectedly already present.");
          // }

          // // Set the extensions.
          // extensions.tracing = {
          //   version: 1,
          //   startTime: startWallTime.toISOString(),
          //   endTime: endWallTime.toISOString(),
          //   duration: durationHrTimeToNanos(duration),
          //   execution: {
          //     resolvers: resolverCalls.map(resolverCall => {
          //       const startOffset = durationHrTimeToNanos(
          //         resolverCall.startOffset,
          //       );
          //       const duration = resolverCall.endOffset
          //         ? durationHrTimeToNanos(resolverCall.endOffset) - startOffset
          //         : 0;
          //       return {
          //         path: responsePathAsArray(resolverCall.path),
          //         parentType: resolverCall.parentType.toString(),
          //         fieldName: resolverCall.fieldName,
          //         returnType: resolverCall.returnType.toString(),
          //         startOffset,
          //         duration,
          //       };
          //     }),
          //   },
          // }
        }
      }
    }
  }
}

const durationHrTimeToNanos = (hrtime) => {
  return hrtime[0] * 1e9 + hrtime[1]
}

const nanosToMicros = (nanos) => {
  return nanos / 1e6
}

const isQueryOrMutation = (type) => {
  return type + '' === 'Query' || type + '' === 'Mutation' 
}

module.exports = NrPlugin
