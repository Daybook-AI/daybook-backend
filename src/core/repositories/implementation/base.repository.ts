// import { PrismaService } from "src/core/config/prisma/prisma.service";
// import { IBaseRepository } from "src/core/repositories/interface/base-repository.interface";

// export abstract class BaseRepository<TEntity, TCreate, TDelegate> implements IBaseRepository<TEntity, TCreate> {
//     protected constructor(
//         protected readonly delegate: TDelegate,
//     ) { }

//      create(data: TCreate): Promise<TEntity> {
//         return this.delegate.create({ data });
//     }
// }