/**
 * Parser-specific types for GraphQL introspection
 */

export type TypeKind =
  | 'SCALAR'
  | 'OBJECT'
  | 'INTERFACE'
  | 'UNION'
  | 'ENUM'
  | 'INPUT_OBJECT'
  | 'LIST'
  | 'NON_NULL';

export interface IntrospectionTypeRef {
  kind: TypeKind;
  name: string | null;
  ofType: IntrospectionTypeRef | null;
}

export interface IntrospectionField {
  name: string;
  description?: string;
  type: IntrospectionTypeRef;
  isDeprecated?: boolean;
  deprecationReason?: string | null;
}

export interface IntrospectionType {
  kind: TypeKind;
  name: string;
  description?: string;
  fields?: IntrospectionField[] | null;
  interfaces?: IntrospectionTypeRef[] | null;
  possibleTypes?: IntrospectionTypeRef[] | null;
  enumValues?: Array<{ name: string; description?: string }> | null;
  inputFields?: IntrospectionField[] | null;
}

export interface IntrospectionSchema {
  queryType: { name: string } | null;
  mutationType: { name: string } | null;
  subscriptionType: { name: string } | null;
  types: IntrospectionType[];
}

export interface IntrospectionResult {
  __schema: IntrospectionSchema;
}

export interface ParsedIntrospection {
  types: IntrospectionType[];
  queryTypeName: string | null;
}
