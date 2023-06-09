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

  public async getWHMCSId(discordUserName: string): Promise<number | undefined> {
    let connection: PoolConnection | undefined;
    let whmcsID: number | undefined = undefined;
    try {
      connection = await this._dbPool.getConnection();
      const rows = await connection.query('SELECT relid FROM tblcustomfieldsvalues WHERE fieldid = ? AND value = ?;', [WhmcsAPI.discordFieldId, discordUserName]);
      if (rows.length > 1) {
        console.warn(`Found multiple WHMCS IDs for ${discordUserName}`);
      }
      whmcsID = rows[rows.length - 1]?.relid ?? undefined;
    } catch (error) {
      console.error(error);
    } finally {
      connection?.end();
    }
    if (!whmcsID) {
      console.log(`Could not find WHCMS ID for ${discordUserName}`);
    }
    return whmcsID;
  }
}
