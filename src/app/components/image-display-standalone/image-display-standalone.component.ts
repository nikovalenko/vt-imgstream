import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ImageStreamSignalsService } from '../../services/image-stream-signals.service';

@Component({
  selector: 'app-image-display-standalone',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './image-display-standalone.component.html',
  styleUrls: ['./image-display-standalone.component.css'],
})
export class ImageDisplayStandaloneComponent {
  testNumber = signal<number>(0);
  imageWidth = signal<number>(0);
  imageHeight = signal<number>(0);
  completeImageBlobUrl = signal<string | null>(null);
  imageStreamSubscription = signal<Subscription | null>(null);
  isLiveStreaming = signal<boolean>(true);
  private ImageStreamSignalsService = inject(ImageStreamSignalsService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  error = this.ImageStreamSignalsService.error;
  isImageLoaded = this.ImageStreamSignalsService.isImageLoaded;

  isShowImage = computed(
    () =>
      !!(
        this.imageStreamSubscription() &&
        this.completeImageBlobUrl() &&
        (this.isLiveStreaming() || !this.isImageLoaded())
      )
  );

  isLoading = computed(
    () => !!(!this.isLiveStreaming() && this.isImageLoaded())
  );

  ngOnDestroy() {
    this.unsubscribe();
  }

  updateIsLive() {
    this.isLiveStreaming.update((prev) => !prev);
  }

  updateImageHWEffect = effect(() => {
    const url = this.completeImageBlobUrl();
    const h = this.imageHeight();
    const w = this.imageWidth();
    if (url && !h && !w) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.imageHeight.set(img.height);
        this.imageWidth.set(img.width);
      };
    }
  });

  updateTestNumber(e: Event) {
    const inputElement = e.target as HTMLInputElement;
    const inputValue = inputElement.value;
    this.testNumber.update(() => +inputValue);
  }

  update() {
    this.completeImageBlobUrl.set(
      this.ImageStreamSignalsService.getCompleteImage()
    );
  }

  unsubscribe() {
    const imgStreamSub = this.imageStreamSubscription();
    if (imgStreamSub) {
      imgStreamSub.unsubscribe();
    }
    this.changeDetector.detectChanges();
  }

  startStream() {
    this.imageStreamSubscription.set(
      this.ImageStreamSignalsService.startImageStream(
        this.testNumber()
      ).subscribe((isEnded: boolean) => {
        this.update();
        if (isEnded) {
          this.unsubscribe();
        }
      })
    );
  }
}
