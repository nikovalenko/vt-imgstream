import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { API_URL } from '../constants';
import { PacketFormat } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ImageStreamService {
  private eventSource?: EventSource;
  private pictureData: PacketFormat[] = [];
  private errorSubject: Subject<string | null> = new Subject<string | null>();
  private isStreamEndedSubject: Subject<boolean> = new Subject<boolean>();
  private isImageLoadedSubject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  private completeImageBlobUrl: string | null = '';

  constructor(private zone: NgZone) {}

  startImageStream(testNumber: number): Observable<boolean> {
    this.destroyBlobUrl();

    const url = `${API_URL}?testNumber=${testNumber}`;
    this.eventSource = new EventSource(url);
    this.isImageLoadedSubject.next(true);
    this.errorSubject.next(null);

    // EventSource "onmessage" handler
    this.eventSource.onmessage = (event: MessageEvent) => {
      this.zone.run(() => {
        const eventData: PacketFormat = JSON.parse(event.data);
        this.pictureData.push(eventData);
        this.isStreamEndedSubject.next(false);
      });
    };

    // EventSource "onerror" handler
    this.eventSource.onerror = (_error: Event) => {
      const errMessage = !this.pictureData.length ? 'Picture not found.' : null;
      this.errorSubject.next(errMessage);
      this.isImageLoadedSubject.next(false);
      this.isStreamEndedSubject.next(true);
      this.closeStream();
    };

    return this.isStreamEndedSubject.asObservable();
  }

  getErrorObservable(): Observable<string | null> {
    return this.errorSubject.asObservable();
  }

  isImageLoadedObservable(): Observable<boolean> {
    return this.isImageLoadedSubject.asObservable();
  }

  private closeStream() {
    if (this.eventSource) {
      this.eventSource.close();
      this.pictureData = [];
      // this.destroyBlobUrl();
    }
  }

  private createBlobUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  private destroyBlobUrl() {
    if (this.completeImageBlobUrl) {
      URL.revokeObjectURL(this.completeImageBlobUrl);
      this.completeImageBlobUrl = null;
    }
  }

  revokeCompleteImageBlobUrl() {
    this.destroyBlobUrl();
  }

  getCompleteImage(): string | null {
    if (this.pictureData.length > 0) {
      // Sort the packets based on their frameOffset
      this.pictureData.sort((a, b) => a?.frameOffset - b?.frameOffset);

      // Create an array of ArrayBuffer from the Base64 strings
      const imageChunks = this.pictureData.map((packet) =>
        this.base64ToArrayBuffer(packet.frameData)
      );

      // Calculate the total length of the complete ArrayBuffer
      let totalLength = 0;
      for (const chunk of imageChunks) {
        totalLength += chunk.byteLength;
      }

      // Create a new ArrayBuffer with the total length
      const completeArrayBuffer = new Uint8Array(totalLength);

      // Copy the chunks into the complete ArrayBuffer
      let offset = 0;
      for (const chunk of imageChunks) {
        completeArrayBuffer.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      // Create a Blob from the complete ArrayBuffer
      const completeImageBlob = new Blob([completeArrayBuffer], {
        type: 'image/jpeg',
      });

      // Generate a Blob URL for the complete image
      this.completeImageBlobUrl = this.createBlobUrl(completeImageBlob);
    }

    return this.completeImageBlobUrl;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; ++i) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
