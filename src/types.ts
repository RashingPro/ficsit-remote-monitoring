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
