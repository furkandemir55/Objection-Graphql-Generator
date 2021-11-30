import {CustomMutationFunctions, CustomQueryFunctions, Options} from "./types";
import SchemaBuilder from "./SchemaBuilder";
import Objection, {JSONSchema, Model, RelationType} from "objection";
import CustomModel from "./CustomModel";
import graphqlFields from "graphql-fields";

const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>


export const handleOptions: (builder: SchemaBuilder, options?: Options) => void = (builder, options) => {
    const handleQueryFunctions: (customFunctions?: CustomQueryFunctions) => void = customFunctions => {
        if (customFunctions) {
            if (typeof customFunctions === 'object') {
                if (customFunctions.single) builder.customQueryFunctionSingle = customFunctions.single
                if (customFunctions.multi) builder.customQueryFunctionMulti = customFunctions.multi
            } else {
                builder.customQueryFunctionSingle = customFunctions
                builder.customQueryFunctionMulti = customFunctions
            }
        }
    }

    const handleMutationFunctions: (customFunctions?: CustomMutationFunctions) => void = customFunctions => {
        if (customFunctions) {
            if (typeof customFunctions === 'object') {
                if (customFunctions.create) builder.customMutationFunctionCreate = customFunctions.create
                if (customFunctions.update) builder.customMutationFunctionUpdate = customFunctions.update
                if (customFunctions.delete) builder.customMutationFunctionDelete = customFunctions.delete
            } else {
                builder.customMutationFunctionCreate = customFunctions
                builder.customMutationFunctionUpdate = customFunctions
                builder.customMutationFunctionDelete = customFunctions
            }
        }
    }

    const handleOtherOptions: (options: Omit<Options, "queryFunction" | "mutationFunction">) => void = options => {
        getKeys(options).forEach((option) => {
            builder[option] = options[option]
        })
    }
    if (!options) return
    const {queryFunction, mutationFunction, ...otherOptions} = options
    handleQueryFunctions(queryFunction)
    handleMutationFunctions(mutationFunction)
    handleOtherOptions(otherOptions)
}

export const customFunctionHandler = async (func?: Function, ...params: any[]) => {
    if (!func) return
    if (func.constructor.name === 'AsyncFunction') {
        return await func(...params)
    }
    return func(...params)
}


const modifiers: Objection.Modifiers = {
    selectModifier(builder, args) {
        builder.select(args)
    },
    whereEqModifier(builder, args) {
        builder.where(args.field, args.value)
    },
    whereNotEqModifier(builder, args) {
        builder.whereNot(args.field, args.value)
    },
    whereGtModifier(builder, args) {
        builder.where(args.field, '>', args.value)
    },
    whereGteModifier(builder, args) {
        builder.where(args.field, '>=', args.value)
    },
    WhereLtModifier(builder, args) {
        builder.where(args.field, '<', args.value)
    },
    WhereLteModifier(builder, args) {
        builder.where(args.field, '<=', args.value)
    },
    whereLikeModifier(builder, args) {
        builder.where(args.field, 'like', args.value)
    },
    whereLikeNoCaseModifier(builder, args) {
        builder.where(args.field, 'iLike', args.value)
    },
    whereIsNullModifier(builder, args) {
        builder.whereNull(args.field)
    },
    whereInModifier(builder, args) {
        builder.whereIn(args.field, args.values)
    },
    whereNotInModifier(builder, args) {
        builder.whereNotIn(args.field, args.values)
    },
}

export const handleRelationMain = (builder: Objection.QueryBuilder<CustomModel>, args: any) => {
    const handleRelationField = (builder: Objection.QueryBuilder<CustomModel>, key: string, value: any) => {
        if (key.endsWith('In')) return builder.whereIn(key.split('In').slice(0, -1).join(''), value)
        else if (key.endsWith('NotIn')) return builder.whereNotIn(key.split('NotIn').slice(0, -1).join(''), value)
        else if (key.endsWith('Eq')) return builder.where(key.split('Eq').slice(0, -1).join(''), value)
        else if (key.endsWith('NotEq')) return builder.whereNot(key.split('NotEq').slice(0, -1).join(''), value)
        else if (key.endsWith('Gt')) return builder.where(key.split('Gt').slice(0, -1).join(''), '>', value)
        else if (key.endsWith('Gte')) return builder.where(key.split('Gte').slice(0, -1).join(''), '>=', value)
        else if (key.endsWith('Lt')) return builder.where(key.split('Lt').slice(0, -1).join(''), '<', value)
        else if (key.endsWith('Lte')) return builder.where(key.split('Lte').slice(0, -1).join(''), '<=', value)
        else if (key.endsWith('Like')) return builder.where(key.split('Like').slice(0, -1).join(''), 'like', value)
        else if (key.endsWith('LikeNoCase')) return builder.where(key.split('LikeNoCase').slice(0, -1).join(''), 'iLike', value)
        else if (key.endsWith('IsNull')) return builder.whereNull(key.split('IsNull').slice(0, -1).join(''))
    }

    for (const [key, value] of Object.entries<any>(args)) {
        handleRelationField(builder, key, value)
    }
}

export const queryResolver = (builder: Objection.QueryBuilder<CustomModel>, info: any) => {
    const query = graphqlFields(info, {}, {processArguments: true, excludedFields: ['__typename']})
    const handleRelationField = (modifyArray: any[], field: any) => {
        const key = Object.keys(field)[0]
        if (key.endsWith('In')) return modifyArray.push((query: any) => query.modify('whereInModifier', {
            field: key.split('In').slice(0, -1).join(''),
            values: field[key].value
        }))
        else if (key.endsWith('NotIn')) return modifyArray.push((query: any) => query.modify('whereNotInModifier', {
            field: key.split('NotIn').slice(0, -1).join(''),
            values: field[key].value
        }))
        else if (key.endsWith('Eq'))
            return modifyArray.push((query: any) => query.modify('whereEqModifier', {
                field: key.split('Eq').slice(0, -1).join(''),
                value: field[key].value
            }))
        else if (key.endsWith('NotEq')) return modifyArray.push((query: any) => query.modify('whereNotEqModifier', {
            field: key.split('NotEq').slice(0, -1).join(''),
            value: field[key].value
        }))
        else if (key.endsWith('Gt')) return modifyArray.push((query: any) => query.modify('whereGtModifier', {
            field: key.split('Gt').slice(0, -1).join(''),
            value: field[key].value
        }))
        else if (key.endsWith('Gte')) return modifyArray.push((query: any) => query.modify('whereGteModifier', {
            field: key.split('Gte').slice(0, -1).join(''),
            value: field[key].value
        }))
        else if (key.endsWith('Lt')) return modifyArray.push((query: any) => query.modify('whereLtModifier', {
            field: key.split('Lt').slice(0, -1).join(''),
            value: field[key].value
        }))
        else if (key.endsWith('Lte')) return modifyArray.push((query: any) => query.modify('whereLteModifier', {
            field: key.split('Lte').slice(0, -1).join(''),
            value: field[key].value
        }))
        else if (key.endsWith('Like')) return modifyArray.push((query: any) => query.modify('whereLikeModifier', {
            field: key.split('Eq').slice(0, -1).join(''),
            value: field[key].value
        }))
        else if (key.endsWith('LikeNoCase')) return modifyArray.push((query: any) => query.modify('whereLikeNoCaseModifier', {
            field: key.split('LikeNoCase').slice(0, -1).join(''),
            value: field[key].value
        }))
        else if (key.endsWith('IsNull')) return modifyArray.push((query: any) => query.modify('whereIsNullModifier', {
            field: key.split('IsNull').slice(0, -1).join(''),
            value: field[key].value
        }))
    }
    const handleRelation = (graph: any, ayo: any) => {
        graph.$modify = []
        const selectFields: string[] = []
        for (const [key, value] of Object.entries<any>(ayo)) {
            if (!Object.values(value).length) selectFields.push(key)
            else if (key === '__arguments') {
                value.forEach((k: any) => {
                    handleRelationField(graph.$modify, k)
                })
            } else {
                graph[key] = handleRelation({}, value)
            }
        }
        graph.$modify.push((query: any) => query.modify('selectModifier', selectFields))
        return graph
    }
    const graph: any = {}
    for (const [key, value] of Object.entries<any>(query)) {
        if (!Object.values(value).length) builder.select(key)
        else graph[key] = handleRelation({}, value)
    }
    return builder.withGraphFetched(graph).modifiers(modifiers)
}


export const buildTypeDefs = (field: string, relatedModelName: string, fields: JSONSchema, relationType: RelationType) => {
    const resolveType = (type: string) => {
        if (type === 'string') return 'String'
        if (type === 'integer') return 'Int'
        else return type.charAt(0).toUpperCase() + type.substring(1)
    }
    let args = ''
    const modifiers = [{value: 'In', array: true}, {value: 'NotIn', array: true}, {value: 'Eq'}, {value: 'NotEq'},
        {value: 'Gt'}, {value: 'Gte'}, {value: 'Lt'}, {value: 'Lte'}, {value: 'Like'},
        {value: 'LikeNoCase'}, {value: 'IsNull'}]

    for (const [key, value] of Object.entries(fields)) {
        if (value.type === 'object') continue
        const type = resolveType(value.type as string)
        modifiers.forEach(modifier => {
            args += modifier.array ? `${key}${modifier.value}: [${type}], ` : `${key}${modifier.value}: ${type}, `
        })
    }
    if (relationType === Model.HasManyRelation || relationType === Model.ManyToManyRelation) return `
${field}(${args}): [${relatedModelName}]`
    return `
${field}(${args}): ${relatedModelName}`

}
export const builderQueryTypeDefs = (fields: JSONSchema, relatedModelName: string) => {
    const camelCaseName = `${relatedModelName.charAt(0).toLowerCase()}${relatedModelName.substring(1)}`
    const resolveType = (type: string) => {
        if (type === 'string') return 'String'
        if (type === 'integer') return 'Int'
        else return type.charAt(0).toUpperCase() + type.substring(1)
    }
    let args = ''
    const modifiers = [{value: 'In', array: true}, {value: 'NotIn', array: true}, {value: 'Eq'}, {value: 'NotEq'},
        {value: 'Gt'}, {value: 'Gte'}, {value: 'Lt'}, {value: 'Lte'}, {value: 'Like'},
        {value: 'LikeNoCase'}, {value: 'IsNull'}]

    for (const [key, value] of Object.entries(fields)) {
        if (value.type === 'object') continue //todo object fields?
        const type = resolveType(value.type as string)
        modifiers.forEach(modifier => {
            args += modifier.array ? `${key}${modifier.value}: [${type}], ` : `${key}${modifier.value}: ${type}, `
        })
    }
    return `
${camelCaseName}(${args}): ${relatedModelName}
${camelCaseName}s(${args}): [${relatedModelName}]
`

}


export function isSchema(arg: any): arg is JSONSchema {
    return true
}

export const getRegularFields = (model: typeof CustomModel, customFields?: { [key: string]: JSONSchema }) => {
    const fields: { [key: string]: JSONSchema } = {}
    if (model.jsonSchema && model.jsonSchema.properties)
        for (const [key, value] of Object.entries(model.jsonSchema.properties)) {
            if (!isSchema(value)) continue
            if (value.type === 'object' && model.relationMappings.hasOwnProperty(key)) continue
            fields[key] = value
        }
    if (customFields) {
        if ((model.graphqlOptions && !model.graphqlOptions.extraProps)) return fields
        for (const [key, value] of Object.entries(customFields)) {
            if (value.type === 'object' && model.relationMappings.hasOwnProperty(key)) continue
            fields[key] = value
        }
    }
    return fields
}
