import { Injectable } from "@nestjs/common";
import argon2, { argon2id } from "argon2";
import { IHashUtility } from "src/core/utility/interface/hash-utility.interface";

@Injectable()
export class HashUtility implements IHashUtility {
    async hash(data: string): Promise<string> {
        return argon2.hash(data, {
            type: argon2id
        });
    }

    async verify(hash: string, data: string): Promise<boolean> {
        return argon2.verify(hash, data);
    }
}