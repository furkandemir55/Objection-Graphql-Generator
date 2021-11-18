import {Model} from "objection";
// import Category from "./Category";
import CustomModel from "./CustomModel";

export default class Course extends CustomModel {
    name!: string | null
    description?: string | null
    categoryId?: number | null

    // category?: Category

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

