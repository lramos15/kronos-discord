import axios from "axios";
import { APIServiceResponse } from "../common/kronosAPITypes";
import { AbstractKronosService } from "../common/abstractKronosService";

export class OfficialKronosService extends AbstractKronosService {
  public readonly serviceId: number;
  public readonly serviceAlias: string;
  public readonly product: string;
  public readonly supportsGPUTranscoding: boolean;
  public readonly containerFolderName: string;
  public readonly nodeAlias: string;

  private _cachedServiceStatus: {lastFetched: number, status: string} = {lastFetched: 0, status: ''};

  constructor(
    private readonly _rawServiceResponse: APIServiceResponse,
    private readonly _kronosEndpoint: string,
    private readonly _kronosToken: string
  ) {
    super();
    this.serviceId = this._rawServiceResponse.id;
    this.product = this._rawServiceResponse.product_name;
    this.serviceAlias = this._rawServiceResponse.alias ?? this._rawServiceResponse.display_name ?? 'Unknown';
    this.supportsGPUTranscoding = this._rawServiceResponse.gpu_transcoding;
    this.containerFolderName = this._rawServiceResponse.container_folder_name;
    this.nodeAlias = this._rawServiceResponse.node_alias;
  }

  /**
   * Gets the status of the service
   * @param forceUpdateStatus Whether or not to force update the status of the service
   * @returns The status of the service
   */
  public override async getServiceStatus(forceUpdateStatus?: boolean): Promise<string> {
    // Only allow fetching the status once a minute to prevent slowdowns to the endpoint
    if (!forceUpdateStatus && this._cachedServiceStatus.lastFetched + 60000 > Date.now()) {
      return this._cachedServiceStatus.status;
    }
    let status = '';
    const serviceEndpoint = `${this._kronosEndpoint}/api/v1/services/${this.serviceId}/plex/status`;
    try {
      const services = await axios.get(serviceEndpoint, {
        headers: {
          'Authorization': `Bearer ${this._kronosToken}`,
        }
      });
      // Exited is a weird status, stopped is clearer to the user
      status = services.data.status === 'exited' ? 'stopped' : services.data.status;
    } catch (err) {
      console.error(err);
      status = 'Unable to return status!';
    }
    this._cachedServiceStatus = {lastFetched: Date.now(), status};
    return status;
  }

  protected override async executeOperationOnService(operation: 'start' | 'stop' | 'restart'): Promise<boolean> {
    const serviceEndpoint = `${this._kronosEndpoint}/api/v1/services/${this.serviceId}/plex/${operation}`;
    try {
      const operation = await axios.post(serviceEndpoint, {}, {
        headers: {
          'Authorization': `Bearer ${this._kronosToken}`,
        }
      });
      return operation.data.success;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   * A simple string that describes the service
   * @returns A string that describes the service
   */
  public get serviceDescription(): string {
    return `Node ${this._rawServiceResponse.node_alias} - ${this._rawServiceResponse.product_name}`;
  }
}