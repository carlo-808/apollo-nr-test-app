'use strict'

// basically this:
// https://github.com/apollographql/apollo-server/blob/main/packages/apollo-tracing/src/index.ts

const { responsePathAsArray } = require('graphql')

const NrPlugin = (options) => {
  return {
    requestDidStart() {
      let startWallTime
      let endWallTime
      let startHrTime
      let duration
      const resolverCalls = []

      startWallTime = new Date()
      startHrTime = process.hrtime()

      return {
        executionDidStart: () => ({
          executionDidEnd: () => {
            duration = process.hrtime(startHrTime)
            endWallTime = new Date()
          },

          willResolveField({source, info}) {
            console.log(' SOURCE ', source)

            console.log('INFO ', info)
            const resolverCall = {
              path: info.path,
              fieldName: info.fieldName,
              parentType: info.parentType,
              returnType: info.returnType,
              startOffset: process.hrtime(startHrTime),
            }

            resolverCalls.push(resolverCall)

            return () => {
              resolverCall.endOffset = process.hrtime(startHrTime)
            }
          }
        }),

        willSendResponse({ response }) {
          console.log(arguments)
          if (
            typeof startWallTime === 'undefined' ||
            typeof endWallTime === 'undefined' ||
            typeof duration === 'undefined'
          ) {
            return
          }

          const extensions = response.extensions || (response.extensions = Object.create(null))
          // Be defensive and make sure nothing else (other plugin, etc.) has
          // already used the `tracing` property on `extensions`.
          if (typeof extensions.tracing !== 'undefined') {
            throw new Error(PACKAGE_NAME + ": Could not add `tracing` to " +
              "`extensions` since `tracing` was unexpectedly already present.");
          }

          // Set the extensions.
          extensions.tracing = {
            version: 1,
            startTime: startWallTime.toISOString(),
            endTime: endWallTime.toISOString(),
            duration: durationHrTimeToNanos(duration),
            execution: {
              resolvers: resolverCalls.map(resolverCall => {
                const startOffset = durationHrTimeToNanos(
                  resolverCall.startOffset,
                );
                const duration = resolverCall.endOffset
                  ? durationHrTimeToNanos(resolverCall.endOffset) - startOffset
                  : 0;
                return {
                  path: responsePathAsArray(resolverCall.path),
                  parentType: resolverCall.parentType.toString(),
                  fieldName: resolverCall.fieldName,
                  returnType: resolverCall.returnType.toString(),
                  startOffset,
                  duration,
                };
              }),
            },
          }

          // console.log(extensions.tracing.execution.resolvers)
        }
      }
    }
  }
}

const durationHrTimeToNanos = (hrtime) => {
  return hrtime[0] * 1e9 + hrtime[1]
}

module.exports = NrPlugin
