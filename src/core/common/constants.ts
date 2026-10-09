export const AppConstants = {
    passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,25}$/,
    accessTokenName: 'daybook_access_token',
    refreshTokenName: 'daybook_refresh_token',
} as const;
