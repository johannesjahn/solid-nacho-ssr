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
 * @interface CreateMessageDTO
 */
export interface CreateMessageDTO {
    /**
     * 
     * @type {number}
     * @memberof CreateMessageDTO
     */
    conversationId: number;
    /**
     * 
     * @type {string}
     * @memberof CreateMessageDTO
     */
    content: string;
    /**
     * 
     * @type {string}
     * @memberof CreateMessageDTO
     */
    contentType: string;
}

/**
 * Check if a given object implements the CreateMessageDTO interface.
 */
export function instanceOfCreateMessageDTO(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "conversationId" in value;
    isInstance = isInstance && "content" in value;
    isInstance = isInstance && "contentType" in value;

    return isInstance;
}

export function CreateMessageDTOFromJSON(json: any): CreateMessageDTO {
    return CreateMessageDTOFromJSONTyped(json, false);
}

export function CreateMessageDTOFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateMessageDTO {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'conversationId': json['conversationId'],
        'content': json['content'],
        'contentType': json['contentType'],
    };
}

export function CreateMessageDTOToJSON(value?: CreateMessageDTO | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'conversationId': value.conversationId,
        'content': value.content,
        'contentType': value.contentType,
    };
}

