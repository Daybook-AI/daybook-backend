import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtUtility } from 'src/core/utility/implementation/jwt.utility';


@Module({
    imports: [
        ConfigModule,

        JwtModule.register({}),
    ],

    providers: [JwtUtility],

    exports: [JwtUtility],
})
export class JwtUtilityModule { }