import Objection, {JSONSchema, Model, RelationMapping} from "objection";



interface RelationMap extends RelationMapping<any> {
    graphql?: boolean
    graphqlName?: string
}

interface RelationSchema {
    [relationName: string]: RelationMap;
}

type RelationSchemaThunk = () => RelationSchema

export default class CustomModel extends Model {
    // $validate(json?: Objection.Pojo, opt?: Objection.ModelOptions): Objection.Pojo {
    //     return {};
    // }

    static graphqlOptions?: { generateDefaultQueries: boolean, generateDefaultMutations: boolean, primaryField?: string, queryResolvers?: { [index: string]: any }, mutationResolvers?: { [index: string]: any } , extraProps?:boolean} = {
        generateDefaultQueries: true,
        generateDefaultMutations: true,
        primaryField: "id",
        extraProps: true,
    }
    // static jsonSchema: JsonSchema
    // static relationMappings: RelationSchema | RelationSchemaThunk
}
