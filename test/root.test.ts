import FicsitRemoteMonitoring from "@/index";

function mockFetch(response: { status: number } & Partial<Response>): void;
function mockFetch(error: Error): void;

function mockFetch(responseOrError: ({ status: number } & Partial<Response>) | Error) {
    if (responseOrError instanceof Error) {
        jest.spyOn(globalThis, "fetch").mockRejectedValue(responseOrError);
    } else {
        if (!responseOrError.ok && responseOrError.status) {
            // @ts-expect-error Response type contains readonly fields, but we want to modify it
            responseOrError.ok = responseOrError.status < 300 && responseOrError.status >= 200;
        }
        jest.spyOn(globalThis, "fetch").mockResolvedValue(responseOrError as Response);
    }
}

class TestFicsitRemoteMonitoring extends FicsitRemoteMonitoring {
    public static override buildUrl(baseUrl: string, endpoint: string) {
        return super.buildUrl(baseUrl, endpoint);
    }
}

const baseUrl = "http://localhost";
const port = 8080;
const token = "SomeRandomTextGoesHere";

describe("Root test suit", () => {
    let testEnv: TestFicsitRemoteMonitoring;
    beforeEach(() => {
        testEnv = new TestFicsitRemoteMonitoring(port, token, baseUrl);
        jest.restoreAllMocks();
    });

    describe("buildUrl() tests", () => {
        function baseTest(baseUrl: string, endpoint: string, expected: string) {
            return () => {
                expect(TestFicsitRemoteMonitoring.buildUrl(baseUrl, endpoint)).toBe(expected);
            };
        }

        it("/ + not slash", () => {
            baseTest("http://localhost/", "abc", "http://localhost/abc")();
        });

        it("not slash + /", () => {
            baseTest("http://localhost", "/abc", "http://localhost/abc")();
        });

        it("/ + /", () => {
            baseTest("http://localhost/", "/abc", "http://localhost/abc")();
        });

        it("not slash + not slash", () => {
            baseTest("http://localhost", "abc", "http://localhost/abc")();
        });
    });

    describe("API tests", () => {
        it("Ping API", async () => {
            mockFetch({
                status: 404,
                json: async () => ({ error: "No matching endpoint found." })
            });
            await testEnv.ping();
            expect(fetch).toHaveBeenCalledWith(`${baseUrl}:${port}/ping`, expect.any(Object));
        });

        it("Ping API (error)", async () => {
            const err = new AggregateError([new Error()]);
            // @ts-expect-error If connection fails, AggregateError actually has `code` property
            err["code"] = "ECONNREFUSED";
            mockFetch(new TypeError("fetch failed", { cause: err }));
            // eslint-disable-next-line no-control-regex
            await expect(testEnv.ping()).rejects.toThrow(/.*Is the Ficsit Remote Monitoring server running\?\[0m$/);
        });

        it("/createPing", async () => {
            mockFetch({
                status: 200,
                json: async () => []
            });
            await testEnv.createPing({ x: 10, y: 10, z: 10 });
            expect(fetch).toHaveBeenCalledWith(`${baseUrl}:${port}/createPing`, expect.any(Object));
        });

        it("/setEnabled", async () => {
            mockFetch({
                status: 200,
                json: async () => [
                    {
                        ID: "Build_ConstructorMk1_C_0",
                        Status: true
                    }
                ]
            });
            await testEnv.setEnabled("Build_ConstructorMk1_C_0", true);
            expect(fetch).toHaveBeenCalledWith(`${baseUrl}:${port}/setEnabled`, expect.any(Object));
        });

        it("/getChatMessages", async () => {
            mockFetch({
                status: 200,
                json: async () => [
                    {
                        TimeStamp: 0,
                        ServerTimeStamp: 0,
                        Sender: "",
                        Type: "System",
                        Message: "HTTP Service Initiated on Port: 8080",
                        Color: {
                            R: 0,
                            G: 1,
                            B: 0,
                            A: 1
                        }
                    },
                    {
                        TimeStamp: 0,
                        ServerTimeStamp: 0,
                        Sender: "",
                        Type: "System",
                        Message: "Stopping HTTP Service.",
                        Color: {
                            R: 1,
                            G: 1,
                            B: 1,
                            A: 1
                        }
                    }
                ]
            });
            await testEnv.getChatMessages();
            expect(fetch).toHaveBeenCalledWith(`${baseUrl}:${port}/getChatMessages`, expect.any(Object));
        });

        it("/getFactory", async () => {
            mockFetch({
                status: 200,
                json: async () => [
                    {
                        id: "Build_ConstructorMk1_C_0",
                        name: "Some random thing",
                        className: "Build_ConstructorMk1_C",
                        location: {
                            x: 0.12345,
                            y: -0.12345,
                            z: 0.67891,
                            rotation: 90
                        },
                        boundingBox: {
                            min: { x: 0.12345, y: -0.12345, z: 0.67891 },
                            max: { x: 0.12345, y: -0.12345, z: 0.67891 }
                        },
                        colorSlot: { primaryColor: "FA954900", secondaryColor: "5F668C00" },
                        recipe: "Unassigned",
                        recipeClassName: "",
                        production: [
                            {
                                name: "Unassigned",
                                className: "Unassigned",
                                amount: 0,
                                currentProd: 0,
                                maxProd: 0,
                                prodPercent: 0
                            }
                        ],
                        ingredients: [
                            {
                                name: "Unassigned",
                                className: "Unassigned",
                                amount: 0,
                                currentConsumed: 0,
                                maxConsumed: 0,
                                consPercent: 0
                            }
                        ],
                        inputInventory: [],
                        outputInventory: [],
                        productivity: 0,
                        manuSpeed: 100,
                        somersloops: 0,
                        powerShards: 0,
                        isConfigured: false,
                        isProducing: false,
                        isPaused: true,
                        powerInfo: {
                            circuitGroupID: -1,
                            circuitID: -1,
                            fuseTriggered: false,
                            powerConsumed: 0,
                            maxPowerConsumed: 0
                        },
                        features: {
                            properties: { name: "Some random thing", type: "Some random thing" },
                            geometry: {
                                coordinates: { x: 0.12345, y: -0.12345, z: 0.67891 },
                                type: "Point"
                            }
                        }
                    }
                ]
            });
            await testEnv.getFactory();
            expect(fetch).toHaveBeenCalledWith(`${baseUrl}:${port}/getFactory`, expect.any(Object));
        });
    });
});
