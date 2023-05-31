/* tslint:disable */
/* eslint-disable */
/**
 * Chat - API
 * Chat - API Description
 *
 * The version of the OpenAPI document: 1.1.60
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface DeletePostDTO
 */
export interface DeletePostDTO {
    /**
     * 
     * @type {number}
     * @memberof DeletePostDTO
     */
    id: number;
}

/**
 * Check if a given object implements the DeletePostDTO interface.
 */
export function instanceOfDeletePostDTO(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "id" in value;

    return isInstance;
}

export function DeletePostDTOFromJSON(json: any): DeletePostDTO {
    return DeletePostDTOFromJSONTyped(json, false);
}

export function DeletePostDTOFromJSONTyped(json: any, ignoreDiscriminator: boolean): DeletePostDTO {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': json['id'],
    };
}

export function DeletePostDTOToJSON(value?: DeletePostDTO | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
    };
}

