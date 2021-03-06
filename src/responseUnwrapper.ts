import * as aws from "aws-sdk";
import {TableSchema} from "./TableSchema";

/**
 * Extract a single property from a get response.
 * @param item
 * @returns the extracted value
 */
export function unwrapResponseItem(item: aws.DynamoDB.AttributeValue): any {
    if (item.hasOwnProperty("B")) {
        if (typeof item.B === "string") {
            return Buffer.from(item.B as string, "base64");
        }
        return item.B;
    } else if (item.hasOwnProperty("BS")) {
        return item.BS.map(b => {
            if (typeof b === "string") {
                return Buffer.from(b as string, "base64");
            }
            return b;
        });
    } else if (item.hasOwnProperty("BOOL")) {
        return item.BOOL;
    } else if (item.hasOwnProperty("L")) {
        return item.L.map(i => unwrapResponseItem(i));
    } else if (item.hasOwnProperty("N")) {
        return parseFloat(item.N);
    } else if (item.hasOwnProperty("NS")) {
        return item.NS.map(n => parseFloat(n));
    } else if (item.hasOwnProperty("NULL")) {
        return null;
    } else if (item.hasOwnProperty("S")) {
        return item.S;
    } else if (item.hasOwnProperty("SS")) {
        return item.SS;
    } else if (item.hasOwnProperty("M")) {
        const resp: any = {};
        Object.keys(item.M).forEach(key => resp[key] = unwrapResponseItem(item.M[key]));
        return resp;
    }
    throw new Error(`Unhandled response item ${JSON.stringify(item, null, 2)}`);
}

/**
 * Extract the JSON objects from a response to `getItem`.
 * @param response result of getItem
 * @returns the object returned
 */
export function unwrapGetOutput(response: aws.DynamoDB.GetItemOutput): any {
    if (!response.Item) {
        return null;
    }
    return unwrapResponseItem({M: response.Item});
}

/**
 * Extract the JSON objects from a response to `batchGetItem`.
 * @param tableSchemaOrName the TableSchema or the string table name
 * @param response result of batchGetItem
 * @returns the objects returned
 */
export function unwrapBatchGetOutput(tableSchemaOrName: TableSchema | string, response: aws.DynamoDB.BatchGetItemOutput): any[] {
    const tableName = (tableSchemaOrName as TableSchema).tableName ? (tableSchemaOrName as TableSchema).tableName : tableSchemaOrName as string;
    const responseTableItems = response.Responses && response.Responses[tableName];
    if (!responseTableItems) {
        return [];
    }
    return responseTableItems.map(responseItem => unwrapResponseItem({M: responseItem}));
}

/**
 * Extract the JSON objects from a response to `scan`.
 * @param response result of scan
 * @returns the objects returned
 */
export function unwrapScanOutput(response: aws.DynamoDB.ScanOutput): any[] {
    const responseTableItems = response.Items;
    if (!responseTableItems) {
        return [];
    }
    return responseTableItems.map(responseItem => unwrapResponseItem({M: responseItem}));
}

/**
 * Extract the JSON objects from a response to `query`.
 * @param response result of query
 * @returns the objects returned
 */
export function unwrapQueryOutput(response: aws.DynamoDB.QueryOutput): any[] {
    const responseTableItems = response.Items;
    if (!responseTableItems) {
        return [];
    }
    return responseTableItems.map(responseItem => unwrapResponseItem({M: responseItem}));
}
