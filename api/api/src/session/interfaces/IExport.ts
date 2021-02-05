/**
 * ### The API for a single Export
 * Here you could basically change all properties of the export (at least all that are possible to change).
 * Also, you could request the export.
 */
export interface IExport {
    id: string;
    name?: string;
    type?: string;
}