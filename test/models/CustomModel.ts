import Objection, {Model} from "objection";

export default class CustomModel extends Model {
    id!: number
    createdAt?: string | null
    updatedAt?: string | null

    constructor() {
        super();
    }

    $beforeUpdate(opt: Objection.ModelOptions, queryContext: Objection.QueryContext): Promise<any> | void {
        try {
            this.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
        } catch (e) {
        }
    }
}
