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
    const services = await this._rawServiceRequest(userId, 'Kronos');

    return services.map((s: APIServiceResponse) => new OfficialKronosService(s, this._kronosEndpoint, this._kronosToken));
  }

  /**
   * Simple fetcher that supports getting all the services for a given user id whether it be Kronos or WHMCS
   * @param userId The Kronos or WHMCS user id
   * @param id_type The type of ID
   * @returns The list of services returned from the Kronos API
   */
  private async _rawServiceRequest(userId: number, id_type: 'WHMCS' | 'Kronos'): Promise<APIServiceResponse[]> {
    const serviceEndpoint = `${this._kronosEndpoint}/api/v1/services`;
    const limit = 500;
    const userQuery = id_type === 'WHMCS' ? `whmcs_rel_id=${userId}` : `user_id=${userId}`;
    const serviceEndpointWithQuery = `${serviceEndpoint}?limit=${limit}&${userQuery}`;
    const services = (await axios.get(serviceEndpointWithQuery, {
      headers: {
        'Authorization': `Bearer ${this._kronosToken}`,
      }
    })).data.data;

    return services;
  }

  /**
   * TODO - Test this, as I'm unsure if whmcs_rel_id is correct
   * Gets a Kronos user ID from a WHMCS user id
   * @param whmcsId The WHMCS user id
   * @returns The Kronos user id
   */
  public async getKronosUserId(whmcsId: number): Promise<number | undefined> {
    const services = await this._rawServiceRequest(whmcsId, 'WHMCS');
    return services[0]?.user.id;
  }
}