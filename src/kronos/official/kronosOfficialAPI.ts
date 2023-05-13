import axios from "axios";
import { OfficialKronosService } from "./officialKronosService";
import { APIServiceResponse, KronosAPIFetcher } from "../common/kronosAPITypes";

/**
 * Utilizes the Kronos API and token to integrate with user's Kronos services
 */
export class KronosOfficialAPI implements KronosAPIFetcher {
  private readonly _kronosEndpoint: string;
  constructor(kronosEndpoint: string, private readonly _kronosToken: string) {
    this._kronosEndpoint = kronosEndpoint.endsWith('/') ? kronosEndpoint.slice(0, -1) : kronosEndpoint;
  }

  /**
   * Fetches all services for a given Kronos user
   * @param userId The kronos user id
   * @returns A list of services returned from the official Kronos API
   */
  public async getAllServices(userId: number): Promise<OfficialKronosService[]> {
    const serviceEndpoint = `${this._kronosEndpoint}/api/v1/services`;
    const limit = 500;
    const serviceEndpointWithQuery = `${serviceEndpoint}?limit=${limit}&user_id=${userId}`;
    const services = (await axios.get(serviceEndpointWithQuery, {
      headers: {
        'Authorization': `Bearer ${this._kronosToken}`,
      }
    })).data.data;

    return services.map((s: APIServiceResponse) => new OfficialKronosService(s, this._kronosEndpoint, this._kronosToken));
  }

  /**
   * Gets a Kronos user ID from a WHMCS user id
   * @param whmcsId The WHMCS user id
   * @returns The Kronos user id
   */
  public async getKronosUserId(whmcsId: number): Promise<number | undefined> {
    const endpoint = `${this._kronosEndpoint}/api/v1/users?whmcs_user_id=${whmcsId}`;
    const users = (await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${this._kronosToken}`,
      }
    })).data.data;
    
    return users.id;
  }
}