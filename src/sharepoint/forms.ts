import { Queryable, QueryableCollection, QueryableInstance } from "./queryable";

/**
 * Describes a collection of Field objects
 *
 */
export class Forms extends QueryableCollection {

    /**
     * Creates a new instance of the Fields class
     *
     * @param baseUrl The url or Queryable which forms the parent of this fields collection
     */
    constructor(baseUrl: string | Queryable, path = "forms") {
        super(baseUrl, path);
    }

    /**
     * Gets a form by id
     *
     * @param id The guid id of the item to retrieve
     */
    public getById(id: string): Form {
        const i = new Form(this);
        i.concat(`('${id}')`);
        return i;
    }
}

/**
 * Describes a single of Form instance
 *
 */
export class Form extends QueryableInstance { }
