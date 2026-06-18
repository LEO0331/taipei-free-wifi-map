import type { WifiHotspot } from '../types.js';
export declare const WIFI_SOURCE = "\u81FA\u5317\u5E02\u516C\u773E\u5340\u514D\u8CBB\u7121\u7DDA\u4E0A\u7DB2\u71B1\u9EDE\u8CC7\u6599(\u65B0\u7248)";
export declare function normalizeWifiRow(row: Record<string, string>): Record<string, string>;
export declare function convertWifiRow(rawRow: Record<string, string>, index: number): WifiHotspot;
