import * as z from "zod";

import {
    ChatMessage,
    ChatMessageSchema,
    Coordinates,
    FactoryBuilding,
    FactoryBuildingSchema,
    HttpRequestMethod,
    MaybeArray,
    Player,
    PlayerSchema,
    SendChatMessageParams,
    SendChatMessageResponse,
    SendChatMessageResponseSchema,
    SessionInfo,
    SessionInfoSchema,
    SetEnabledParams,
    SetEnabledResponse,
    SetEnabledResponseSchema,
    SetSwitchParams,
    SetSwitchResponse,
    SetSwitchResponseSchema,
    Switch,
    SwitchSchema
} from "@/types";

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

export class FicsitRemoteMonitoringRequestError extends Error {
    public constructor(
        code: number,
        errorMessage: string,
        public readonly rawErrorBody: unknown
    ) {
        super(`Ficsit Remote Monitoring API respond with code ${code}: ${errorMessage}`);
    }
}

export default class FicsitRemoteMonitoring {
    /**
     * @param port
     * @param token Required only for [these endpoints](https://docs.ficsit.app/ficsitremotemonitoring/latest/json/Write/Write.html). More about it [here](https://docs.ficsit.app/ficsitremotemonitoring/latest/json/authentication.html)
     * @param baseUrl url in format http://some-url or https://some-url/some/subpage. Do **NOT** put port in the end
     */
    public constructor(
        public readonly port: number = 8080,
        public readonly token?: string,
        baseUrl: string = "http://localhost"
    ) {
        while (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, baseUrl.length - 1);
        this.API_BASE_URL = `${baseUrl}:${port}`;
    }

    public readonly API_BASE_URL;

    protected static buildUrl(baseUrl: string, endpoint: string): string {
        return new URL(endpoint, baseUrl).href;
    }

    private async makeRequest(
        endpoint: string,
        options?: {
            method?: HttpRequestMethod;
            body?: object;
            includeAuth?: boolean;
            responseIsOkValidator?: (res: Response) => boolean;
        }
    ): Promise<unknown>;
    private async makeRequest<T extends z.ZodType>(
        endpoint: string,
        options: {
            method?: HttpRequestMethod;
            body?: object;
            includeAuth?: boolean;
            validationSchema: T;
            responseIsOkValidator?: (res: Response) => boolean;
        }
    ): Promise<z.infer<T>>;

    private async makeRequest(
        endpoint: string,
        options?: {
            method?: HttpRequestMethod;
            body?: object;
            includeAuth?: boolean;
            validationSchema?: z.ZodType;
            responseIsOkValidator?: (res: Response) => boolean;
        }
    ) {
        const headers: Headers = new Headers();
        if (options?.includeAuth) {
            if (!this.token) throw new Error("Token was not provided");
            headers.set("X-FRM-Authorization", this.token);
        }

        try {
            const res = await fetch(FicsitRemoteMonitoring.buildUrl(this.API_BASE_URL, endpoint), {
                method: options?.method ?? "GET",
                body: options?.body ? JSON.stringify(options.body) : undefined,
                headers: headers
            });
            const resBody = await res.json();
            if (typeof resBody !== "object" || !(options?.responseIsOkValidator ?? (r => r.ok))(res))
                throw new FicsitRemoteMonitoringRequestError(
                    res.status,
                    resBody.error ?? "No error message provided in response body",
                    resBody
                );
            const formatedBody = FicsitRemoteMonitoring.formatBodyRaw(resBody);
            return options?.validationSchema
                ? FicsitRemoteMonitoring.validateBody(formatedBody, options.validationSchema)
                : formatedBody;
        } catch (err) {
            if (
                err instanceof TypeError &&
                err.cause instanceof AggregateError &&
                // @ts-expect-error If connection fails, AggregateError actually has `code` property
                err.cause["code"] == "ECONNREFUSED"
            ) {
                throw new TypeError(err.message + ". [31mIs the Ficsit Remote Monitoring server running?[0m", {
                    cause: err.cause
                });
            } else throw err;
        }
    }

    public static formatBodyRaw(body: object): object;
    public static formatBodyRaw(body: object[]): object[];

    public static formatBodyRaw(body: MaybeArray<object>): MaybeArray<object> {
        if (Array.isArray(body)) {
            return body.map(val => this.formatBodyRaw(val));
        } else {
            if (typeof body === "object") {
                return Object.fromEntries(
                    Object.entries(body).map(([key, value]) => {
                        const newKey = key == "ID" ? "id" : key.charAt(0).toLowerCase() + key.slice(1);
                        return [newKey, this.formatBodyRaw(value)];
                    })
                );
            } else return body;
        }
    }

    public static validateBody(body: unknown, schema: z.ZodType) {
        return z.parse(schema, body);
    }

    public async ping(): Promise<number> {
        const before = new Date();
        await this.makeRequest("ping", { responseIsOkValidator: r => r.status < 500 });
        const after = new Date();
        return after.valueOf() - before.valueOf();
    }

    public async createPing(position: Coordinates) {
        await this.makeRequest("createPing", { includeAuth: true, method: "POST", body: position });
    }

    public async setEnabled(params: MaybeArray<SetEnabledParams>): Promise<SetEnabledResponse[]> {
        const fn = (value: SetSwitchParams) => ({ ...value, id: undefined, ID: value.id });

        return await this.makeRequest("setEnabled", {
            includeAuth: true,
            method: "POST",
            body: Array.isArray(params) ? params.map(fn) : fn(params),
            validationSchema: z.array(SetEnabledResponseSchema)
        });
    }

    public async getChatMessages(): Promise<ChatMessage[]> {
        return await this.makeRequest("getChatMessages", {
            validationSchema: z.array(ChatMessageSchema)
        });
    }
    public async sendChatMessage(params: MaybeArray<SendChatMessageParams>): Promise<SendChatMessageResponse[]> {
        const fn = (v: SendChatMessageParams) => ({ message: v.message, ...v.options });

        return await this.makeRequest("sendChatMessage", {
            method: "POST",
            body: Array.isArray(params) ? params.map(fn) : fn(params),
            includeAuth: true,
            validationSchema: z.array(SendChatMessageResponseSchema)
        });
    }

    public async getSessionInfo(): Promise<SessionInfo> {
        return await this.makeRequest("getSessionInfo", { validationSchema: SessionInfoSchema });
    }
    public async getPlayers(): Promise<Player[]> {
        return await this.makeRequest("getPlayer", { validationSchema: z.array(PlayerSchema) });
    }

    public async getFactory(): Promise<FactoryBuilding[]> {
        return await this.makeRequest("getFactory", { validationSchema: z.array(FactoryBuildingSchema) });
    }
    public async getAssemblers(): Promise<FactoryBuilding[]> {
        return await this.makeRequest("getAssembler", { validationSchema: z.array(FactoryBuildingSchema) });
    }
    public async getBlenders(): Promise<FactoryBuilding[]> {
        return await this.makeRequest("getBlender", { validationSchema: z.array(FactoryBuildingSchema) });
    }
    public async getConstructors(): Promise<FactoryBuilding[]> {
        return await this.makeRequest("getConstructor", { validationSchema: z.array(FactoryBuildingSchema) });
    }
    public async getParticleAccelerators(): Promise<FactoryBuilding[]> {
        return await this.makeRequest("getParticle", { validationSchema: z.array(FactoryBuildingSchema) });
    }
    public async getConverters(): Promise<FactoryBuilding[]> {
        return await this.makeRequest("getConverter", { validationSchema: z.array(FactoryBuildingSchema) });
    }
    public async getFoundries(): Promise<FactoryBuilding[]> {
        return await this.makeRequest("getFoundry", { validationSchema: z.array(FactoryBuildingSchema) });
    }
    public async getManufacturers(): Promise<FactoryBuilding[]> {
        return await this.makeRequest("getManufacturer", { validationSchema: z.array(FactoryBuildingSchema) });
    }
    public async getPackagers(): Promise<FactoryBuilding[]> {
        return await this.makeRequest("getPackager", { validationSchema: z.array(FactoryBuildingSchema) });
    }
    public async getRefineries(): Promise<FactoryBuilding[]> {
        return await this.makeRequest("getRefinery", { validationSchema: z.array(FactoryBuildingSchema) });
    }
    public async getSmelters(): Promise<FactoryBuilding[]> {
        return await this.makeRequest("getSmelter", { validationSchema: z.array(FactoryBuildingSchema) });
    }

    public async getSwitches(): Promise<Switch[]> {
        return await this.makeRequest("getSwitches", { validationSchema: z.array(SwitchSchema) });
    }
    public async setSwitches(params: MaybeArray<SetSwitchParams>): Promise<SetSwitchResponse[]> {
        const fn = (value: SetSwitchParams) => {
            return { ...value, id: undefined, ID: value.id };
        };
        return await this.makeRequest("setSwitches", {
            method: "POST",
            body: Array.isArray(params) ? params.map(fn) : fn(params),
            includeAuth: true,
            validationSchema: z.array(SetSwitchResponseSchema)
        });
    }
}
