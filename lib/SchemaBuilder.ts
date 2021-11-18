import {Model} from "objection";
// import {makeExecutableSchema} from "@graphql-tools/schema";

type Options = { mutationOptions?: MutationOptions, queryOptions?: QueryOptions, extendQueries?: string, extendMutations?: string, extendTypes?: string }
type ModelsObject = { [index: string]: typeof Model }
type ArgumentKeys =
    'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'isNull' | 'likeNoCase' | 'in' | 'notIn' | 'orderBy'
    | 'orderByDesc' | 'range' | 'limit' | 'offset'
type ArgumentType = string | false
type QueryOptions = { [index in ArgumentKeys]?: ArgumentType; } | boolean;
type MutationOptions = { create: boolean, update: boolean, delete: boolean } | boolean

//todo custommodel
class SchemaBuilder {
    models: ModelsObject = {}
    queryOptions: QueryOptions = true
    mutationOptions: MutationOptions = true
    extendTypes = ''
    extendQueries = ''
    extendMutations = ''

    constructor(models: (typeof Model)[], options?: Options) {
        this.models = models.reduce<ModelsObject>((models, model) => ({
            ...models,
            [model.name]: model
        }), {});
        if (!options) return
        if (options.queryOptions) this.queryOptions = options.queryOptions;
        if (options.mutationOptions) this.mutationOptions = options.mutationOptions
        if (options.extendTypes) this.extendTypes = options.extendTypes
        if (options.extendQueries) this.extendQueries = options.extendQueries
        if (options.extendMutations) this.extendMutations = options.extendMutations
    }

    buildModelTypeDefs() {
        const resolveType = (type: string) => {
            if (type === 'string') return 'String'
            if (type === 'integer') return 'Int'
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

            Object.keys(fields).forEach(key => {
                const field: { relationName: string, type: string } = fields[key] as any
                const fieldType = field.type
                if (fieldType === 'object') {
                    const relationMappings: any = model.relationMappings
                    const relation = relationMappings[key] || relationMappings[field.relationName]
                    const relatedModel = relation.connectModel || relation.modelClass
                    const relatedModelName = relatedModel.name
                    const relationType = relation.relation
                    if (relationType === Model.HasManyRelation) {
                        modelTypeDef += `
${key}: [${relatedModelName}]`
                    } else {
                        modelTypeDef += `
${key}: ${relatedModelName}`
                    }
                } else {
                    modelTypeDef += `
${key}: ${resolveType(fieldType)}`
                    modelTypeDefCreate += `
${key}: ${resolveType(fieldType)}`
                    modelTypeDefUpdate += `
${key}: ${resolveType(fieldType)}`
                }

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
            queryTypeDefs += `
${camelCaseName}(id: Int!): ${model.name}
${camelCaseName}s(idArray: [Int]): [${model.name}]
`
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
            mutationTypeDefs += `
create${model.name}(${camelCaseName}: ${model.name}CreateInput!): ${model.name}!
update${model.name}(id: Int!, ${camelCaseName}: ${model.name}UpdateInput!): ${model.name}!
delete${model.name}(id: Int!): Boolean
`
        }
        mutationTypeDefs += this.extendMutations + '\n}'
        return mutationTypeDefs
    }

    buildTypeDefs() {
        return this.buildModelTypeDefs() + this.buildQueryTypeDefs() + this.buildMutationTypeDefs()
    }

    buildQueryResolvers() {
        const queryResolvers: any = {}
        for (const key of Object.keys(this.models)) {
            const model = this.models[key]
            const camelCaseName = `${model.name.charAt(0).toLowerCase()}${model.name.substring(1)}`

            queryResolvers[camelCaseName] = async (root: any, args: any, context: any, info: any) => {
                return model.query().findById(args.id).throwIfNotFound().select()
            }
            queryResolvers[`${camelCaseName}s`] =
                async (root: any, args: any, context: any, info: any) => {
                    const {idArray} = args
                    const queryBuilder = model.query().select()
                    if (idArray) queryBuilder.findByIds(args.idArray as number[])
                    return queryBuilder
                }
        }
        return queryResolvers
    }

    buildMutationResolvers() {
        const mutationResolvers: any = {}
        for (const key of Object.keys(this.models)) {
            const model = this.models[key]

            mutationResolvers[`create${model.name}`] = async (root: any, args: any, context: any, info: any) => {
                return model.query().insert(args.role).returning('*')
            }
            mutationResolvers[`update${model.name}`] = async (root: any, args: any, context: any, info: any) => {
                return model.query().patchAndFetchById(args.id, args.role).returning('*')
            }
            mutationResolvers[`delete${model.name}`] = async (root: any, args: any, context: any) => {
                return Boolean(await model.query().deleteById(args.id))
            }
        }
        return mutationResolvers
    }

    buildResolvers() {
        const resolvers: any = {}
        for (const key of Object.keys(this.models)) {
            const model = this.models[key]
            const resolver: any = {}
            if (model.relationMappings)
                Object.keys(model.relationMappings).forEach((a) => {
                    const b: any = model.relationMappings
                    const relation = b[a]
                    const relationName = b[a].graphqlName || a
                    if (!relation.graphql) return
                    switch (relation.connectType) {
                        case "one":
                            resolver[relationName] = async (parent: any, args: any, context: any, info: any) => {
                                const res = await model.relatedQuery(a).for(parent.id!).select()
                                return res[0]
                            }
                            break;
                        case "many":
                            resolver[relationName] = async (parent: any, args: any, context: any, info: any) => {
                                return model.relatedQuery(a).for(parent.id!).select()
                            }
                            break;
                        case "through":
                            resolver[relationName] = async (parent: any, args: any, context: any, info: any) => {
                                const r = await model.relatedQuery(relation.connectQuery).for(parent.id!).select('id')
                                return relation.modelClass.relatedQuery(a).for(r.map((cr: any) => cr.id!)).select()
                            }
                            break;
                    }
                })
            resolvers[model.name] = resolver
        }
        return {...resolvers, Query: this.buildQueryResolvers(), Mutation: this.buildMutationResolvers()}
    }

    build() {
        return {typeDefs: this.buildTypeDefs(), resolvers: this.buildResolvers()}
    }
}

export default SchemaBuilder
