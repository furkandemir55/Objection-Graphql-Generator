import {Model} from "objection";
import CustomModel from "../../lib/CustomModel";

export default class Category extends CustomModel {

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
                parentCategory: {type: 'object', relationName: 'parent'},
                childCategories: {type: 'object', relationName: 'children'},
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
            children: {
                graphql: true,
                connectType: 'many',
                graphqlName: 'childCategories',
                relation: Model.HasManyRelation,
                modelClass: CATEGORY,
                join: {
                    from: 'category.id',
                    to: 'category.parentCategoryId'
                }
            },
            parent: {
                graphql: true,
                connectType: 'one',
                graphqlName: 'parentCategory',
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
