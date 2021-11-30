import CustomModel from "./CustomModel";
import {
    builderQueryTypeDefs,
    buildTypeDefs,
    customFunctionHandler,
    getRegularFields,
    handleOptions,
    handleRelationMain,
    isSchema,
    queryResolver
} from "./utils";
import {
    CustomFunction,
    CustomResolver,
    JSONSchemaProperties,
    ModelsObject,
    MutationOptions,
    Options,
    QueryOptions
} from "./types";

// import {makeExecutableSchema} from "@graphql-tools/schema";


class SchemaBuilder {
    models: ModelsObject = {}
    queryOptions: QueryOptions = true
    mutationOptions: MutationOptions = true
    extendTypes = ''
    extendQueries = ''
    extendMutations = ''
    extendResolvers: CustomResolver = {}
    extendMutationResolvers: CustomResolver = {}
    extendQueryResolvers: CustomResolver = {}
    extendProps: JSONSchemaProperties = {}

    customQueryFunctionSingle?: CustomFunction
    customQueryFunctionMulti?: CustomFunction
    customMutationFunctionCreate?: CustomFunction
    customMutationFunctionUpdate?: CustomFunction
    customMutationFunctionDelete?: CustomFunction

    constructor(models: (typeof CustomModel)[], options?: Options) {
        this.models = models.reduce<ModelsObject>((models, model) => ({
            ...models,
            [model.name]: model
        }), {});
        handleOptions(this, options)
    }

    buildModelTypeDefs() {
        const resolveType = (type: string) => {
            if (type === 'string') return 'String'
            if (type === 'integer') return 'Int'
            else return type.charAt(0).toUpperCase() + type.substring(1)
        }


        let modelTypeDefs = ''
        for (const key of Object.keys(this.models)) {
            const model = this.models[key]
            let modelTypeDef = `
type ${model.name}{`
            let modelTypeDefCreate = `
input ${model.name}CreateInput {`
            let modelTypeDefUpdate = `
input ${model.name}UpdateInput {`

            const fields = model.jsonSchema.properties
            if (!fields) throw new Error(`${model.name} jsonSchema properties is missing`)
            const fields2: typeof fields = this.extendProps
            const ff: typeof fields[] = []
            if (isSchema(fields)) ff.push(fields)
            if (isSchema(fields2)) ff.push(fields2)

            ff.forEach(f => {
                Object.keys(f).forEach(key => {
                    const field: { relationName: string, type: string } = fields[key] as any || fields2[key]
                    const fieldType = field.type
                    if (fieldType === 'object') {
                        const relationMappings: any = model.relationMappings
                        const relation = relationMappings[key] || relationMappings[field.relationName]
                        const relatedModel = relation.connectModel || relation.modelClass
                        const relatedModelName = relatedModel.name
                        modelTypeDef += buildTypeDefs(key, relatedModelName, {...fields, ...fields2}, relation.relation)
                    } else {
                        modelTypeDef += `
${key}: ${resolveType(fieldType)}`
                        modelTypeDefCreate += `
${key}: ${resolveType(fieldType)}`
                        modelTypeDefUpdate += `
${key}: ${resolveType(fieldType)}`
                    }
                })

            })

            modelTypeDefs += modelTypeDef + '\n}' + modelTypeDefCreate + '\n}' + modelTypeDefUpdate + '\n}\n' + this.extendTypes
        }
        return modelTypeDefs
    }

    buildQueryTypeDefs() {
        let queryTypeDefs = `\ntype Query{`
        if (!this.queryOptions) return queryTypeDefs

        for (const key of Object.keys(this.models)) {
            const model = this.models[key]
            const camelCaseName = `${model.name.charAt(0).toLowerCase()}${model.name.substring(1)}`
            const idField = model.idColumn
            const fields = getRegularFields(model, this.extendProps)

            if (model.graphqlOptions?.generateDefaultQueries)
                queryTypeDefs += builderQueryTypeDefs(fields, model.name)
//                 queryTypeDefs += `
// ${camelCaseName}(${idField}: Int!): ${model.name}
// ${camelCaseName}s(${idField}Array: [Int]): [${model.name}]
// `
        }
        queryTypeDefs += this.extendQueries + '\n}'
        return queryTypeDefs
    }

    buildMutationTypeDefs() {
        let mutationTypeDefs = '\ntype Mutation{'
        if (!this.mutationOptions) return mutationTypeDefs
        for (const key of Object.keys(this.models)) {
            const model = this.models[key]
            const camelCaseName = `${model.name.charAt(0).toLowerCase()}${model.name.substring(1)}`
            const idField = model.idColumn
            if (model.graphqlOptions?.generateDefaultMutations && typeof idField === 'string')
                mutationTypeDefs += `
create${model.name}(${camelCaseName}: ${model.name}CreateInput!): ${model.name}!
update${model.name}(${idField}: Int!, ${camelCaseName}: ${model.name}UpdateInput!): ${model.name}!
delete${model.name}(${idField}: Int!): Boolean
`
        }
        mutationTypeDefs += this.extendMutations + '\n}'
        return mutationTypeDefs
    }

    buildTypeDefs() {
        return this.buildModelTypeDefs() + this.buildQueryTypeDefs() + this.buildMutationTypeDefs()
    }

    buildQueryResolvers() {
        let queryResolvers: any = {}
        for (const key of Object.keys(this.models)) {
            const model = this.models[key]
            const camelCaseName = `${model.name.charAt(0).toLowerCase()}${model.name.substring(1)}`
            if (model.graphqlOptions?.generateDefaultQueries) {
                queryResolvers[camelCaseName] = async (root: any, args: any, context: any, info: any) => {
                    const builder = model.query()
                    handleRelationMain(builder, args)
                    const customFunctionResult = await customFunctionHandler(this.customQueryFunctionSingle, root, args, context, info)
                    if (customFunctionResult) return customFunctionResult
                    return queryResolver(builder, info)
                }
                queryResolvers[`${camelCaseName}s`] =
                    async (root: any, args: any, context: any, info: any) => {
                        const builder = model.query()
                        handleRelationMain(builder, args)
                        const customFunctionResult = await customFunctionHandler(this.customQueryFunctionMulti, root, args, context, info)
                        if (customFunctionResult) return customFunctionResult
                        return queryResolver(builder, info)
                    }
            }
            if (model.graphqlOptions && model.graphqlOptions.queryResolvers) queryResolvers = {...queryResolvers, ...model.graphqlOptions.queryResolvers}

        }
        return {...queryResolvers, ...this.extendQueryResolvers}
    }

    buildMutationResolvers() {
        let mutationResolvers: any = {}
        for (const key of Object.keys(this.models)) {
            const model = this.models[key]
            const camelCaseName = `${model.name.charAt(0).toLowerCase()}${model.name.substring(1)}`
            const idField = model.idColumn

            if (model.graphqlOptions?.generateDefaultMutations && typeof idField === 'string') {
                mutationResolvers[`create${model.name}`] = async (root: any, args: any, context: any, info: any) => {
                    const customFunctionResult = await customFunctionHandler(this.customMutationFunctionCreate, root, args, context, info)
                    if (customFunctionResult) return customFunctionResult
                    return model.query().insert(args[camelCaseName]).returning('*')
                }
                mutationResolvers[`update${model.name}`] = async (root: any, args: any, context: any, info: any) => {
                    const customFunctionResult = await customFunctionHandler(this.customMutationFunctionUpdate, root, args, context, info)
                    if (customFunctionResult) return customFunctionResult
                    return model.query().patchAndFetchById(args.id, args[camelCaseName]).returning('*').throwIfNotFound()
                }
                mutationResolvers[`delete${model.name}`] = async (root: any, args: any, context: any, info: any) => {
                    const customFunctionResult = await customFunctionHandler(this.customMutationFunctionDelete, root, args, context, info)
                    if (customFunctionResult) return customFunctionResult
                    return Boolean(await model.query().deleteById(args.id))
                }
            }

            if (model.graphqlOptions && model.graphqlOptions.mutationResolvers) mutationResolvers = {...mutationResolvers, ...model.graphqlOptions.mutationResolvers}
        }
        return {...mutationResolvers, ...this.extendMutationResolvers}
    }

    buildResolvers() {
        const resolvers: any = {}
        //deprecated
        // for (const key of Object.keys(this.models)) {
        //     const model = this.models[key]
        //     const resolver: any = {}
        //     if (model.relationMappings)
        //         Object.keys(model.relationMappings).forEach((a) => {
        //             const b: any = model.relationMappings
        //             const relation = b[a]
        //             const relationName = b[a].graphqlName || a
        //             if (!relation.graphql) return
        //             switch (relation.relation) {
        //                 case Model.HasOneRelation:
        //                 case Model.BelongsToOneRelation:
        //                     resolver[relationName] = async (parent: any, args: any, context: any, info: any) => {
        //                         const res = await model.relatedQuery(a).for(parent.id!).select()
        //                         return res[0]
        //                     }
        //                     break;
        //                 case Model.HasManyRelation:
        //                     if (Object.keys(relation.join).includes('through')) {
        //                         resolver[relationName] = async (parent: any, args: any, context: any, info: any) => {
        //                             const r = await model.relatedQuery(relation.connectQuery).for(parent.id!).select('id')
        //                             return relation.modelClass.relatedQuery(a).for(r.map((cr: any) => cr.id!)).select()
        //                         }
        //                     } else {
        //                         resolver[relationName] = async (parent: any, args: any, context: any, info: any) => {
        //                             return model.relatedQuery(a).for(parent.id!).select()
        //                         }
        //                     }
        //                     break;
        //             }
        //         })
        //     // resolvers[model.name] = resolver
        // }
        return {
            ...resolvers,
            Query: this.buildQueryResolvers(),
            Mutation: this.buildMutationResolvers(),
            ...this.extendResolvers
        }
    }

    build() {
        return {typeDefs: this.buildTypeDefs(), resolvers: this.buildResolvers()}
    }
}

export default SchemaBuilder
