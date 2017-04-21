import { Queryable, QueryableCollection } from "./queryable";
import { Lists } from "./lists";
import { Fields } from "./fields";
import { Navigation } from "./navigation";
import { SiteGroups, SiteGroup } from "./sitegroups";
import { ContentTypes } from "./contenttypes";
import { Folders, Folder } from "./folders";
import { RoleDefinitions } from "./roles";
import { File } from "./files";
import { TypedHash } from "../collections/collections";
import { Util } from "../utils/util";
import { BasePermissions, ChangeQuery } from "./types";
import { List } from "./lists";
import { SiteUsers, SiteUser, CurrentUser, SiteUserProps } from "./siteusers";
import { UserCustomActions } from "./usercustomactions";
import { extractOdataId, ODataBatch } from "./odata";
import { Features } from "./features";
import { deprecated } from "../utils/decorators";
import { QueryableShareableWeb } from "./queryableshareable";
import { RelatedItemManger, RelatedItemManagerImpl } from "./relateditems";

export class Webs extends QueryableCollection {
    constructor(baseUrl: string | Queryable, webPath = "webs") {
        super(baseUrl, webPath);
    }

    /**
     * Adds a new web to the collection
     *
     * @param title The new web's title
     * @param url The new web's relative url
     * @param description The web web's description
     * @param template The web's template
     * @param language The language code to use for this web
     * @param inheritPermissions If true permissions will be inherited from the partent web
     * @param additionalSettings Will be passed as part of the web creation body
     */
    public add(
        title: string,
        url: string,
        description = "",
        template = "STS",
        language = 1033,
        inheritPermissions = true,
        additionalSettings: TypedHash<string | number | boolean> = {}): Promise<WebAddResult> {

        const props = Util.extend({
            Description: description,
            Language: language,
            Title: title,
            Url: url,
            UseSamePermissionsAsParentSite: inheritPermissions,
            WebTemplate: template,
        }, additionalSettings);

        const postBody = JSON.stringify({
            "parameters":
            Util.extend({
                "__metadata": { "type": "SP.WebCreationInformation" },
            }, props),
        });

        return this.clone(Webs, "add", true).post({ body: postBody }).then((data) => {
            return {
                data: data,
                web: new Web(extractOdataId(data).replace(/_api\/web\/?/i, "")),
            };
        });
    }
}

export class WebInfos extends QueryableCollection {
    constructor(baseUrl: string | Queryable, webPath = "webinfos") {
        super(baseUrl, webPath);
    }
}

/**
 * Describes a web
 *
 */
export class Web extends QueryableShareableWeb {

    /**
     * Creates a new web instance from the given url by indexing the location of the /_api/
     * segment. If this is not found the method creates a new web with the entire string as
     * supplied.
     *
     * @param url
     */
    public static fromUrl(url: string, path?: string) {

        if (url === null) {
            return new Web("");
        }

        const index = url.indexOf("_api/");

        if (index > -1) {
            return new Web(url.substr(0, index), path);
        }

        return new Web(url, path);
    }

    constructor(baseUrl: string | Queryable, path = "_api/web") {
        super(baseUrl, path);
    }

    public get webs(): Webs {
        return new Webs(this);
    }

    public get webinfos(): WebInfos {
        return new WebInfos(this);
    }

    /**
     * Get the content types available in this web
     *
     */
    public get contentTypes(): ContentTypes {
        return new ContentTypes(this);
    }

    /**
     * Get the lists in this web
     *
     */
    public get lists(): Lists {
        return new Lists(this);
    }

    /**
     * Gets the fields in this web
     *
     */
    public get fields(): Fields {
        return new Fields(this);
    }

    /**
     * Gets the active features for this web
     *
     */
    public get features(): Features {
        return new Features(this);
    }

    /**
     * Gets the available fields in this web
     *
     */
    public get availablefields(): Fields {
        return new Fields(this, "availablefields");
    }

    /**
     * Get the navigation options in this web
     *
     */
    public get navigation(): Navigation {
        return new Navigation(this);
    }

    /**
     * Gets the site users
     *
     */
    public get siteUsers(): SiteUsers {
        return new SiteUsers(this);
    }

    /**
     * Gets the site groups
     *
     */
    public get siteGroups(): SiteGroups {
        return new SiteGroups(this);
    }

    /**
     * Gets the current user
     */
    public get currentUser(): CurrentUser {
        return new CurrentUser(this);
    }

    /**
     * Get the folders in this web
     *
     */
    public get folders(): Folders {
        return new Folders(this);
    }

    /**
     * Get all custom actions on a site
     *
     */
    public get userCustomActions(): UserCustomActions {
        return new UserCustomActions(this);
    }

    /**
     * Gets the collection of RoleDefinition resources.
     *
     */
    public get roleDefinitions(): RoleDefinitions {
        return new RoleDefinitions(this);
    }

    /**
     * Provides an interface to manage related items
     *
     */
    public get relatedItems(): RelatedItemManger {
        return RelatedItemManagerImpl.FromUrl(this.toUrl());
    }

    /**
     * Creates a new batch for requests within the context of context this web
     *
     */
    public createBatch(): ODataBatch {
        return new ODataBatch(this.parentUrl);
    }

    /**
     * The root folder of the web
     */
    public get rootFolder(): Folder {
        return new Folder(this, "rootFolder");
    }

    public get associatedOwnerGroup(): SiteGroup {
        return new SiteGroup(this, "associatedownergroup");
    }

    public get associatedMemberGroup(): SiteGroup {
        return new SiteGroup(this, "associatedmembergroup");
    }

    public get associatedVisitorGroup(): SiteGroup {
        return new SiteGroup(this, "associatedvisitorgroup");
    }

    /**
     * Get a folder by server relative url
     *
     * @param folderRelativeUrl the server relative path to the folder (including /sites/ if applicable)
     */
    public getFolderByServerRelativeUrl(folderRelativeUrl: string): Folder {
        return new Folder(this, `getFolderByServerRelativeUrl('${folderRelativeUrl}')`);
    }

    /**
     * Get a file by server relative url
     *
     * @param fileRelativeUrl the server relative path to the file (including /sites/ if applicable)
     */
    public getFileByServerRelativeUrl(fileRelativeUrl: string): File {
        return new File(this, `getFileByServerRelativeUrl('${fileRelativeUrl}')`);
    }

    /**
     * Get a list by server relative url (list's root folder)
     *
     * @param listRelativeUrl the server relative path to the list's root folder (including /sites/ if applicable)
     */
    public getList(listRelativeUrl: string): List {
        return new List(this, `getList('${listRelativeUrl}')`);
    }

    /**
     * Updates this web intance with the supplied properties
     *
     * @param properties A plain object hash of values to update for the web
     */
    public update(properties: TypedHash<string | number | boolean>): Promise<WebUpdateResult> {

        const postBody = JSON.stringify(Util.extend({
            "__metadata": { "type": "SP.Web" },
        }, properties));

        return this.post({
            body: postBody,
            headers: {
                "X-HTTP-Method": "MERGE",
            },
        }).then((data) => {
            return {
                data: data,
                web: this,
            };
        });
    }

    /**
     * Delete this web
     *
     */
    public delete(): Promise<void> {
        return super.delete();
    }

    /**
     * Applies the theme specified by the contents of each of the files specified in the arguments to the site.
     *
     * @param colorPaletteUrl Server-relative URL of the color palette file.
     * @param fontSchemeUrl Server-relative URL of the font scheme.
     * @param backgroundImageUrl Server-relative URL of the background image.
     * @param shareGenerated true to store the generated theme files in the root site, or false to store them in this site.
     */
    public applyTheme(colorPaletteUrl: string, fontSchemeUrl: string, backgroundImageUrl: string, shareGenerated: boolean): Promise<void> {

        const postBody = JSON.stringify({
            backgroundImageUrl: backgroundImageUrl,
            colorPaletteUrl: colorPaletteUrl,
            fontSchemeUrl: fontSchemeUrl,
            shareGenerated: shareGenerated,
        });

        return this.clone(Web, "applytheme", true).post({ body: postBody });
    }

    /**
     * Applies the specified site definition or site template to the Web site that has no template applied to it.
     *
     * @param template Name of the site definition or the name of the site template
     */
    public applyWebTemplate(template: string): Promise<void> {

        const q = this.clone(Web, "applywebtemplate", true);
        q.concat(`(@t)`);
        q.query.add("@t", template);
        return q.post();
    }

    /**
     * Returns whether the current user has the given set of permissions.
     *
     * @param perms The high and low permission range.
     */
    @deprecated("This method will be removed in future releases. Please use the methods found in queryable securable.")
    public doesUserHavePermissions(perms: BasePermissions): Promise<boolean> {

        const q = this.clone(Web, "doesuserhavepermissions", true);
        q.concat(`(@p)`);
        q.query.add("@p", JSON.stringify(perms));
        return q.get();
    }

    /**
     * Checks whether the specified login name belongs to a valid user in the site. If the user doesn't exist, adds the user to the site.
     *
     * @param loginName The login name of the user (ex: i:0#.f|membership|user@domain.onmicrosoft.com)
     */
    public ensureUser(loginName: string): Promise<WebEnsureUserResult> {
        const postBody = JSON.stringify({
            logonName: loginName,
        });

        return this.clone(Web, "ensureuser", true).post({ body: postBody }).then((data: any) => {
            return {
                data: data,
                user: new SiteUser(extractOdataId(data)),
            };
        });
    }

    /**
     * Returns a collection of site templates available for the site.
     *
     * @param language The LCID of the site templates to get.
     * @param true to include language-neutral site templates; otherwise false
     */
    public availableWebTemplates(language = 1033, includeCrossLanugage = true): QueryableCollection {
        return new QueryableCollection(this, `getavailablewebtemplates(lcid=${language}, doincludecrosslanguage=${includeCrossLanugage})`);
    }

    /**
     * Returns the list gallery on the site.
     *
     * @param type The gallery type - WebTemplateCatalog = 111, WebPartCatalog = 113 ListTemplateCatalog = 114,
     * MasterPageCatalog = 116, SolutionCatalog = 121, ThemeCatalog = 123, DesignCatalog = 124, AppDataCatalog = 125
     */
    public getCatalog(type: number): Promise<List> {
        return this.clone(Web, `getcatalog(${type})`, true).select("Id").get().then((data) => {
            return new List(extractOdataId(data));
        });
    }

    /**
     * Returns the collection of changes from the change log that have occurred within the list, based on the specified query.
     */
    public getChanges(query: ChangeQuery): Promise<any> {

        const postBody = JSON.stringify({ "query": Util.extend({ "__metadata": { "type": "SP.ChangeQuery" } }, query) });
        return this.clone(Web, "getchanges", true).post({ body: postBody });
    }

    /**
     * Gets the custom list templates for the site.
     *
     */
    public get customListTemplate(): QueryableCollection {
        return new QueryableCollection(this, "getcustomlisttemplates");
    }

    /**
     * Returns the user corresponding to the specified member identifier for the current site.
     *
     * @param id The ID of the user.
     */
    public getUserById(id: number): SiteUser {
        return new SiteUser(this, `getUserById(${id})`);
    }

    /**
     * Returns the name of the image file for the icon that is used to represent the specified file.
     *
     * @param filename The file name. If this parameter is empty, the server returns an empty string.
     * @param size The size of the icon: 16x16 pixels = 0, 32x32 pixels = 1.
     * @param progId The ProgID of the application that was used to create the file, in the form OLEServerName.ObjectName
     */
    public mapToIcon(filename: string, size = 0, progId = ""): Promise<string> {
        return this.clone(Web, `maptoicon(filename='${filename}', progid='${progId}', size=${size})`, true).get();
    }
}

export interface WebAddResult {
    data: any;
    web: Web;
}

export interface WebUpdateResult {
    data: any;
    web: Web;
}

export interface GetCatalogResult {
    data: any;
    list: List;
}

export interface WebEnsureUserResult {
    data: SiteUserProps;
    user: SiteUser;
}
