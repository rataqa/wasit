export const HEADERS = {
  CORRELATION_ID: 'x-correlation-id',

  API_KEY: 'x-api-key',

  AZURE_API_KEY: 'ocp-apim-subscription-key',

  IBM_CLIENT_ID: 'x-ibm-client-id',
  IBM_CLIENT_SECRET: 'x-ibm-client-secret',

  // The unique identifier for the entire trace.
  DD_TRACE_ID: 'x-datadog-trace-id',

  // The ID of the span that triggered the current request.
  DD_PARENT_ID: 'x-datadog-parent-id',

  CONTENT_TYPE: 'content-type',

  ERROR_CODE: 'x-error-code',
  RESPONSE_TIME: 'x-response-time',
};

export const CONTENT_TYPES = {
  JSON: 'application/json',
};

export const EXT_REQUIRED_HEADERS = [
  HEADERS.CORRELATION_ID,
  HEADERS.DD_TRACE_ID,
  HEADERS.DD_PARENT_ID,
  HEADERS.AZURE_API_KEY,
];

export const INT_REQUIRED_HEADERS = [
  HEADERS.CORRELATION_ID,
  HEADERS.DD_TRACE_ID,
  HEADERS.DD_PARENT_ID,
  HEADERS.IBM_CLIENT_ID,
];

export const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const LOCALE_REGEX = [
  { pattern: /ar/i, code: 'ar' },
  { pattern: /en/i, code: 'en' },
];
