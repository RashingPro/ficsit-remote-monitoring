import { ChatMessage, Coordinates, Player } from "@/types";
import util from "node:util";
import assert from "node:assert";

export * from "@/types";

export type FicsitRemoteMonitoringResponse =
    | {
          ok: true;
          response: Response;
          responseBody?: object;
      }
    | {
          ok: false;
          response?: Response;
          responseBody?: object;
          error: Error;
      };

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

    /**
     * @param endpoint
     * @param method
     * @param body
     * @param includeAuth
     * @param error should method throw error (`true`) or return it (`false`)?
     * @private
     */
    private async doRequest(
        endpoint: string,
        method: "GET" | "POST" = "GET",
        body?: object,
        includeAuth: boolean = false,
        error: boolean = true
    ): Promise<FicsitRemoteMonitoringResponse> {
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
            const responseBody = (await response.json()) as object[] | undefined;
            if (!response.ok || !responseBody) {
                const err = new Error(
                    `Request failed with status: ${response.status}: ${response.statusText}. Response body: ${util.inspect(responseBody, { depth: null, colors: true })}`
                );
                if (error) {
                    throw err;
                } else return { ok: false, response: response, responseBody: response, error: err };
            }
            return { ok: true, response: response, responseBody: responseBody };
        } catch (err) {
            if (!error) return { ok: false, error: err as Error };
            if (
                err instanceof TypeError &&
                util.inspect(err.cause, { depth: 0, colors: false }).startsWith("AggregateError [ECONNREFUSED]")
            ) {
                throw new TypeError(err.message + ". [31mIs the Ficsit Remote Monitoring server running?[0m", {
                    cause: err.cause
                });
            } else throw err;
        }
    }

    public static parseBodyRawEntry(entry: object): object {
        if (Array.isArray(entry)) {
            return entry.map(val => this.parseBodyRawEntry(val));
        } else {
            if (typeof entry === "object") {
                return Object.fromEntries(
                    Object.entries(entry).map(([key, value]) => {
                        let newKey = key == "ID" ? "id" : key.charAt(0).toLowerCase() + key.slice(1);
                        return [newKey, this.parseBodyRawEntry(value)];
                    })
                );
            } else return entry;
        }
    }

    public static parseBodyRaw<T>(body: object): T {
        return this.parseBodyRawEntry(body) as T;
    }

    public async ping(): Promise<number> {
        const before = new Date();
        const response = await this.doRequest("/ping", "GET", undefined, false, false);
        if (!response.responseBody) return -1;
        const after = new Date();
        const ping = after.valueOf() - before.valueOf();
        return ping;
    }

    public async getChatMessages(): Promise<ChatMessage[]> {
        const response = await this.doRequest("getChatMessages");
        assert(response.responseBody);
        return FicsitRemoteMonitoring.parseBodyRaw(response.responseBody);
    }

    public async getPlayers(): Promise<Player[]> {
        const response = await this.doRequest("getPlayer");
        if (!response.ok) throw response.error;
        if (response.responseBody === undefined) throw new Error("Unknown error");
        return FicsitRemoteMonitoring.parseBodyRaw(response.responseBody);
    }

    public async createPing(position: Coordinates) {
        await this.doRequest("createPing", "POST", position, true);
    }

    public async setEnabled(id: string, status: boolean) {
        const response = await this.doRequest("setEnabled", "POST", {"ID": id, "status": status}, true);
        if (!response.ok) throw response.error;
        if (response.responseBody === undefined) throw new Error("Unknown error");
        return response.responseBody;
    }
}
