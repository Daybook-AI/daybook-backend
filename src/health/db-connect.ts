import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/core/config/prisma/prisma.service';
import { Public } from 'src/core/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('db')
    async checkDatabase() {
        try {
            // Run a lightweight raw query or count check
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: 'success', message: 'Successfully connected to PostgreSQL!' };
        } catch (error: any) {
            return { status: 'error', message: 'Failed to connect to database', error: error.message };
        }
    }
}