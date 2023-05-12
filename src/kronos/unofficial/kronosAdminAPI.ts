import axios from "axios";
import { KronosAPIFetcher, AdminServiceResponse, AdminAuthToken } from "../common/kronosAPITypes";
import { AdminKronosService } from "./adminKronosService";

/**
 * Class that utilizes the admin user to access the internal Kronos API
 * This allows us to gain access to certain Kronos API routes that are not exposed via an API key
 */
export class KronosAdminAPI implements KronosAPIFetcher {
  private _adminToken: AdminAuthToken | undefined;
  constructor(
    private readonly _adminUsername: string,
    private readonly _adminPassword: string,
    private readonly _kronosEndpoint: string
  ) { }

  public async getAllServices(userId: number): Promise<AdminKronosService[]> {
    const userEndpoint = `${this._kronosEndpoint}/api/admin/users/user/${userId}`;
    try {
      const userResponse = (await this.makeRequestAsAdmin(userEndpoint, 'GET')).data;
      const services: AdminServiceResponse[] = userResponse.owned_servers;
      if (!this._adminToken) {
        return [];
      }
      return services.map(s => new AdminKronosService(s, this._kronosEndpoint, this._adminToken as AdminAuthToken))
    } catch (err) {
      console.error(err);
    }
    return [];
  }

  public async getKronosUserId(whmcsId: number): Promise<number | undefined> {
    const endpoint = `${this._kronosEndpoint}/api/admin/users?query=${whmcsId}&filterStatus=all&perpage=50&page=1&sortColumn=whmcs_id&sortDirection=desc`;
    try {
      const response = await this.makeRequestAsAdmin(endpoint, 'GET');
      // Loop through all the responses and find the one that matches the WHMCS ID
      // TODO Find a better way to filter based on WHMCS Id so that it is impossible for multiple results to be returned
      for (const user of response.data) {
        if (user.whmcs_id === whmcsId) {
          return user.id;
        }
      }
      return undefined;
    } catch (err) {
      console.error(err);
    }
    return undefined;
  }

  /**
   * Submits a request to the internal Kronos API as an admin user
   * @param url The url to submit the request to
   * @param method The request method type
   * @param data  The data to post to the url if the method is POST
   * @returns The response
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async makeRequestAsAdmin(url: string, method: 'GET' | 'POST', data?: unknown): Promise<any> {
    const adminToken = await this.getAdminToken();
    const response = await axios.request({
      url,
      method,
      data,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken.authToken}`,
        "X-Csrf-Token": adminToken.csrfToken
      }
    });
    return response.data;
  }

  /**
   * Get the admin token by signing in as the admin user
   * @returns The admin token
   */
  private async getAdminToken(): Promise<AdminAuthToken> {
    const threeHours = 1000 * 60 * 60 * 3;
    const eightHours = 1000 * 60 * 60 * 8;
    if (this._adminToken && this._adminToken.expiration - threeHours > Date.now()) {
      return this._adminToken;
    }
    const authEndpoint = `${this._kronosEndpoint}/app/admin/login`;
    try {
      const testResponse = await axios.get(authEndpoint);
      // parse the CSRF token out of the HTML from the testResponse
      // It appears as <meta name="csrf-token" content="TOKEN">
      const csrfToken = testResponse.data.match(/<meta name="csrf-token" content="(.*)">/)[1];
      const authResponse = await axios.post(authEndpoint, {
        authenticator: null,
        email: this._adminUsername,
        password: this._adminPassword
      }, {
        headers: {
          Cookie: testResponse.headers['set-cookie'],
          "Content-Type": "application/json",
          "X-Csrf-Token": csrfToken,
        }
      });
      this._adminToken = {
        authToken: authResponse.data.token,
        csrfToken: csrfToken,
        expiration: Date.now() + eightHours
      };
      return this._adminToken;
    } catch (err) {
      console.error(err);
      throw new Error("Failed to get admin token");
    }
  }
}