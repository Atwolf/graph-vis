/**
 * Nautobot GraphQL API client
 */

import { INTROSPECTION_QUERY } from './introspectionQuery';

export interface NautobotConfig {
  url: string;
  apiToken: string;
}

/**
 * Fetch GraphQL introspection data from Nautobot instance
 *
 * @param config - Nautobot URL and API token
 * @returns Introspection result
 */
export async function fetchNautobotSchema(
  config: NautobotConfig
): Promise<any> {
  // Remove trailing slash from URL if present
  const baseUrl = config.url.replace(/\/$/, '');
  const graphqlUrl = `${baseUrl}/api/graphql/`;

  console.log('[API] Sending GraphQL introspection query', {
    url: graphqlUrl,
    timestamp: new Date().toISOString()
  });

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${config.apiToken}`,
    },
    body: JSON.stringify({
      query: INTROSPECTION_QUERY,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch schema: ${response.status} ${response.statusText}`
    );
  }

  const result = await response.json() as any;

  const typeCount = result.data?.__schema?.types?.length || 0;
  console.log('[API] Received introspection response', {
    typeCount,
    hasQueryType: !!result.data?.__schema?.queryType,
    timestamp: new Date().toISOString()
  });

  if (result.errors) {
    throw new Error(
      `GraphQL errors: ${JSON.stringify(result.errors)}`
    );
  }

  return result;
}

/**
 * Load Nautobot configuration from environment variables
 *
 * @returns Nautobot configuration
 */
export function loadNautobotConfig(): NautobotConfig {
  const url = process.env.NAUTOBOT_URL;
  const apiToken = process.env.NAUTOBOT_API_TOKEN;

  if (!url || !apiToken) {
    throw new Error(
      'Missing Nautobot configuration. Set NAUTOBOT_URL and NAUTOBOT_API_TOKEN environment variables.'
    );
  }

  return { url, apiToken };
}
