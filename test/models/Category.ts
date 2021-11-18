import {Model} from "objection";
import Course from "./Course";
import CustomModel from "./CustomModel";

export default class Category extends CustomModel {
    name!: string | null
    description?: string | null
    parentCategoryId?: number | null


    parent?: Category
    children?: Category[]
    courses?: Course[]

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
                childCategories: {type: 'object',relationName: 'children'},
                courses: {type: 'object'},
            }
        }
    }

    static get relationMappings() {
        const COURSE = require('./Course').default
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
                modelClass: Category,
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
                modelClass: Category,
                join: {
                    from: 'category.parentCategoryId',
                    to: 'category.id'
                }
            }
        }
    }
}
