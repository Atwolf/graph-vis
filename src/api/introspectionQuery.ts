/**
 * GraphQL introspection query for Nautobot
 */

export const INTROSPECTION_QUERY = `
query NautobotSchemaIntrospection {
  __schema {
    queryType { name }
    types {
      kind
      name
      description

      fields {
        name
        description
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }

      interfaces {
        kind
        name
      }

      possibleTypes {
        kind
        name
      }
    }
  }
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}
`;
