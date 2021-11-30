import Model from "../../lib/CustomModel";

export default class Course extends Model {
    name?: string
    description?: string
    category?: any

    static get tableName() {
        return 'course'
    }

    static get jsonSchema() {
        return {
            type: 'object',
            properties: {
                id: {type: 'integer'},
                name: {type: 'string'},
                description: {type: 'string'},
                categoryId: {type: 'integer'},
                category: {type: 'object'},
            }
        }
    }

    static graphqlOptions = {
        generateDefaultQueries: true,
        generateDefaultMutations: true
    }

    static get relationMappings() {
        const CATEGORY = require('./Category').default;

        return {
            category: {
                graphql: true,
                connectType: 'one',
                relation: Model.BelongsToOneRelation,
                modelClass: CATEGORY,
                join: {
                    from: 'course.categoryId',
                    to: 'category.id'
                }
            },
        }
    }
}

