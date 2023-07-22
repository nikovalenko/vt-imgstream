export interface StreamStatus {
  isEnded: boolean;
}

export interface PacketFormat {
  pictureSize: number;
  frameOffset: number;
  frameData: string;
}
