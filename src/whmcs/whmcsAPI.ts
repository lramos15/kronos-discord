import { Pool, PoolConnection, createPool } from "mariadb";

/**
 * This class is used to interact with the WHMCS database.
 */
export class WhmcsAPI {
  private _dbPool: Pool;
  private static discordFieldId = 1;
  constructor(
    databaseHost: string,
    databaseName: string,
    databaseUsername: string,
    databasePassword: string,
  ) {
    this._dbPool = createPool({
      host: databaseHost,
      database: databaseName,
      user: databaseUsername,
      password: databasePassword,
    });
  }

  public async getWHCMSId(discordUserName: string): Promise<number | undefined> {
    let connection: PoolConnection | undefined;
    let whmcsID: number | undefined = undefined;
    try {
      connection = await this._dbPool.getConnection();
      const rows = await connection.query('SELECT relid FROM tblcustomfieldsvalues WHERE fieldid = ? AND value = ?;', [WhmcsAPI.discordFieldId, discordUserName]);
      whmcsID = rows[0]?.relid ?? undefined;
    } catch (error) {
      console.error(error);
    } finally {
      connection?.end();
    }
    return whmcsID;
  }
}