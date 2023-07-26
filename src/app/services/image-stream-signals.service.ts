import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { PacketFormat } from '../interfaces';
import { API_URL } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class ImageStreamSignalsService {
  error = signal<string | null>(null);
  isImageLoaded = signal<boolean>(false);
  private eventSource?: EventSource;
  private pictureData: PacketFormat[] = [];
  private isStreamEndedSubject: Subject<boolean> = new Subject<boolean>();
  private completeImageBlobUrl: string | null = '';
  private zone = inject(NgZone);

  startImageStream(testNumber: number): Observable<boolean> {
    this.destroyBlobUrl();

    const url = `${API_URL}?testNumber=${testNumber}`;
    this.eventSource = new EventSource(url);
    this.isImageLoaded.set(true);
    this.error.set(null);

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
      this.error.update(() => errMessage);
      this.isImageLoaded.set(false);
      this.isStreamEndedSubject.next(true);
      this.closeStream();
    };

    return this.isStreamEndedSubject.asObservable();
  }

  private closeStream() {
    if (this.eventSource) {
      this.eventSource.close();
      this.pictureData = [];
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
