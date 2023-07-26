import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ComponentsModule } from './components/components.module';
import { ImageDisplayStandaloneComponent } from './components/image-display-standalone/image-display-standalone.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ComponentsModule,
    ImageDisplayStandaloneComponent,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
