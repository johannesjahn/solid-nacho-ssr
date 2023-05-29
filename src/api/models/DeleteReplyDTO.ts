/* tslint:disable */
/* eslint-disable */
/**
 * Chat - API
 * Chat - API Description
 *
 * The version of the OpenAPI document: 1.1.58
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
 * @interface DeleteReplyDTO
 */
export interface DeleteReplyDTO {
    /**
     * 
     * @type {number}
     * @memberof DeleteReplyDTO
     */
    replyId: number;
}

/**
 * Check if a given object implements the DeleteReplyDTO interface.
 */
export function instanceOfDeleteReplyDTO(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "replyId" in value;

    return isInstance;
}

export function DeleteReplyDTOFromJSON(json: any): DeleteReplyDTO {
    return DeleteReplyDTOFromJSONTyped(json, false);
}

export function DeleteReplyDTOFromJSONTyped(json: any, ignoreDiscriminator: boolean): DeleteReplyDTO {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'replyId': json['replyId'],
    };
}

export function DeleteReplyDTOToJSON(value?: DeleteReplyDTO | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'replyId': value.replyId,
    };
}

