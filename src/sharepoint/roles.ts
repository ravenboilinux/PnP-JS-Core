import { Queryable, QueryableInstance, QueryableCollection } from "./queryable";
import { SiteGroups } from "./sitegroups";
import { BasePermissions } from "./types";
import { Util } from "../utils/util";
import { TypedHash } from "../collections/collections";

/**
 * Describes a set of role assignments for the current scope
 *
 */
export class RoleAssignments extends QueryableCollection {

    /**
     * Creates a new instance of the RoleAssignments class
     *
     * @param baseUrl The url or Queryable which forms the parent of this fields collection
     */
    constructor(baseUrl: string | Queryable, path = "roleassignments") {
        super(baseUrl, path);
    }

    /**
     * Adds a new role assignment with the specified principal and role definitions to the collection.
     *
     * @param principalId The ID of the user or group to assign permissions to
     * @param roleDefId The ID of the role definition that defines the permissions to assign
     *
     */
    public add(principalId: number, roleDefId: number): Promise<void> {
        return this.clone(RoleAssignments, `addroleassignment(principalid=${principalId}, roledefid=${roleDefId})`, true).post();
    }

    /**
     * Removes the role assignment with the specified principal and role definition from the collection
     *
     * @param principalId The ID of the user or group in the role assignment.
     * @param roleDefId The ID of the role definition in the role assignment
     *
     */
    public remove(principalId: number, roleDefId: number): Promise<void> {
        return this.clone(RoleAssignments, `removeroleassignment(principalid=${principalId}, roledefid=${roleDefId})`, true).post();
    }

    /**
     * Gets the role assignment associated with the specified principal ID from the collection.
     *
     * @param id The id of the role assignment
     */
    public getById(id: number) {
        const ra = new RoleAssignment(this);
        ra.concat(`(${id})`);
        return ra;
    }
}

export class RoleAssignment extends QueryableInstance {

    public get groups(): SiteGroups {
        return new SiteGroups(this, "groups");
    }

    /**
     * Get the role definition bindings for this role assignment
     *
     */
    public get bindings(): RoleDefinitionBindings {
        return new RoleDefinitionBindings(this);
    }

    /**
     * Delete this role assignment
     *
     */
    public delete(): Promise<void> {
        return this.post({
            headers: {
                "X-HTTP-Method": "DELETE",
            },
        });
    }
}

export class RoleDefinitions extends QueryableCollection {

    /**
     * Creates a new instance of the RoleDefinitions class
     *
     * @param baseUrl The url or Queryable which forms the parent of this fields collection
     * @param path
     *
     */
    constructor(baseUrl: string | Queryable, path = "roledefinitions") {
        super(baseUrl, path);
    }

    /**
     * Gets the role definition with the specified ID from the collection.
     *
     * @param id The ID of the role definition.
     *
     */
    public getById(id: number): RoleDefinition {
        return new RoleDefinition(this, `getById(${id})`);
    }

    /**
     * Gets the role definition with the specified name.
     *
     * @param name The name of the role definition.
     *
     */
    public getByName(name: string): RoleDefinition {
        return new RoleDefinition(this, `getbyname('${name}')`);
    }

    /**
     * Gets the role definition with the specified type.
     *
     * @param name The name of the role definition.
     *
     */
    public getByType(roleTypeKind: number): RoleDefinition {
        return new RoleDefinition(this, `getbytype(${roleTypeKind})`);
    }

    /**
     * Create a role definition
     *
     * @param name The new role definition's name
     * @param description The new role definition's description
     * @param order The order in which the role definition appears
     * @param basePermissions The permissions mask for this role definition
     *
     */
    public add(name: string, description: string, order: number, basePermissions: BasePermissions): Promise<RoleDefinitionAddResult> {

        const postBody = JSON.stringify({
            BasePermissions: Util.extend({ __metadata: { type: "SP.BasePermissions" } }, basePermissions),
            Description: description,
            Name: name,
            Order: order,
            __metadata: { "type": "SP.RoleDefinition" },
        });

        return this.post({ body: postBody }).then((data) => {
            return {
                data: data,
                definition: this.getById(data.Id),
            };
        });
    }
}

export class RoleDefinition extends QueryableInstance {

    /**
     * Updates this web intance with the supplied properties
     *
     * @param properties A plain object hash of values to update for the web
     */
    /* tslint:disable no-string-literal */
    public update(properties: TypedHash<any>): Promise<RoleDefinitionUpdateResult> {

        if (typeof properties.hasOwnProperty("BasePermissions") !== "undefined") {
            properties["BasePermissions"] = Util.extend({ __metadata: { type: "SP.BasePermissions" } }, properties["BasePermissions"]);
        }

        const postBody = JSON.stringify(Util.extend({
            "__metadata": { "type": "SP.RoleDefinition" },
        }, properties));

        return this.post({
            body: postBody,
            headers: {
                "X-HTTP-Method": "MERGE",
            },
        }).then((data) => {

            let retDef: RoleDefinition = this;

            if (properties.hasOwnProperty("Name")) {
                const parent = this.getParent(RoleDefinitions, this.parentUrl, "");
                retDef = parent.getByName(<string>properties["Name"]);
            }

            return {
                data: data,
                definition: retDef,
            };
        });
    }
    /* tslint:enable */

    /**
     * Delete this role definition
     *
     */
    public delete(): Promise<void> {
        return this.post({
            headers: {
                "X-HTTP-Method": "DELETE",
            },
        });
    }
}

export interface RoleDefinitionUpdateResult {
    definition: RoleDefinition;
    data: any;
}

export interface RoleDefinitionAddResult {
    definition: RoleDefinition;
    data: any;
}

export class RoleDefinitionBindings extends QueryableCollection {
    constructor(baseUrl: string | Queryable, path = "roledefinitionbindings") {
        super(baseUrl, path);
    }
}
