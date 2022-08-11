import algoliasearch from 'algoliasearch/lite'
import { fetchAlgoliaResults } from '@algolia/autocomplete-preset-algolia'
import {
  InstantSearch,
  Highlight,
  Hits,
  Configure,
  Pagination
} from 'react-instantsearch-hooks-web'

import React, { useState } from 'react'
import { Paragraph, Card, TextInput } from '@contentful/f36-components'
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit'

const ALGOLIA_APP_ID = 'B1G2GM9NG0'
const ALGOLIA_SEARCH_TOKEN = 'aadef574be1f9252bb48d4ea09b5cfe5'

const searchClient = algoliasearch(
  ALGOLIA_APP_ID,
  ALGOLIA_SEARCH_TOKEN
)

const indexes = [
  {
    name: "demo_ecommerce",
    searchableAttributes: [
      "categories",
      "brand"
    ]
  }
]

function ProductCard ({ hit }) {
  return (
    <Card>
      <img src={hit.image} align="left" alt={hit.name} />
      <div className="hit-name">
        <Highlight attribute="name" hit={hit} />
      </div>
      <div className="hit-description">
        <Highlight attribute="description" hit={hit} />
      </div>
      <div className="hit-price">${hit.price}</div>
    </Card>
  )
}

function updateMappings(currentMappings, updateFn, facet, result) {
  console.log(currentMappings)
  if (currentMappings.filter((mapping) => mapping.facet === facet).length !== 0) return
  updateFn([...currentMappings, {
    facet,
    values: result[0].facetHits.map((hit) => `${hit.value} (${hit.count})`)
  }])
  console.log(currentMappings)
}


function Field (props) {
  const sdk = useSDK()
  sdk.window.startAutoResizer()

  const [indexAttributes, setIndexAttributes] = useState(sdk.field.getValue() || indexes[0])
  const [facetMappings, setFacetMappings] = useState([])

  const knownFacets = [
    "brand",
    "categories"
  ]
  for(let i = 0; i < knownFacets.length; i++) {
    fetchAlgoliaResults({
      searchClient,
      queries: [{
        indexName: indexAttributes.name,
        type: 'facet',
        facet: knownFacets[i],
        params: {
          maxFacetHits: 20
        }
      }]
    }).then((result) => {
      updateMappings(facetMappings, setFacetMappings, knownFacets[i], result)
    })
  }

  return (
    <>
      <TextInput
        value={indexAttributes.searchQuery || undefined}
        defaultValue=""
        onChange={async (e) => {
          const value = e.target.value
          setIndexAttributes({...indexAttributes, searchQuery: value})
          await sdk.field.setValue({...indexAttributes, searchQuery: value})
        }}
      />
      <Paragraph><b>Available Facets:</b></Paragraph>
      {facetMappings.map((mapping) => (<React.Fragment key={`facet-${mapping.facet}`}>
        <Paragraph><i>{mapping.facet}</i> - Sample values: {mapping.values.join(', ')}</Paragraph>
      </React.Fragment>))}

      <InstantSearch indexName={indexAttributes.name} searchClient={searchClient}>
        <Hits hitComponent={ProductCard} />
        <Configure
          filters={indexAttributes.searchQuery || undefined}
          hitsPerPage={8}
          distinct
        />
        <Pagination />
      </InstantSearch>
    </>
  )
}

export default Field
