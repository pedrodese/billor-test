import { IsArray, ArrayNotEmpty, ValidateNested, IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class LoadDto {
    @IsInt()
    load_id: number; // Adiciona o campo `load_id` como obrigatório e do tipo inteiro
    @IsOptional() @IsString() origin?: string;
    @IsOptional() @IsString() destination?: string;
    @IsOptional() @IsString() pickupTime?: string;
    @IsOptional() @IsString() deliveryTime?: string;
    @IsOptional() @IsString() route?: string;
    @IsOptional() @IsString() loadedWeight?: string;
    @IsOptional() @IsString() equipment?: string;
}


export class SummarizeLoadsDto {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => LoadDto)
    loads: LoadDto[];
}
