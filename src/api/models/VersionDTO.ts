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
 * @interface VersionDTO
 */
export interface VersionDTO {
    /**
     * 
     * @type {string}
     * @memberof VersionDTO
     */
    version: string;
}

/**
 * Check if a given object implements the VersionDTO interface.
 */
export function instanceOfVersionDTO(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "version" in value;

    return isInstance;
}

export function VersionDTOFromJSON(json: any): VersionDTO {
    return VersionDTOFromJSONTyped(json, false);
}

export function VersionDTOFromJSONTyped(json: any, ignoreDiscriminator: boolean): VersionDTO {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'version': json['version'],
    };
}

export function VersionDTOToJSON(value?: VersionDTO | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'version': value.version,
    };
}

