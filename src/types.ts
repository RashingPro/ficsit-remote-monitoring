import * as z from "zod";

export type MaybeArray<T> = T | T[];

export type HttpRequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export const ObjectSchema = z.looseObject({});
export const ObjectArraySchema = z.array(ObjectSchema);

export const ColorSchema = z.object({
    r: z.number(),
    g: z.number(),
    b: z.number(),
    a: z.number()
});
export type Color = z.infer<typeof ColorSchema>;

export const ChatMessageSchema = z.object({
    timeStamp: z.number(),
    serverTimeStamp: z.number(),
    sender: z.string(),
    type: z.enum(["System", "Ada", "Player"]),
    message: z.string(),
    color: ColorSchema
});
/**
 * @see https://docs.ficsit.app/ficsitremotemonitoring/latest/json/Read/getChatMessages.html
 */
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const SendChatMessageResponseSchema = z.object({
    isSent: z.boolean(),
    message: z.string()
});
export type SendChatMessageResponse = z.infer<typeof SendChatMessageResponseSchema>;

export const CoordinatesSchema = z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const LocationSchema = z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    rotation: z.number()
});
export type Location = z.infer<typeof CoordinatesSchema>;

export const HexColorSchema = z.string().length(8);
export type HexColor = z.infer<typeof HexColorSchema>;

export const ColorSlotSchema = z.object({
    primaryColor: HexColorSchema,
    secondaryColor: HexColorSchema
});
export type ColorSlot = z.infer<typeof ColorSlotSchema>;

export const BoundingBoxSchema = z.object({
    min: CoordinatesSchema,
    max: CoordinatesSchema
});
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

export const BaseActorSchema = z.object({
    id: z.string(),
    name: z.string(),
    className: z.string(),
    location: LocationSchema,
    features: z.object({
        properties: z.object({
            name: z.string(),
            type: z.string()
        }),
        geometry: z.object({
            coordinates: CoordinatesSchema,
            type: z.literal("Point")
        })
    })
});
export type BaseActor = z.infer<typeof BaseActorSchema>;

export const BaseBuildingSchema = BaseActorSchema.safeExtend({
    colorSlot: ColorSlotSchema,
    boundingBox: BoundingBoxSchema
});
export type BaseBuilding = z.infer<typeof BaseBuildingSchema>;

export const FactoryProductionSchema = z.object({
    name: z.string(),
    className: z.string(),
    amount: z.number(),
    currentProd: z.number(),
    maxProd: z.number(),
    prodPercent: z.number()
});
export type FactoryProduction = z.infer<typeof FactoryProductionSchema>;

export const FactoryConsumptionSchema = z.object({
    name: z.string(),
    className: z.string(),
    amount: z.number(),
    currentConsumed: z.number(),
    maxConsumed: z.number(),
    consPercent: z.number()
});
export type FactoryConsumption = z.infer<typeof FactoryConsumptionSchema>;

export const PowerInfoSchema = z.object({
    circuitGroupID: z.number(),
    circuitID: z.number(),
    fuseTriggered: z.boolean(),
    powerConsumed: z.number(),
    maxPowerConsumed: z.number()
});
export type PowerInfo = z.infer<typeof PowerInfoSchema>;

export const FactoryBuildingSchema = BaseBuildingSchema.safeExtend({
    recipe: z.string(),
    recipeClassName: z.string(),
    production: z.array(FactoryProductionSchema),
    ingredients: z.array(FactoryConsumptionSchema),
    manuSpeed: z.number(),
    somersloops: z.number(),
    powerShards: z.number(),
    isConfigured: z.boolean(),
    isProducing: z.boolean(),
    isPaused: z.boolean(),
    powerInfo: PowerInfoSchema
});
export type FactoryBuilding = z.infer<typeof FactoryBuildingSchema>;

export const InventoryItemSchema = z.object({
    name: z.string(),
    className: z.string(),
    amount: z.number(),
    maxAmount: z.number()
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const InventorySchema = z.array(InventoryItemSchema);
export type Inventory = z.infer<typeof InventorySchema>;

export const PlayerSchema = BaseActorSchema.safeExtend({
    playerHP: z.number(),
    speed: z.number(),
    online: z.boolean(),
    dead: z.boolean(),
    inventory: InventorySchema
});
export type Player = z.infer<typeof PlayerSchema>;

export const SessionInfoSchema = z.object({
    sessionName: z.string(),
    isPaused: z.boolean(),
    dayLength: z.number(),
    nightLength: z.number(),
    passedDays: z.number(),
    numberOfDaysSinceLastDeath: z.number(),
    hours: z.number(),
    minutes: z.number(),
    seconds: z.number(),
    isDay: z.boolean(),
    totalPlayDuration: z.number(),
    totalPlayDurationText: z.string()
});
export type SessionInfo = z.infer<typeof SessionInfoSchema>;

export const SwitchSchema = BaseBuildingSchema.safeExtend({
    switchTag: z.string(),
    isOn: z.boolean(),
    connected0: z.number().transform(v => v == 1),
    connected1: z.number().transform(v => v == 1),
    primary: z.number(),
    secondary: z.number(),
    priority: z.number()
});
export type Switch = z.infer<typeof SwitchSchema>;

export interface SetSwitchParams {
    id: string;
    name?: string;
    priority?: number;
    status?: boolean;
}

export const SetSwitchResponseSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    status: z.boolean().optional(),
    priority: z.number().optional()
});
export type SetSwitchResponse = z.infer<typeof SetSwitchResponseSchema>;

export interface SendChatMessageParams {
    message: string;
    options?: Partial<{ sender: "" | "ada" | string; color: Color }>;
}

export interface SetEnabledParams {
    id: string;
    status?: boolean;
}

export const SetEnabledResponseSchema = z.object({
    id: z.string(),
    status: z.boolean()
});
export type SetEnabledResponse = z.infer<typeof SetEnabledResponseSchema>;
