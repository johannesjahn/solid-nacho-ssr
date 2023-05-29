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
import type { CommentResponseDTO } from './CommentResponseDTO';
import {
    CommentResponseDTOFromJSON,
    CommentResponseDTOFromJSONTyped,
    CommentResponseDTOToJSON,
} from './CommentResponseDTO';
import type { UserResponseDTO } from './UserResponseDTO';
import {
    UserResponseDTOFromJSON,
    UserResponseDTOFromJSONTyped,
    UserResponseDTOToJSON,
} from './UserResponseDTO';

/**
 * 
 * @export
 * @interface PostResponseDTO
 */
export interface PostResponseDTO {
    /**
     * 
     * @type {number}
     * @memberof PostResponseDTO
     */
    id: number;
    /**
     * 
     * @type {Date}
     * @memberof PostResponseDTO
     */
    createdAt: Date;
    /**
     * 
     * @type {Date}
     * @memberof PostResponseDTO
     */
    updatedAt: Date;
    /**
     * 
     * @type {string}
     * @memberof PostResponseDTO
     */
    content: string;
    /**
     * 
     * @type {string}
     * @memberof PostResponseDTO
     */
    contentType: string;
    /**
     * 
     * @type {UserResponseDTO}
     * @memberof PostResponseDTO
     */
    author: UserResponseDTO | null;
    /**
     * 
     * @type {Array<CommentResponseDTO>}
     * @memberof PostResponseDTO
     */
    comments: Array<CommentResponseDTO> | null;
}

/**
 * Check if a given object implements the PostResponseDTO interface.
 */
export function instanceOfPostResponseDTO(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "id" in value;
    isInstance = isInstance && "createdAt" in value;
    isInstance = isInstance && "updatedAt" in value;
    isInstance = isInstance && "content" in value;
    isInstance = isInstance && "contentType" in value;
    isInstance = isInstance && "author" in value;
    isInstance = isInstance && "comments" in value;

    return isInstance;
}

export function PostResponseDTOFromJSON(json: any): PostResponseDTO {
    return PostResponseDTOFromJSONTyped(json, false);
}

export function PostResponseDTOFromJSONTyped(json: any, ignoreDiscriminator: boolean): PostResponseDTO {
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
        'comments': (json['comments'] === null ? null : (json['comments'] as Array<any>).map(CommentResponseDTOFromJSON)),
    };
}

export function PostResponseDTOToJSON(value?: PostResponseDTO | null): any {
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
        'comments': (value.comments === null ? null : (value.comments as Array<any>).map(CommentResponseDTOToJSON)),
    };
}

