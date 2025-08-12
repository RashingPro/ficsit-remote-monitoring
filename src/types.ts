export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * @see https://docs.ficsit.app/ficsitremotemonitoring/latest/json/Read/getChatMessages.html
 */
export interface ChatMessage {
    timeStamp: number;
    serverTimeStamp: number;
    sender: string;
    type: "System" | "Ada" | "Player";
    message: string;
    color: Color;
}

export interface Coordinates {
    x: number;
    y: number;
    z: number;
}

export interface Location {
    x: number;
    y: number;
    z: number;
    rotation: number;
}

export type HexColor =
    `#${string}`;

export interface ColorSlot {
    primaryColor: HexColor;
    secondaryColor: HexColor;
}

export interface BoundingBox {
    min: Coordinates;
    max: Coordinates;
}

export interface BaseActor {
    id: string;
    name: string;
    className: string;
    location: Location;
    features: {
        properties: {
            name: string;
            type: string;
        };
        geometry: {
            coordinates: Coordinates;
            type: "Point";
        };
    };
}

export interface BaseBuilding extends BaseActor {
    colorSlot: ColorSlot;
    boundingBox: BoundingBox;
}

export interface InventoryItem {
    name: string;
    className: string;
    amount: number;
    maxAmount: number;
}

export type Inventory = InventoryItem[];

export interface Player extends BaseActor {
    playerHP: number;
    speed: number;
    online: boolean;
    dead: boolean;
    inventory: Inventory;
}

export interface SessionInfo {
    sessionName: string;
    isPaused: boolean;
    dayLength: number;
    nightLength: number;
    passedDays: number;
    numberOfDaysSinceLastDeath: number;
    hours: number;
    minutes: number;
    seconds: number;
    isDay: boolean;
    totalPlayDuration: number;
    totalPlayDurationText: string;
}
