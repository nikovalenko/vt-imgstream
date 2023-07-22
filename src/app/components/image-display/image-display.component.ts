import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { ImageStreamService } from '../../services/image-stream.service';

@Component({
  selector: 'app-image-display',
  templateUrl: './image-display.component.html',
  styleUrls: ['./image-display.component.css'],
})
export class ImageDisplayComponent implements OnInit {
  public testNumber: number = 0;
  public imageWidth: number = 0;
  public imageHeight: number = 0;
  public completeImageBlobUrl?: string | null;
  public imageStreamSubscription?: Subscription | null;
  public error$?: Observable<string | null>;
  public isImageLoaded$?: Observable<boolean>;

  constructor(
    private imageStreamService: ImageStreamService,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.error$ = this.imageStreamService.getErrorObservable();
    this.isImageLoaded$ = this.imageStreamService.isImageLoadedObservable();
  }

  ngOnDestroy() {
    if (this.imageStreamSubscription) {
      this.imageStreamSubscription.unsubscribe();
    }
  }

  private updateImageHW() {
    if (this.completeImageBlobUrl) {
      const img = new Image();
      img.src = this.completeImageBlobUrl;
      img.onload = () => {
        this.imageHeight = img.height;
        this.imageWidth = img.width;
        this.changeDetector.detectChanges();
      };
    }
  }

  updateUnsubscribe() {
    this.completeImageBlobUrl = this.imageStreamService.getCompleteImage();
    this.updateImageHW();
    this.changeDetector.detectChanges();
    if (this.imageStreamSubscription) {
      this.imageStreamSubscription.unsubscribe();
    }
  }

  startStream() {
    this.imageStreamSubscription = this.imageStreamService
      .startImageStream(this.testNumber)
      .subscribe((isEnded: boolean) => {
        if (isEnded) {
          this.updateUnsubscribe();
        }
      });
  }
}
