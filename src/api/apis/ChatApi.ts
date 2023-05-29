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


import * as runtime from '../runtime';
import type {
  ConversationResponseDTO,
  CreateConversationRequestDTO,
  CreateMessageDTO,
  GetMessagesDTO,
  MessageResponseDTO,
} from '../models';
import {
    ConversationResponseDTOFromJSON,
    ConversationResponseDTOToJSON,
    CreateConversationRequestDTOFromJSON,
    CreateConversationRequestDTOToJSON,
    CreateMessageDTOFromJSON,
    CreateMessageDTOToJSON,
    GetMessagesDTOFromJSON,
    GetMessagesDTOToJSON,
    MessageResponseDTOFromJSON,
    MessageResponseDTOToJSON,
} from '../models';

export interface ChatControllerCreateConversationRequest {
    createConversationRequestDTO: CreateConversationRequestDTO;
}

export interface ChatControllerGetMessagesRequest {
    getMessagesDTO: GetMessagesDTO;
}

export interface ChatControllerSendMessageRequest {
    createMessageDTO: CreateMessageDTO;
}

/**
 * 
 */
export class ChatApi extends runtime.BaseAPI {

    /**
     * Endpoint to create a new conversation with two or more participants (authenticated user is automatically added to the conversation)
     * 
     */
    async chatControllerCreateConversationRaw(requestParameters: ChatControllerCreateConversationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ConversationResponseDTO>> {
        if (requestParameters.createConversationRequestDTO === null || requestParameters.createConversationRequestDTO === undefined) {
            throw new runtime.RequiredError('createConversationRequestDTO','Required parameter requestParameters.createConversationRequestDTO was null or undefined when calling chatControllerCreateConversation.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/app/chat/create-conversation`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: CreateConversationRequestDTOToJSON(requestParameters.createConversationRequestDTO),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ConversationResponseDTOFromJSON(jsonValue));
    }

    /**
     * Endpoint to create a new conversation with two or more participants (authenticated user is automatically added to the conversation)
     * 
     */
    async chatControllerCreateConversation(requestParameters: ChatControllerCreateConversationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ConversationResponseDTO> {
        const response = await this.chatControllerCreateConversationRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Endpoint to get all conversations for the authenticated user
     * 
     */
    async chatControllerGetConversationsRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<ConversationResponseDTO>>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/app/chat/get-conversations`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(ConversationResponseDTOFromJSON));
    }

    /**
     * Endpoint to get all conversations for the authenticated user
     * 
     */
    async chatControllerGetConversations(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<ConversationResponseDTO>> {
        const response = await this.chatControllerGetConversationsRaw(initOverrides);
        return await response.value();
    }

    /**
     * Endpoint to get messages relevant for the authenticated user
     * 
     */
    async chatControllerGetMessagesRaw(requestParameters: ChatControllerGetMessagesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ConversationResponseDTO>> {
        if (requestParameters.getMessagesDTO === null || requestParameters.getMessagesDTO === undefined) {
            throw new runtime.RequiredError('getMessagesDTO','Required parameter requestParameters.getMessagesDTO was null or undefined when calling chatControllerGetMessages.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/app/chat/get-messages`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: GetMessagesDTOToJSON(requestParameters.getMessagesDTO),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ConversationResponseDTOFromJSON(jsonValue));
    }

    /**
     * Endpoint to get messages relevant for the authenticated user
     * 
     */
    async chatControllerGetMessages(requestParameters: ChatControllerGetMessagesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ConversationResponseDTO> {
        const response = await this.chatControllerGetMessagesRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Send a message to a conversation
     * 
     */
    async chatControllerSendMessageRaw(requestParameters: ChatControllerSendMessageRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<MessageResponseDTO>> {
        if (requestParameters.createMessageDTO === null || requestParameters.createMessageDTO === undefined) {
            throw new runtime.RequiredError('createMessageDTO','Required parameter requestParameters.createMessageDTO was null or undefined when calling chatControllerSendMessage.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("bearer", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/app/chat/send-message`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: CreateMessageDTOToJSON(requestParameters.createMessageDTO),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => MessageResponseDTOFromJSON(jsonValue));
    }

    /**
     * Send a message to a conversation
     * 
     */
    async chatControllerSendMessage(requestParameters: ChatControllerSendMessageRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<MessageResponseDTO> {
        const response = await this.chatControllerSendMessageRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
