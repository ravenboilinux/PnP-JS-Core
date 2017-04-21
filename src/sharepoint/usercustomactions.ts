import { Queryable, QueryableInstance, QueryableCollection } from "./queryable";
import { Util } from "../utils/util";
import { TypedHash } from "../collections/collections";

export class UserCustomActions extends QueryableCollection {

    constructor(baseUrl: string | Queryable, path = "usercustomactions") {
        super(baseUrl, path);
    }

    /**
     * Returns the custom action with the specified identifier.
     *
     * @param id The GUID ID of the user custom action to get.
     */
    public getById(id: string): UserCustomAction {
        const uca = new UserCustomAction(this);
        uca.concat(`('${id}')`);
        return uca;
    }

    /**
     * Create a custom action
     *
     * @param creationInfo The information which defines the new custom action
     *
     */
    public add(properties: TypedHash<string | boolean | number>): Promise<UserCustomActionAddResult> {

        const postBody = JSON.stringify(Util.extend({ __metadata: { "type": "SP.UserCustomAction" } }, properties));

        return this.post({ body: postBody }).then((data) => {
            return {
                action: this.getById(data.Id),
                data: data,
            };
        });
    }

    /**
     * Deletes all custom actions in the collection.
     *
     */
    public clear(): Promise<void> {
        return this.clone(UserCustomActions, "clear", true).post();
    }
}

export class UserCustomAction extends QueryableInstance {

    public update(properties: TypedHash<string | boolean | number>): Promise<UserCustomActionUpdateResult> {

        const postBody = JSON.stringify(Util.extend({
            "__metadata": { "type": "SP.UserCustomAction" },
        }, properties));

        return this.post({
            body: postBody,
            headers: {
                "X-HTTP-Method": "MERGE",
            },
        }).then((data) => {
            return {
                action: this,
                data: data,
            };
        });
    }

    /**
    * Remove a custom action
    *
    */
    public delete(): Promise<void> {
        return super.delete();
    }
}

export interface UserCustomActionAddResult {
    data: any;
    action: UserCustomAction;
}

export interface UserCustomActionUpdateResult {
    data: any;
    action: UserCustomAction;
}
