// This file is for types only, so we want to avoid any concrete imports.
// Type imports are fine
import type { AbstractKronosService } from "./abstractKronosService";

interface KronosNode {
  alias: string;
  id: number;
  is_up: boolean;
}

interface KronosTautulli {
  url: string;
}

/**
 * The official Kronos API response for the service endpoint
 */
export interface APIServiceResponse {
  id: number;
  display_name: string | null;
  alias: string | null;
  container_folder_name: string;
  user: {id: number}
  gpu_transcoding: boolean;
  node_alias: string;
  product_name: string;
}

/**
 * The unofficial Kronos API Auth token
 */
export type AdminAuthToken =  { authToken: string, csrfToken: string, expiration: number };

/**
 * The unofficial Kronos API response for a service from the admin endpoint
 */
export interface AdminServiceResponse extends APIServiceResponse {
  node: KronosNode;
  tautulli: KronosTautulli;
  plex_server_ip: string;
  plex_server_port: number;
  plex_token: string;
}

export interface KronosAPIFetcher {
  getAllServices(userId: number): Promise<AbstractKronosService[]>;
  getKronosUserId(whmcsId: number): Promise<number | undefined>;
}