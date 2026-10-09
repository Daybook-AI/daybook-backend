export interface IHashUtility {
    hash(data: string): Promise<string>;
    verify(hash: string, data: string): Promise<boolean>;
}