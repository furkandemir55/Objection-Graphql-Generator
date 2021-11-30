import CustomModel from "./CustomModel";
import {JSONSchema, JSONSchemaDefinition} from "objection";

export type CustomFunction = (root?: any, args?: any, context?: any, info?: any) => any
export type CustomMutationFunctions =
    CustomFunction
    | { create?: CustomFunction, update?: CustomFunction, delete?: CustomFunction }
export type CustomQueryFunctions = CustomFunction | { single?: CustomFunction, multi?: CustomFunction }


// type CustomResolver = { [index in string]?: any; }
export type CustomResolver = any
export type Options = {
    mutationOptions?: MutationOptions, queryOptions?: QueryOptions, extendQueries?: string,
    extendMutations?: string, extendTypes?: string, extendResolvers?: CustomResolver,
    extendMutationResolvers?: CustomResolver, extendQueryResolvers?: CustomResolver,
    extendProps?: JSONSchemaProperties,
    queryFunction?: CustomQueryFunctions,
    mutationFunction?: CustomMutationFunctions
}
export type ModelsObject = { [index: string]: typeof CustomModel }
export type ArgumentKeys =
    'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'isNull' | 'likeNoCase' | 'in' | 'notIn' | 'orderBy'
    | 'orderByDesc' | 'range' | 'limit' | 'offset'
export type ArgumentType = string | false
export type QueryOptions = { [index in ArgumentKeys]?: ArgumentType; } | boolean;
export type MutationOptions = { create: boolean, update: boolean, delete: boolean } | boolean
export type JSONSchemaProperties = { [key: string]: JSONSchema; }
