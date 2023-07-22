import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageDisplayComponent } from './image-display.component';
import { Subscription, of } from 'rxjs';
import { ImageStreamService } from '../../services/image-stream.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ImageDisplayComponent', () => {
  let component: ImageDisplayComponent;
  let fixture: ComponentFixture<ImageDisplayComponent>;
  let imageStreamService: ImageStreamService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatCardModule,
        MatProgressSpinnerModule,
        BrowserAnimationsModule,
      ],
      providers: [ImageStreamService],
      declarations: [ImageDisplayComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageDisplayComponent);
    component = fixture.componentInstance;
    imageStreamService = TestBed.inject(ImageStreamService);

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // Test the form submission behavior
  it('should call startStream() when the form is submitted', () => {
    spyOn(component, 'startStream');
    const form = fixture.debugElement.query(By.css('form.form'));
    form.triggerEventHandler('ngSubmit', null);
    expect(component.startStream).toHaveBeenCalled();
  });

  // Test the disabled state of the submit button
  it('should disable the submit button when isImageLoaded$ is true', () => {
    component.isImageLoaded$ = of(true);
    fixture.detectChanges();
    const submitButton = fixture.debugElement.query(
      By.css('button[type="submit"]')
    );
    expect(submitButton.nativeElement.disabled).toBe(true);
  });

  // Test the spinner visibility
  it('should show the spinner when isImageLoaded$ is true', () => {
    component.isImageLoaded$ = of(true);
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.css('.spinner'));
    expect(spinner).toBeTruthy();
  });

  // Test the error message visibility
  it('should show the error message when error$ is not null', () => {
    const error = 'Test error message';
    component.error$ = of(error);
    fixture.detectChanges();
    const errorMessage = fixture.debugElement.query(By.css('mat-error'));
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.nativeElement.textContent).toContain(error);
  });

  // Test the image card visibility and resolution display
  it('should show the image card with resolution when all conditions are met', () => {
    component.imageStreamSubscription = new Subscription();
    component.completeImageBlobUrl = 'test-image-url';
    component.isImageLoaded$ = of(false);

    fixture.detectChanges();

    const imgCard = fixture.debugElement.query(By.css('.img-container'));
    expect(imgCard).toBeTruthy();

    const image = fixture.debugElement.query(By.css('img'));
    expect(image).toBeTruthy();

    component.imageWidth = 100;
    component.imageHeight = 200;
    fixture.detectChanges();

    const resolutionText = fixture.debugElement.query(
      By.css('.img-container p')
    );
    expect(resolutionText.nativeElement.textContent).toContain(
      'Picture resolution: 100 x 200'
    );
  });

  it('should start image stream on form submission', () => {
    const testNumber = 42;
    const mockImageStream = of(true);

    spyOn(imageStreamService, 'startImageStream').and.returnValue(
      mockImageStream
    );

    component.testNumber = testNumber;
    component.startStream();

    expect(imageStreamService.startImageStream).toHaveBeenCalledWith(
      testNumber
    );
  });
});
