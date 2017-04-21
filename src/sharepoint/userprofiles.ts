import { Queryable, QueryableInstance, QueryableCollection } from "./queryable";
import { HashTagCollection, UserProfile } from "./types";
import { readBlobAsArrayBuffer } from "../utils/files";
import { ODataValue } from "./odata";

export class UserProfileQuery extends QueryableInstance {

    private profileLoader: ProfileLoader;

    constructor(baseUrl: string | Queryable, path = "_api/sp.userprofiles.peoplemanager") {
        super(baseUrl, path);

        this.profileLoader = new ProfileLoader(baseUrl);
    }

    /**
     * The URL of the edit profile page for the current user.
     */
    public get editProfileLink(): Promise<string> {
        return this.clone(UserProfileQuery, "EditProfileLink").getAs(ODataValue<string>());
    }

    /**
     * A Boolean value that indicates whether the current user's People I'm Following list is public.
     */
    public get isMyPeopleListPublic(): Promise<boolean> {
        return this.clone(UserProfileQuery, "IsMyPeopleListPublic").getAs(ODataValue<boolean>());
    }

    /**
     * A Boolean value that indicates whether the current user's People I'm Following list is public.
     *
     * @param loginName The account name of the user
     */
    public amIFollowedBy(loginName: string): Promise<boolean> {
        const q = this.clone(UserProfileQuery, "amifollowedby(@v)", true);
        q.query.add("@v", `'${encodeURIComponent(loginName)}'`);
        return q.get();
    }

    /**
     * Checks whether the current user is following the specified user.
     *
     * @param loginName The account name of the user
     */
    public amIFollowing(loginName: string): Promise<boolean> {
        const q = this.clone(UserProfileQuery, "amifollowing(@v)", true);
        q.query.add("@v", `'${encodeURIComponent(loginName)}'`);
        return q.get();
    }

    /**
     * Gets tags that the user is following.
     *
     * @param maxCount The maximum number of tags to get.
     */
    public getFollowedTags(maxCount = 20): Promise<string[]> {
        return this.clone(UserProfileQuery, `getfollowedtags(${maxCount})`, true).get();
    }

    /**
     * Gets the people who are following the specified user.
     *
     * @param loginName The account name of the user.
     */
    public getFollowersFor(loginName: string): Promise<any[]> {
        const q = this.clone(UserProfileQuery, "getfollowersfor(@v)", true);
        q.query.add("@v", `'${encodeURIComponent(loginName)}'`);
        return q.get();
    }

    /**
     * Gets the people who are following the current user.
     *
     */
    public get myFollowers(): QueryableCollection {
        return new QueryableCollection(this, "getmyfollowers");
    }

    /**
     * Gets user properties for the current user.
     *
     */
    public get myProperties(): QueryableInstance {
        return new UserProfileQuery(this, "getmyproperties");
    }

    /**
     * Gets the people who the specified user is following.
     *
     * @param loginName The account name of the user.
     */
    public getPeopleFollowedBy(loginName: string): Promise<any[]> {
        const q = this.clone(UserProfileQuery, "getpeoplefollowedby(@v)", true);
        q.query.add("@v", `'${encodeURIComponent(loginName)}'`);
        return q.get();
    }

    /**
     * Gets user properties for the specified user.
     *
     * @param loginName The account name of the user.
     */
    public getPropertiesFor(loginName: string): Promise<any[]> {
        const q = this.clone(UserProfileQuery, "getpropertiesfor(@v)", true);
        q.query.add("@v", `'${encodeURIComponent(loginName)}'`);
        return q.get();
    }

    /**
     * Gets the most popular tags.
     *
     */
    public get trendingTags(): Promise<HashTagCollection> {
        const q = this.clone(UserProfileQuery, null, true);
        q.concat(".gettrendingtags");
        return q.get();
    }

    /**
     * Gets the specified user profile property for the specified user.
     *
     * @param loginName The account name of the user.
     * @param propertyName The case-sensitive name of the property to get.
     */
    public getUserProfilePropertyFor(loginName: string, propertyName: string): Promise<string> {
        const q = this.clone(UserProfileQuery, `getuserprofilepropertyfor(accountname=@v, propertyname='${propertyName}')`, true);
        q.query.add("@v", `'${encodeURIComponent(loginName)}'`);
        return q.get();
    }

    /**
     * Removes the specified user from the user's list of suggested people to follow.
     *
     * @param loginName The account name of the user.
     */
    public hideSuggestion(loginName: string): Promise<void> {
        const q = this.clone(UserProfileQuery, "hidesuggestion(@v)", true);
        q.query.add("@v", `'${encodeURIComponent(loginName)}'`);
        return q.post();
    }

    /**
     * Checks whether the first user is following the second user.
     *
     * @param follower The account name of the user who might be following followee.
     * @param followee The account name of the user who might be followed.
     */
    public isFollowing(follower: string, followee: string): Promise<boolean> {
        const q = this.clone(UserProfileQuery, null, true);
        q.concat(`.isfollowing(possiblefolloweraccountname=@v, possiblefolloweeaccountname=@y)`);
        q.query.add("@v", `'${encodeURIComponent(follower)}'`);
        q.query.add("@y", `'${encodeURIComponent(followee)}'`);
        return q.get();
    }

    /**
     * Uploads and sets the user profile picture. Not supported for batching.
     *
     * @param profilePicSource Blob data representing the user's picture
     */
    public setMyProfilePic(profilePicSource: Blob): Promise<void> {

        return new Promise<void>((resolve, reject) => {
            readBlobAsArrayBuffer(profilePicSource).then((buffer) => {
                const request = new UserProfileQuery(this, "setmyprofilepicture");
                request.post({
                    body: String.fromCharCode.apply(null, new Uint16Array(buffer)),
                }).then(_ => resolve());
            }).catch(e => reject(e));
        });
    }

    /**
     * Provisions one or more users' personal sites. (My Site administrator on SharePoint Online only)
     *
     * @param emails The email addresses of the users to provision sites for
     */
    public createPersonalSiteEnqueueBulk(...emails: string[]): Promise<void> {
        return this.profileLoader.createPersonalSiteEnqueueBulk(emails);
    }

    /**
     * Gets the user profile of the site owner.
     *
     */
    public get ownerUserProfile(): Promise<UserProfile> {
        return this.profileLoader.ownerUserProfile;
    }

    /**
     * Gets the user profile that corresponds to the current user.
     */
    public get userProfile(): Promise<any> {
        return this.profileLoader.userProfile;
    }

    /**
     * Enqueues creating a personal site for this user, which can be used to share documents, web pages, and other files.
     *
     * @param interactiveRequest true if interactively (web) initiated request, or false if non-interactively (client) initiated request
     */
    public createPersonalSite(interactiveRequest = false): Promise<void> {
        return this.profileLoader.createPersonalSite(interactiveRequest);
    }

    /**
     * Sets the privacy settings for this profile.
     *
     * @param share true to make all social data public; false to make all social data private.
     */
    public shareAllSocialData(share: boolean): Promise<void> {
        return this.profileLoader.shareAllSocialData(share);
    }
}

class ProfileLoader extends Queryable {

    constructor(baseUrl: string | Queryable, path = "_api/sp.userprofiles.profileloader.getprofileloader") {
        super(baseUrl, path);
    }

    /**
     * Provisions one or more users' personal sites. (My Site administrator on SharePoint Online only)
     *
     * @param emails The email addresses of the users to provision sites for
     */
    public createPersonalSiteEnqueueBulk(emails: string[]): Promise<void> {

        return this.clone(ProfileLoader, "createpersonalsiteenqueuebulk").post({
            body: JSON.stringify({ "emailIDs": emails }),
        });
    }

    /**
     * Gets the user profile of the site owner.
     *
     */
    public get ownerUserProfile(): Promise<UserProfile> {
        let q = this.getParent(ProfileLoader, this.parentUrl, "_api/sp.userprofiles.profileloader.getowneruserprofile");

        if (this.hasBatch) {
            q = q.inBatch(this.batch);
        }

        return q.postAs<UserProfile>();
    }

    /**
     * Gets the user profile that corresponds to the current user.
     *
     */
    public get userProfile(): Promise<UserProfile> {
        return this.clone(ProfileLoader, "getuserprofile", true).postAs<UserProfile>();
    }

    /**
     * Enqueues creating a personal site for this user, which can be used to share documents, web pages, and other files.
     *
     * @param interactiveRequest true if interactively (web) initiated request, or false if non-interactively (client) initiated request
     */
    public createPersonalSite(interactiveRequest = false): Promise<void> {
        return this.clone(ProfileLoader, `getuserprofile/createpersonalsiteenque(${interactiveRequest})`, true).post();
    }

    /**
     * Sets the privacy settings for this profile.
     *
     * @param share true to make all social data public; false to make all social data private.
     */
    public shareAllSocialData(share: boolean): Promise<void> {
        return this.clone(ProfileLoader, `getuserprofile/shareallsocialdata(${share})`, true).post();
    }
}












