declare module 'bacstack' {
  export interface BacnetOptions {
    apduTimeout?: number;
    interface?: string;
    port?: number;
    broadcastAddress?: string;
  }

  export interface Device {
    deviceId: number;
    address: string;
    maxApdu?: number;
    segmentation?: number;
    vendorId?: number;
  }

  export interface ObjectId {
    type: number;
    instance: number;
  }

  export interface PropertyValue {
    values: Array<{
      value: any;
      type: number;
    }>;
  }

  export class Client {
    constructor(options?: BacnetOptions);
    
    on(event: 'iAm', listener: (device: Device) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    removeListener(event: string, listener: Function): this;
    
    whoIs(): void;
    readProperty(
      address: string,
      objectId: ObjectId,
      propertyId: number,
      callback: (error: Error | null, value: PropertyValue) => void
    ): void;
    close(): void;
  }

  export default Client;
}
