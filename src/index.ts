import { ChatMessage } from "@/types";
import util from "node:util";

export * from "@/types";

export default class FicsitRemoteMonitoring {
    /**
     * @param port
     * @param token Required only for [these endpoints](https://docs.ficsit.app/ficsitremotemonitoring/latest/json/Write/Write.html). More about it [here](https://docs.ficsit.app/ficsitremotemonitoring/latest/json/authentication.html)
     * @param baseUrl url in format http://some-url or https://some-url/some/subpage. Do **NOT** put slash or port in the end
     */
    public constructor(
        public readonly port: number = 8080,
        public readonly token?: string,
        baseUrl?: string
    ) {
        this.API_BASE_URL = `${baseUrl ?? "http://localhost"}:${port}`;
    }

    public readonly API_BASE_URL;

    private async doRequest(
        endpoint: string,
        method: "GET" | "POST" = "GET",
        body?: object,
        includeAuth: boolean = false
    ) {
        let headers: HeadersInit = {};
        if (includeAuth) {
            if (!this.token) throw new Error("No token specified");
            headers["X-FRM-Authorization"] = this.token;
        }
        try {
            const response = await fetch(`${this.API_BASE_URL}/${endpoint}`, {
                method: method,
                body: body ? JSON.stringify(body) : undefined,
                headers: headers
            });
            return response;
        } catch (error) {
            if (
                error instanceof TypeError &&
                util.inspect(error.cause, { depth: 0, colors: false }).startsWith("AggregateError [ECONNREFUSED]")
            ) {
                throw new TypeError(error.message + ". [31mAre the Ficsit Remote Monitoring server running?[0m", {
                    cause: error.cause
                });
            } else {
                throw error;
            }
        }
    }

    public static parseBodyRawEntry(entry: object): object {
        if (Array.isArray(entry)) {
            return entry.map(val => this.parseBodyRawEntry(val));
        } else {
            if (typeof entry === "object") {
                return Object.fromEntries(
                    Object.entries(entry).map(([key, value]) => {
                        let newKey = key.charAt(0).toLowerCase() + key.slice(1);
                        return [newKey, this.parseBodyRawEntry(value)];
                    })
                );
            } else return entry;
        }
    }

    public static parseBodyRaw<T>(body: object): T {
        return this.parseBodyRawEntry(body) as T;
    }

    public async getChatMessages(): Promise<ChatMessage[]> {
        const response = await this.doRequest("getChatMessages");
        const responseBody = (await response.json()) as object[] | undefined;
        if (!response.ok || !responseBody)
            throw new Error(
                `Request failed with status: ${response.status}: ${response.statusText}. Response body: ${util.inspect(responseBody, { depth: null, colors: true })}`
            );
        return FicsitRemoteMonitoring.parseBodyRaw(responseBody);
    }
}
