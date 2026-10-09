export interface IResponse<T = null> {
    status: 'success' | 'failed';
    message: string;
    data?: T
}

export interface IBaseEntity {
    id: number;
    createdAt?: Date;
    updatedAt?: Date;
}