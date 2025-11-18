export const tokenTypes = {
    ACCESS: 'access',
    REFRESH: 'refresh',
  } as const;
  
  export type TokenType = typeof tokenTypes[keyof typeof tokenTypes];