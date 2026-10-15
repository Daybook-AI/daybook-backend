export enum ErrorMessagesEnum {
    PasswordErrorMessage = 'Password must be 6-25 characters and contain one uppercase letter, one lowercase letter, one number, and one of these special characters: @$!%*?&',
    BadRequest = 'Your request is invalid.',

    EmailConflictErrorMessage = 'Email already exists.',
    EmailSentFailed = 'Failed to send email',
    OtpVerificationFailed = 'Invalid Opt.',

    LoginInvalidPayload = 'Invalid email or password',
    SessionExpired = 'Your session has expired.',
    Unauthenticated = 'User is not authenticated',

    AccessTokenMissing = 'Access token is missing',
    InvalidAccessToken = 'Invalid access token payload',
    ExpiredAcccesToken = 'Invalid or expired access token',

    RefreshTokenMissing = 'Refresh token is missing',
    InvalidRefreshToken = 'Invalid refresh token payload',
    ExpiredRefreshtoken = 'Invalid or expired refresh token',

    JournalIdRequired = 'Journal ID is required',
    FailedDbOp = 'Failed to get the requested item.',
}
