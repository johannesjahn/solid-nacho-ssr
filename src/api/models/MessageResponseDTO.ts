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
import type { UserResponseDTO } from './UserResponseDTO';
import {
    UserResponseDTOFromJSON,
    UserResponseDTOFromJSONTyped,
    UserResponseDTOToJSON,
} from './UserResponseDTO';

/**
 * 
 * @export
 * @interface MessageResponseDTO
 */
export interface MessageResponseDTO {
    /**
     * 
     * @type {number}
     * @memberof MessageResponseDTO
     */
    id: number;
    /**
     * 
     * @type {Date}
     * @memberof MessageResponseDTO
     */
    createdAt: Date;
    /**
     * 
     * @type {Date}
     * @memberof MessageResponseDTO
     */
    updatedAt: Date;
    /**
     * 
     * @type {string}
     * @memberof MessageResponseDTO
     */
    content: string;
    /**
     * 
     * @type {string}
     * @memberof MessageResponseDTO
     */
    contentType: string;
    /**
     * 
     * @type {UserResponseDTO}
     * @memberof MessageResponseDTO
     */
    author: UserResponseDTO;
}

/**
 * Check if a given object implements the MessageResponseDTO interface.
 */
export function instanceOfMessageResponseDTO(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "id" in value;
    isInstance = isInstance && "createdAt" in value;
    isInstance = isInstance && "updatedAt" in value;
    isInstance = isInstance && "content" in value;
    isInstance = isInstance && "contentType" in value;
    isInstance = isInstance && "author" in value;

    return isInstance;
}

export function MessageResponseDTOFromJSON(json: any): MessageResponseDTO {
    return MessageResponseDTOFromJSONTyped(json, false);
}

export function MessageResponseDTOFromJSONTyped(json: any, ignoreDiscriminator: boolean): MessageResponseDTO {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': json['id'],
        'createdAt': (new Date(json['createdAt'])),
        'updatedAt': (new Date(json['updatedAt'])),
        'content': json['content'],
        'contentType': json['contentType'],
        'author': UserResponseDTOFromJSON(json['author']),
    };
}

export function MessageResponseDTOToJSON(value?: MessageResponseDTO | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'createdAt': (value.createdAt.toISOString()),
        'updatedAt': (value.updatedAt.toISOString()),
        'content': value.content,
        'contentType': value.contentType,
        'author': UserResponseDTOToJSON(value.author),
    };
}

