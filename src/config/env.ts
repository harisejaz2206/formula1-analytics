// Environment configuration for F1 data providers
export const config = {
  f1: {
    provider: import.meta.env.VITE_F1_PROVIDER || 'jolpica',
    jolpica: {
      baseUrl: import.meta.env.VITE_JOLPICA_BASE || 'https://api.jolpi.ca/ergast/f1',
    },
    showDataSourceBadge: import.meta.env.VITE_SHOW_DATA_SOURCE_BADGE === 'true',
  },
  http: {
    timeout: 10000, // 10 seconds
    retries: 2,
    retryDelay: 1000, // 1 second, will use exponential backoff
  },
} as const;

export type F1Provider = typeof config.f1.provider;
