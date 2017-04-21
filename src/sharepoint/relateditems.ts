import { Queryable } from "./queryable";

export interface RelatedItem {
    ListId: string;
    ItemId: number;
    Url: string;
    Title: string;
    WebId: string;
    IconUrl: string;
}

export interface RelatedItemManger {

    getRelatedItems(sourceListName: string, sourceItemId: number): Promise<RelatedItem[]>;

    getPageOneRelatedItems(sourceListName: string, sourceItemId: number): Promise<RelatedItem[]>;

    addSingleLink(sourceListName: string,
        sourceItemId: number,
        sourceWebUrl: string,
        targetListName: string,
        targetItemID: number,
        targetWebUrl: string,
        tryAddReverseLink?: boolean): Promise<void>;

    /**
     * Adds a related item link from an item specified by list name and item id, to an item specified by url
     *
     * @param sourceListName The source list name or list id
     * @param sourceItemId The source item id
     * @param targetItemUrl The target item url
     * @param tryAddReverseLink If set to true try to add the reverse link (will not return error if it fails)
     */
    addSingleLinkToUrl(sourceListName: string, sourceItemId: number, targetItemUrl: string, tryAddReverseLink?: boolean): Promise<void>;

    /**
     * Adds a related item link from an item specified by url, to an item specified by list name and item id
     *
     * @param sourceItemUrl The source item url
     * @param targetListName The target list name or list id
     * @param targetItemId The target item id
     * @param tryAddReverseLink If set to true try to add the reverse link (will not return error if it fails)
     */
    addSingleLinkFromUrl(sourceItemUrl: string, targetListName: string, targetItemId: number, tryAddReverseLink?: boolean): Promise<void>;

    deleteSingleLink(sourceListName: string,
        sourceItemId: number,
        sourceWebUrl: string,
        targetListName: string,
        targetItemId: number,
        targetWebUrl: string,
        tryDeleteReverseLink?: boolean): Promise<void>;
}

export class RelatedItemManagerImpl extends Queryable implements RelatedItemManger {

    public static FromUrl(url: string): RelatedItemManagerImpl {

        if (url === null) {
            return new RelatedItemManagerImpl("");
        }

        const index = url.indexOf("_api/");

        if (index > -1) {
            return new RelatedItemManagerImpl(url.substr(0, index));
        }

        return new RelatedItemManagerImpl(url);
    }

    constructor(baseUrl: string | Queryable, path = "_api/SP.RelatedItemManager") {
        super(baseUrl, path);
    }

    public getRelatedItems(sourceListName: string, sourceItemId: number): Promise<RelatedItem[]> {

        const query = this.clone(RelatedItemManagerImpl, null, true);
        query.concat(".GetRelatedItems");

        return query.post({
            body: JSON.stringify({
                SourceItemID: sourceItemId,
                SourceListName: sourceListName,
            }),
        });
    }

    public getPageOneRelatedItems(sourceListName: string, sourceItemId: number): Promise<RelatedItem[]> {

        const query = this.clone(RelatedItemManagerImpl, null, true);
        query.concat(".GetPageOneRelatedItems");

        return query.post({
            body: JSON.stringify({
                SourceItemID: sourceItemId,
                SourceListName: sourceListName,
            }),
        });
    }

    public addSingleLink(sourceListName: string,
        sourceItemId: number,
        sourceWebUrl: string,
        targetListName: string,
        targetItemID: number,
        targetWebUrl: string,
        tryAddReverseLink = false): Promise<void> {

        const query = this.clone(RelatedItemManagerImpl, null, true);
        query.concat(".AddSingleLink");

        return query.post({
            body: JSON.stringify({
                SourceItemID: sourceItemId,
                SourceListName: sourceListName,
                SourceWebUrl: sourceWebUrl,
                TargetItemID: targetItemID,
                TargetListName: targetListName,
                TargetWebUrl: targetWebUrl,
                TryAddReverseLink: tryAddReverseLink,
            }),
        });
    }

    /**
     * Adds a related item link from an item specified by list name and item id, to an item specified by url
     *
     * @param sourceListName The source list name or list id
     * @param sourceItemId The source item id
     * @param targetItemUrl The target item url
     * @param tryAddReverseLink If set to true try to add the reverse link (will not return error if it fails)
     */
    public addSingleLinkToUrl(sourceListName: string, sourceItemId: number, targetItemUrl: string, tryAddReverseLink = false): Promise<void> {

        const query = this.clone(RelatedItemManagerImpl, null, true);
        query.concat(".AddSingleLinkToUrl");

        return query.post({
            body: JSON.stringify({
                SourceItemID: sourceItemId,
                SourceListName: sourceListName,
                TargetItemUrl: targetItemUrl,
                TryAddReverseLink: tryAddReverseLink,
            }),
        });
    }

    /**
     * Adds a related item link from an item specified by url, to an item specified by list name and item id
     *
     * @param sourceItemUrl The source item url
     * @param targetListName The target list name or list id
     * @param targetItemId The target item id
     * @param tryAddReverseLink If set to true try to add the reverse link (will not return error if it fails)
     */
    public addSingleLinkFromUrl(sourceItemUrl: string, targetListName: string, targetItemId: number, tryAddReverseLink = false): Promise<void> {

        const query = this.clone(RelatedItemManagerImpl, null, true);
        query.concat(".AddSingleLinkFromUrl");

        return query.post({
            body: JSON.stringify({
                SourceItemUrl: sourceItemUrl,
                TargetItemID: targetItemId,
                TargetListName: targetListName,
                TryAddReverseLink: tryAddReverseLink,
            }),
        });
    }

    public deleteSingleLink(sourceListName: string,
        sourceItemId: number,
        sourceWebUrl: string,
        targetListName: string,
        targetItemId: number,
        targetWebUrl: string,
        tryDeleteReverseLink = false): Promise<void> {

        const query = this.clone(RelatedItemManagerImpl, null, true);
        query.concat(".DeleteSingleLink");

        return query.post({
            body: JSON.stringify({
                SourceItemID: sourceItemId,
                SourceListName: sourceListName,
                SourceWebUrl: sourceWebUrl,
                TargetItemID: targetItemId,
                TargetListName: targetListName,
                TargetWebUrl: targetWebUrl,
                TryDeleteReverseLink: tryDeleteReverseLink,
            }),
        });
    }
}
