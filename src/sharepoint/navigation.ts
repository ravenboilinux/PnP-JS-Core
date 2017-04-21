import { Util } from "../utils/util";
import { TypedHash } from "../collections/collections";
import { Queryable, QueryableInstance, QueryableCollection } from "./queryable";

export interface NavigationNodeAddResult {
    data: any;
    node: NavigationNode;
}

export interface NavigationNodeUpdateResult {
    data: any;
    node: NavigationNode;
}

/**
 * Represents a collection of navigation nodes
 *
 */
export class NavigationNodes extends QueryableCollection {

    /**
     * Gets a navigation node by id
     *
     * @param id The id of the node
     */
    public getById(id: number): NavigationNode {
        const node = new NavigationNode(this);
        node.concat(`(${id})`);
        return node;
    }

    /**
     * Adds a new node to the collection
     *
     * @param title Display name of the node
     * @param url The url of the node
     * @param visible If true the node is visible, otherwise it is hidden (default: true)
     */
    public add(title: string, url: string, visible = true): Promise<NavigationNodeAddResult> {

        const postBody = JSON.stringify({
            IsVisible: visible,
            Title: title,
            Url: url,
            "__metadata": { "type": "SP.NavigationNode" },
        });

        return this.clone(NavigationNodes, null, true).post({ body: postBody }).then((data) => {
            return {
                data: data,
                node: this.getById(data.Id),
            };
        });
    }

    /**
     * Moves a node to be after another node in the navigation
     *
     * @param nodeId Id of the node to move
     * @param previousNodeId Id of the node after which we move the node specified by nodeId
     */
    public moveAfter(nodeId: number, previousNodeId: number): Promise<void> {

        const postBody = JSON.stringify({
            nodeId: nodeId,
            previousNodeId: previousNodeId,
        });

        return this.clone(NavigationNodes, "MoveAfter", true).post({ body: postBody });
    }
}

export class NavigationNode extends QueryableInstance {

    /**
     * Represents the child nodes of this node
     */
    public get children(): NavigationNodes {
        return new NavigationNodes(this, "Children");
    }

    /**
     * Updates this node based on the supplied properties
     *
     * @param properties The hash of key/value pairs to update
     */
    public update(properties: TypedHash<boolean | string | number>): Promise<NavigationNodeUpdateResult> {

        const postBody = JSON.stringify(Util.extend({
            "__metadata": { "type": "SP.NavigationNode" },
        }, properties));

        return this.post({
            body: postBody,
            headers: {
                "X-HTTP-Method": "MERGE",
            },
        }).then((data) => {
            return {
                data: data,
                node: this,
            };
        });
    }

    /**
     * Deletes this node and any child nodes
     */
    public delete(): Promise<void> {
        return super.delete();
    }
}


/**
 * Exposes the navigation components
 *
 */
export class Navigation extends Queryable {

    /**
     * Creates a new instance of the Lists class
     *
     * @param baseUrl The url or Queryable which forms the parent of this fields collection
     */
    constructor(baseUrl: string | Queryable, path = "navigation") {
        super(baseUrl, path);
    }

    /**
     * Gets the quicklaunch navigation for the current context
     *
     */
    public get quicklaunch(): NavigationNodes {
        return new NavigationNodes(this, "quicklaunch");
    }

    /**
     * Gets the top bar navigation navigation for the current context
     *
     */
    public get topNavigationBar(): NavigationNodes {
        return new NavigationNodes(this, "topnavigationbar");
    }
}

