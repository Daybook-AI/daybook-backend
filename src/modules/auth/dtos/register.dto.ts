import { IsEmail, IsNotEmpty, IsString, Length, Matches, MinLength } from "class-validator";
import { ErrorMessagesEnum } from "src/core/enums/errors.enum";
import { IntersectionType } from '@nestjs/mapped-types';
import { AppConstants } from "src/core/common/constants";

export class EmailDto {
    @IsNotEmpty()
    @IsEmail()
    email!: string;
}

export class PasswordDto {
    @IsNotEmpty()
    @IsString()
    @Matches(
        AppConstants.passwordRegex,
        {
            message: ErrorMessagesEnum.PasswordErrorMessage
        }
    )
    password!: string;
}

export class UsernameDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    username!: string;
}

export class RegisterPayloadDto extends IntersectionType(
    IntersectionType(EmailDto, PasswordDto),
    UsernameDto
) { }

export class OtpVerifyPayloadDto extends EmailDto {
    @IsString({ message: ErrorMessagesEnum.OtpVerificationFailed })
    @IsNotEmpty({ message: ErrorMessagesEnum.OtpVerificationFailed })
    @MinLength(6, { message: ErrorMessagesEnum.OtpVerificationFailed })
    @Length(6, 6, { message: ErrorMessagesEnum.OtpVerificationFailed })
    otp!: string;
}

export class LoginPayloadDto extends IntersectionType(EmailDto, PasswordDto) { }
