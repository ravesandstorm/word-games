export interface DefaultServerStatus {
    mongoAvailable: boolean;
    dictionarySize: number;
    timestamp: string;
}

export interface WordleServerStatus {
    mongoAvailable: boolean;
    wordleDictionarySize: number;
    timestamp: string;
}