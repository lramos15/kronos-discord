import { OfficialKronosService } from "../official/officialKronosService";
import { AdminKronosService } from "../unofficial/adminKronosService";
import { AbstractKronosService } from "./abstractKronosService";

/**
 * Helps type narrow a Kronos Service to an Admin Service
 * @param service A Kronos Service from the official API or Unofficial Admin API
 * @returns True if it's from the unofficial admin API, false if it's from the official API
 */
export function isAdminService(service: OfficialKronosService | AdminKronosService | AbstractKronosService): service is AdminKronosService {
  return service instanceof AdminKronosService;
}

/**
 * Helps type narrow a Kronos Service to an official API Service
 * @param service A Kronos Service from the official API or Unofficial Admin API
 * @returns True if it's from the official API, false if it's from the unofficial Admin API
 */
export function isOfficialService(service: OfficialKronosService | AdminKronosService | AbstractKronosService): service is OfficialKronosService {
  return service instanceof OfficialKronosService;
}