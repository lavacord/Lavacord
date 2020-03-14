import { EventEmitter } from "events";
import { LavalinkNode } from "./LavalinkNode";
import { Manager } from "./Manager";
import { LavalinkEvent, LavalinkPlayerState, PlayerEqualizerBand, PlayerOptions, PlayerPlayOptions, PlayerState, PlayerUpdateVoiceState } from "./Types";

export class Player extends EventEmitter {

    public manager: Manager;
    public id: string;
    public state: PlayerState;
    public playing: boolean;
    public timestamp: number | null;
    public paused: boolean;
    public track: string | null;
    public voiceUpdateState: PlayerUpdateVoiceState | null;

    public constructor(public node: LavalinkNode, options: PlayerOptions) {
        super();

        this.manager = this.node.manager;
        this.id = options.id;

        this.state = { volume: 100, equalizer: [] };
        this.playing = false;
        this.timestamp = null;
        this.paused = false;
        this.track = null;
        this.voiceUpdateState = null;

        this.on("event", data => {
            switch (data.type) {
                case "TrackEndEvent":
                    if (data.reason !== "REPLACED") this.playing = false;
                    this.track = null;
                    this.timestamp = null;
                    if (this.listenerCount("end")) this.emit("end", data);
                    break;
                case "TrackExceptionEvent":
                    if (this.listenerCount("error")) this.emit("error", data);
                    break;
                case "TrackStuckEvent":
                    this.stop();
                    if (this.listenerCount("end")) this.emit("end", data);
                    break;
                case "WebSocketClosedEvent":
                    if (this.listenerCount("error")) this.emit("error", data);
                    break;
                default:
                    if (this.listenerCount("warn")) this.emit("warn", `Unexpected event type: ${data.type}`);
                    break;
            }
        })
            .on("playerUpdate", data => {
                this.state = { volume: this.state.volume, equalizer: this.state.equalizer, ...data.state };
            });
    }

    public async play(track: string, options: PlayerPlayOptions = {}): Promise<boolean> {
        const d = await this.send("play", { ...options, track });
        this.track = track;
        this.playing = true;
        this.timestamp = Date.now();
        return d;
    }

    public async stop(): Promise<boolean> {
        const d = await this.send("stop");
        this.playing = false;
        this.timestamp = null;
        return d;
    }

    public async pause(pause: boolean): Promise<boolean> {
        const d = await this.send("pause", { pause });
        this.paused = pause;
        return d;
    }

    public resume(): Promise<boolean> {
        return this.pause(false);
    }

    public async volume(volume: number): Promise<boolean> {
        const d = await this.send("volume", { volume });
        this.state.volume = volume;
        return d;
    }

    public seek(position: number): Promise<boolean> {
        return this.send("seek", { position });
    }

    public async equalizer(bands: PlayerEqualizerBand[]): Promise<boolean> {
        const d = await this.send("equalizer", { bands });
        this.state.equalizer = bands;
        return d;
    }

    public destroy(): Promise<boolean> {
        return this.send("destroy");
    }

    public connect(data: PlayerUpdateVoiceState): Promise<boolean> {
        this.voiceUpdateState = data;
        return this.send("voiceUpdate", data);
    }

    private send(op: string, data?: object): Promise<boolean> {
        if (!this.node.connected) return Promise.reject(new Error("No available websocket connection for selected node."));
        return this.node.send({
            ...data,
            op,
            guildId: this.id
        });
    }

}

export interface Player {
    on(event: "event", listener: (data: LavalinkEvent) => void): this;
    on(event: "end", listener: (data: LavalinkEvent) => void): this;
    on(event: "error", listener: (error: LavalinkEvent) => void): this;
    on(event: "warn", listener: (warning: string) => void): this;
    on(event: "playerUpdate", listener: (data: { state: LavalinkPlayerState; }) => void): this;

    once(event: "event", listener: (data: LavalinkEvent) => void): this;
    once(event: "end", listener: (data: LavalinkEvent) => void): this;
    once(event: "error", listener: (error: LavalinkEvent) => void): this;
    once(event: "warn", listener: (warning: string) => void): this;
    once(event: "playerUpdate", listener: (data: { state: LavalinkPlayerState; }) => void): this;

    off(event: "event", listener: (data: LavalinkEvent) => void): this;
    off(event: "end", listener: (data: LavalinkEvent) => void): this;
    off(event: "error", listener: (error: LavalinkEvent) => void): this;
    off(event: "warn", listener: (warning: string) => void): this;
    off(event: "playerUpdate", listener: (data: { state: LavalinkPlayerState; }) => void): this;

    emit(event: "event", data: LavalinkEvent): boolean;
    emit(event: "end", data: LavalinkEvent): boolean;
    emit(event: "error", error: LavalinkEvent): boolean;
    emit(event: "warn", warning: string): boolean;
    emit(event: "playerUpdate", data: { state: LavalinkPlayerState; }): boolean;
}
