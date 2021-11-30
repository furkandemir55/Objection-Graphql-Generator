import Model from "../../lib/CustomModel";

export default class Category extends Model {

    static get tableName() {
        return 'category'
    }

    static get jsonSchema() {
        return {
            type: 'object',
            properties: {
                id: {type: 'integer'},
                name: {type: 'string'},
                description: {type: 'string'},
                parentCategoryId: {type: 'integer'},
                parentCategory: {type: 'object'},
                childCategories: {type: 'object'},
                courses: {type: 'object'},
            }
        }
    }

    static graphqlOptions = {
        generateDefaultQueries: false,
        generateDefaultMutations: false
    }

    static get relationMappings() {
        const COURSE = require('./Course').default
        const CATEGORY = require('./Category').default
        return {
            courses: {
                graphql: true,
                connectType: 'many',
                relation: Model.HasManyRelation,
                modelClass: COURSE,
                join: {
                    from: 'category.id',
                    to: 'course.categoryId'
                }

            },
            childCategories: {
                graphql: true,
                connectType: 'many',
                relation: Model.HasManyRelation,
                modelClass: CATEGORY,
                join: {
                    from: 'category.id',
                    to: 'category.parentCategoryId'
                }
            },
            parentCategory: {
                graphql: true,
                connectType: 'one',
                relation: Model.BelongsToOneRelation,
                modelClass: CATEGORY,
                join: {
                    from: 'category.parentCategoryId',
                    to: 'category.id'
                }
            }
        }
    }
}
