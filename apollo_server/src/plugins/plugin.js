'use strict'

const shimPlugin = (options) => {
  const nr = options.newrelic
  return {
      requestDidStart(context) {
        const shim = nr.shim
        const segmentMap = new Map()

        const segmento = nr.agent.tracer.getSegment()
        segmento.name = `Operation: ${context.operationName}`
        const sego = {
          segment: segmento,
          name: segmento.name
        }

        shim.setActiveSegment(segmento)

        segmentMap.set('root', sego)

        return {
          didResolveOperation (context) {
            // console.log('>>>>>>>>>>> ', context.operationName)
            const rootSeg = segmentMap.get('root').segment

            rootSeg.name 
              = `Operation: ${context.operationName}`

            nr.setTransactionName(`Operation: ${context.operationName}`)
          },
          executionDidStart: () => ({
            willResolveField({source, info, context}) {
              if (isQueryOrMutation(info.parentType)) {
                // get root segment to add as parent to Query segment
                const rootSeg = segmentMap.get('root').segment
                const name = `${info.parentType}: ${info.fieldName}`

                const seg = {
                  segment: shim.createSegment(name, rootSeg),
                  name: info.fieldName
                }
                
                seg.segment.start()
                shim.setActiveSegment(seg.segment)

                segmentMap.set(info.fieldName, seg)
              }

              return () => {
                if (isQueryOrMutation(arguments[0].info.parentType)) {
                  const seg = segmentMap.get(info.fieldName).segment
  
                  if (seg) {
                    seg.end()
                    const rootSeg = segmentMap.get('root').segment
                    shim.setActiveSegment(rootSeg)
                  }
                }
              }
            }
          }),
          willSendResponse (context) {
            // This is not getting the right segment
            // const segmento = nr.agent.tracer.getSegment()
            // segmento.name = `Operation: ` + context.operationName
          }
        }
    }
  }
}

const isQueryOrMutation = (type) => {
  return type + '' === 'Query' || type + '' === 'Mutation' 
}

module.exports = shimPlugin
