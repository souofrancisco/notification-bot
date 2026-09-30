export interface MessageChannel {
  readonly name: string;
  isReady(): boolean;
  send(destination: string, message: string): Promise<boolean>;
}
