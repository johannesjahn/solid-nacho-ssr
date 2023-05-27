/* tslint:disable */
/* eslint-disable */
/**
 * Chat - API
 * Chat - API Description
 *
 * The version of the OpenAPI document: 1.1.52
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
 * @interface UpdateReplyDTO
 */
export interface UpdateReplyDTO {
    /**
     * 
     * @type {number}
     * @memberof UpdateReplyDTO
     */
    replyId: number;
    /**
     * 
     * @type {string}
     * @memberof UpdateReplyDTO
     */
    content: string;
}

/**
 * Check if a given object implements the UpdateReplyDTO interface.
 */
export function instanceOfUpdateReplyDTO(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "replyId" in value;
    isInstance = isInstance && "content" in value;

    return isInstance;
}

export function UpdateReplyDTOFromJSON(json: any): UpdateReplyDTO {
    return UpdateReplyDTOFromJSONTyped(json, false);
}

export function UpdateReplyDTOFromJSONTyped(json: any, ignoreDiscriminator: boolean): UpdateReplyDTO {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'replyId': json['replyId'],
        'content': json['content'],
    };
}

export function UpdateReplyDTOToJSON(value?: UpdateReplyDTO | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'replyId': value.replyId,
        'content': value.content,
    };
}

