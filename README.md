# This project is still WIP! 

## example usage

#### Model
```
import {CustomModel as Model} from objection-graphql-generator;

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

```
```
import {makeExecutableSchema} from '@graphql-tools/schema';
import {SchemaBuilder} from 'objection-graphql-generator'
import {AuthenticationError} from "apollo-server-express";
import Course from "./models/Course";
import Category from "./models/Category";


const modelArray = [Course, Category]
const schemaBuilder = new SchemaBuilder(modelArray, {
    mutationFunction: async (a,b,context,d) => {
        const isAdmin = context.req.headers['userId'] === '1'
        if(!isAdmin) return new AuthenticationError('Access denied')
    }
}).build()
const schema = makeExecutableSchema(schemaBuilder)
```

## Options

```
mutationOptions: true // create, update, delete mutations
queryOptions: true // single and multiple query
extendQueries: "string" // Custom Query typedefs
extendMutations: "string" // Custom Mutation typedefs,
extendTypes: "string" // Custom regular typedefs
extendResolvers: {} // Custom regular resolvers
extendMutationResolvers: {} // Custom mutation resolvers
extendQueryResolvers: {} // Custom query resolvers  CustomResolver,
extendProps: {id: 'string'} // Additional props for queries. Useful for adding primary key and timestamps
queryFunction: (root,args,context,info)=>{} // This function will run before every single query, useful for authentication.
mutationFunction: (root,args,context,info)=>{} // This function will run before every single query, useful for authentication.
```
