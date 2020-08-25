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
          executionDidStart: () => ({
            willResolveField({source, info, context}) {
              let segment = null
              if (isQueryOrMutation(info.parentType)) {
                const seg = {
                  segment: shim.createSegment(info.fieldName),
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
