export interface BaseKronosService {
  serviceId: number;
  serviceAlias: string;
  product: string;
  serviceDescription: string;
}

export abstract class AbstractKronosService implements BaseKronosService {
  public abstract readonly serviceId: number;
  public abstract readonly serviceAlias: string;
  public abstract readonly product: string;
  public abstract readonly serviceDescription: string;
  public abstract readonly supportsGPUTranscoding: boolean;
  public abstract readonly containerFolderName: string;
  public abstract readonly nodeAlias: string;

  /**
   * Gets the status of the service
   * @param forceUpdateStatus Whether or not to force update the status of the service
   * @returns The status of the service
   */
  public abstract getServiceStatus(forceUpdateStatus?: boolean): Promise<string>;

  public async startService(): Promise<boolean> {
    return this.executeOperationOnService('start');
  }

  public async restartService(): Promise<boolean> {
    return this.executeOperationOnService('restart');
  }

  public async shutdownService(): Promise<boolean> {
    return this.executeOperationOnService('stop');
  }
  

  /**
   * Executes a given operation on the service, used to power the start, stop, and restart functions
   * @param operation The operation to execute on the service
   * @returns True if the operation was successful, false if it failed
   */
  protected abstract executeOperationOnService(operation: 'start' | 'stop' | 'restart'): Promise<boolean>;
}