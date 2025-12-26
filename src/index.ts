import * as z from "zod";

import {
    ChatMessage,
    ChatMessageSchema,
    Color,
    Coordinates,
    FactoryBuilding,
    FactoryBuildingSchema,
    HttpRequestMethod,
    MaybeArray,
    ObjectArraySchema,
    Player,
    PlayerSchema,
    SendChatMessageResponse,
    SendChatMessageResponseSchema,
    SessionInfo,
    SessionInfoSchema,
    SetSwitchParams,
    SetSwitchResponse,
    SetSwitchResponseSchema,
    Switch,
    SwitchSchema,
    validateIsObject,
    validateIsObjectArray
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
        method?: HttpRequestMethod,
        body?: object,
        config?: {
            includeAuth?: boolean;
            validationSchema?: z.ZodType;
            responseIsOkValidator?: (res: Response) => boolean;
        }
    ): Promise<unknown>;
    private async makeRequest<T extends z.ZodType>(
        endpoint: string,
        method: HttpRequestMethod,
        body: object | undefined,
        config: {
            includeAuth?: boolean;
            validationSchema: T;
            responseIsOkValidator?: (res: Response) => boolean;
        }
    ): Promise<z.infer<T>>;

    private async makeRequest(
        endpoint: string,
        method: HttpRequestMethod = "GET",
        body?: object,
        config?: {
            includeAuth?: boolean;
            validationSchema?: z.ZodType;
            responseIsOkValidator?: (res: Response) => boolean;
        }
    ) {
        const headers: Headers = new Headers();
        if (config?.includeAuth) {
            if (!this.token) throw new Error("Token was not provided");
            headers.set("X-FRM-Authorization", this.token);
        }

        try {
            const res = await fetch(FicsitRemoteMonitoring.buildUrl(this.API_BASE_URL, endpoint), {
                method: method,
                body: body ? JSON.stringify(body) : undefined,
                headers: headers
            });
            const resBody = await res.json();
            if (typeof resBody !== "object" || !(config?.responseIsOkValidator ?? (r => r.ok))(res))
                throw new FicsitRemoteMonitoringRequestError(
                    res.status,
                    resBody.error ?? "No error message provided in response body",
                    resBody
                );
            const formatedBody = FicsitRemoteMonitoring.formatBodyRaw(resBody);
            return config?.validationSchema
                ? FicsitRemoteMonitoring.validateBody(formatedBody, config.validationSchema)
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
        await this.makeRequest("ping", "GET", undefined, { responseIsOkValidator: r => r.status < 500 });
        const after = new Date();
        return after.valueOf() - before.valueOf();
    }

    public async createPing(position: Coordinates) {
        await this.makeRequest("createPing", "POST", position, { includeAuth: true });
    }

    public async setEnabled(id: string, status: boolean): Promise<object[]> {
        const response = await this.makeRequest(
            "setEnabled",
            "POST",
            { ID: id, status: status },
            { includeAuth: true }
        );
        return z.parse(ObjectArraySchema, response);
    }
    public async setSwitches(params: MaybeArray<SetSwitchParams>): Promise<SetSwitchResponse> {
        const fn = (value: SetSwitchParams) => {
            return { ...value, id: undefined, ID: value.id };
        };
        const response = await this.makeRequest(
            "setSwitches",
            "POST",
            Array.isArray(params) ? params.map(fn) : fn(params),
            { includeAuth: true }
        );
        return z.parse(
            SetSwitchResponseSchema,
            FicsitRemoteMonitoring.formatBodyRaw(z.parse(ObjectArraySchema, response))
        );
    }

    public async getChatMessages(): Promise<ChatMessage[]> {
        const response = await this.makeRequest("getChatMessages");
        return z.parse(
            z.array(ChatMessageSchema),
            FicsitRemoteMonitoring.formatBodyRaw(z.parse(ObjectArraySchema, response))
        );
    }
    public async sendChatMessage(
        message: string,
        params?: Partial<{ sender: "" | "ada" | string; color: Color }>
    ): Promise<SendChatMessageResponse> {
        const response = await this.makeRequest(
            "sendChatMessage",
            "POST",
            { message: message, ...params },
            { includeAuth: true }
        );
        return z.parse(SendChatMessageResponseSchema, FicsitRemoteMonitoring.formatBodyRaw(validateIsObject(response)));
    }

    public async getSessionInfo(): Promise<SessionInfo> {
        const response = await this.makeRequest("getSessionInfo");
        return z.parse(SessionInfoSchema, FicsitRemoteMonitoring.formatBodyRaw(validateIsObject(response)));
    }
    public async getPlayers(): Promise<Player[]> {
        const response = await this.makeRequest("getPlayer");
        return z.parse(z.array(PlayerSchema), FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response)));
    }

    public async getFactory(): Promise<FactoryBuilding[]> {
        const response = await this.makeRequest("getFactory");
        return z.parse(
            z.array(FactoryBuildingSchema),
            FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response))
        );
    }
    public async getAssemblers(): Promise<FactoryBuilding[]> {
        const response = await this.makeRequest("getAssembler");
        return z.parse(
            z.array(FactoryBuildingSchema),
            FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response))
        );
    }
    public async getBlenders(): Promise<FactoryBuilding[]> {
        const response = await this.makeRequest("getBlender");
        return z.parse(
            z.array(FactoryBuildingSchema),
            FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response))
        );
    }
    public async getConstructors(): Promise<FactoryBuilding[]> {
        const response = await this.makeRequest("getConstructor");
        return z.parse(
            z.array(FactoryBuildingSchema),
            FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response))
        );
    }
    public async getParticleAccelerators(): Promise<FactoryBuilding[]> {
        const response = await this.makeRequest("getParticle");
        return z.parse(
            z.array(FactoryBuildingSchema),
            FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response))
        );
    }
    public async getConverters(): Promise<FactoryBuilding[]> {
        const response = await this.makeRequest("getConverter");
        return z.parse(
            z.array(FactoryBuildingSchema),
            FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response))
        );
    }
    public async getFoundries(): Promise<FactoryBuilding[]> {
        const response = await this.makeRequest("getFoundry");
        return z.parse(
            z.array(FactoryBuildingSchema),
            FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response))
        );
    }
    public async getManufacturers(): Promise<FactoryBuilding[]> {
        const response = await this.makeRequest("getManufacturer");
        return z.parse(
            z.array(FactoryBuildingSchema),
            FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response))
        );
    }
    public async getPackagers(): Promise<FactoryBuilding[]> {
        const response = await this.makeRequest("getPackager");
        return z.parse(
            z.array(FactoryBuildingSchema),
            FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response))
        );
    }
    public async getRefineries(): Promise<FactoryBuilding[]> {
        const response = await this.makeRequest("getRefinery");
        return z.parse(
            z.array(FactoryBuildingSchema),
            FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response))
        );
    }
    public async getSmelters(): Promise<FactoryBuilding[]> {
        const response = await this.makeRequest("getSmelter");
        return z.parse(
            z.array(FactoryBuildingSchema),
            FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response))
        );
    }

    public async getSwitches(): Promise<Switch[]> {
        const response = await this.makeRequest("getSwitches");
        return z.parse(z.array(SwitchSchema), FicsitRemoteMonitoring.formatBodyRaw(validateIsObjectArray(response)));
    }
}
