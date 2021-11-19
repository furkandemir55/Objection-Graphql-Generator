import Objection, {JSONSchema, Model, RelationMapping} from "objection";

export interface SchemaDefinition extends JSONSchema {
    relationName?: string
}

interface JsonSchema extends JSONSchema {
    properties?: {
        [key: string]: SchemaDefinition
    };
}

interface RelationMap extends RelationMapping<any> {
    graphql?: boolean
    graphqlName?: string
}

interface RelationSchema {
    [relationName: string]: RelationMap;
}

type RelationSchemaThunk = () => RelationSchema

export default class CustomModel extends Model {
    $validate(json?: Objection.Pojo, opt?: Objection.ModelOptions): Objection.Pojo {
        return {};
    }

    static graphqlOptions?: { generateDefaultQueries: boolean, generateDefaultMutations: boolean, primaryField?: string, queryResolvers?: { [index: string]: any }, mutationResolvers?: { [index: string]: any } } = {
        generateDefaultQueries: true,
        generateDefaultMutations: true,
        primaryField: "id",
    }
    static jsonSchema: JsonSchema
    static relationMappings: RelationSchema | RelationSchemaThunk
}
