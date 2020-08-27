'use strict'

function namesAndDepths(nodes, depth = 1) {
  const childNodes = nodes.map(node => {
    if (node.kind === 'OperationDefinition' || node.kind === 'Field') {
      const name = node.name ? node.name.value : 'query'
      const children = node.selectionSet ? node.selectionSet.selections : null

      // The "leaf" of the branch. This can return multiple names/depths, like
      // when a query has many fields being pulled for an object type
      if (!children) {
        return { name, depth }
      }

      const childNamesAndDepths = namesAndDepths(children, depth + 1).map(nameAndDepth => {
        nameAndDepth.name = `${name}.${nameAndDepth.name}`
        return nameAndDepth
      })

      return childNamesAndDepths
    }

    // TODO: what else is there??
  })

  return childNodes.flat()
}

function deepestPath(context) {
  const definitions = context.document.definitions
  const names = namesAndDepths(definitions)
  const deepestChild = names.reduce((deepest, current) => {
    if (current.depth > deepest.depth) {
      return current
    }
    return deepest
  })

  return deepestChild
}

const shimPlugin = (options) => {
  const nr = options.newrelic
  return {
    requestDidStart(context) {
      let txId
      const shim = nr.shim
      const segmentMap = new Map()

      const segmento = nr.agent.tracer.getSegment()
      segmento.name = `Operation: ${context.operationName}`
      const sego = {
        segment: segmento,
        name: segmento.name
      }

      txId = segmento.transaction.id

      shim.setActiveSegment(segmento)

      segmentMap.set('root', sego)

      return {
        didResolveOperation(context) {
          let name = context.operationName
          if (!name) {
            name = deepestPath(context).name
          }

          const rootSeg = segmentMap.get('root').segment
          rootSeg.name = `Operation: ${name}`
          nr.setTransactionName(`Operation: ${name}`)
        },
        parsingDidStart() {
          const rootSeg = segmentMap.get('root').segment

          const seg = {
            segment: shim.createSegment('parsingStep', rootSeg),
            name: 'parsingStep'
          }

          seg.segment.start()
          shim.setActiveSegment(seg.segment)

          segmentMap.set('parsingStep', seg)

          return () => {
            const seg = segmentMap.get('parsingStep').segment

            if (seg) {
              seg.end()
              const rootSeg = segmentMap.get('root').segment
              shim.setActiveSegment(rootSeg)
            }
          }
        },
        validationDidStart() {
          const rootSeg = segmentMap.get('root').segment

          const seg = {
            segment: shim.createSegment('validationStep', rootSeg),
            name: 'validationStep'
          }

          seg.segment.start()
          shim.setActiveSegment(seg.segment)

          segmentMap.set('validationStep', seg)

          return () => {
            const seg = segmentMap.get('validationStep').segment

            if (seg) {
              seg.end()
              const rootSeg = segmentMap.get('root').segment
              shim.setActiveSegment(rootSeg)
            }
          }
        },
        executionDidStart: () => ({
          willResolveField({info}) {
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

              // test for correct transaction
              if(seg.segment.transaction.id !== txId) {
                console.log('WILL RESOLVE -  Tx BAD')
              }

              segmentMap.set(info.fieldName, seg)
            }

            return () => {
              if (isQueryOrMutation(arguments[0].info.parentType)) {
                const seg = segmentMap.get(info.fieldName).segment

                // test for correct transaction
                if(seg.transaction.id !== txId) {
                  console.log('RESOLVED - Tx BAD - segment txId: ', seg.transaction.id, ' | root txId ', txId)
                }

                if (seg) {
                  seg.end()
                  const rootSeg = segmentMap.get('root').segment
                  shim.setActiveSegment(rootSeg)
                }
              }
            }
          }
        })
      }
    }
  }
}

const isQueryOrMutation = (type) => {
  return type + '' === 'Query' || type + '' === 'Mutation'
}

module.exports = shimPlugin